const User = require("../../models/UserModel");
const bcrypt = require("bcrypt");
const sendEmail = require("../../services/sendemail");
const jwt = require("jsonwebtoken");

const getRequestBody = (req) => {
    return req.body && typeof req.body === "object" ? req.body : {};
};

const toPublicUser = (user) => ({
    id: user._id,
    userEmail: user.userEmail,
    userName: user.userName,
    userPhoneNumber: user.userPhoneNumber,
    userRole: user.userRole === "seller" ? "admin" : user.userRole === "customer" ? "student" : user.userRole,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    address: user.address,
    profilePicture: user.profilePicture
});

// Regiser User

/*
1. Accept form data
2. Validate form data
3. Check if user already exists
4. Hash the password
5. Create a new user in the database
6. Send a response to the client
*/

const registerUser = async (req, res) => {
    const { userPhoneNumber, userName, userPassword, gender, dateOfBirth, address } = getRequestBody(req);
    const userEmail = getRequestBody(req).userEmail?.trim().toLowerCase();
    if (!userEmail || !userPhoneNumber || !userName || !userPassword) {
        return res.status(400).json({
            message: "All fields are required"
        })
    }

    if (typeof userPassword !== "string" || userPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existingUser = await User.findOne({
        $or: [{ userEmail }, { userPhoneNumber }]
    })

    if (existingUser) {
        return res.status(409).json({
            message: "An account with this email or phone number already exists"
        })
    }

    await User.create({
        userEmail,
        userPhoneNumber,
        userName,
        userPassword: await bcrypt.hash(userPassword, 10),
        gender,
        dateOfBirth,
        address,
        userRole: "student"
    })

    sendEmail({
        userEmail,
        subject: "Welcome to Smart College Management System",
        text: `Hi ${userName},\n\nYour student account has been created.\n\nSmart College Management System`
    })

    return res.status(201).json({
        message: "User registered successfully"
    })
}

// Login User

/*
1. Accept form data
2. Validate form data
3. Check if user exists
4. Compare the password with the hashed password in the database
5. Send a response to the client
*/
const loginUser = async (req, res) => {
    const { userPassword } = getRequestBody(req);
    const userEmail = getRequestBody(req).userEmail?.trim().toLowerCase();

    if (!userEmail || !userPassword) {
        return res.status(400).json({
            message: "All fields are required"
        })
    }

    const existingUser = await User.findOne({ // Object from the database
        userEmail
    })

    if (!existingUser) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    if (!existingUser.isActive) {
        return res.status(403).json({ message: "This account has been deactivated" });
    }

    const isPasswordValid = await bcrypt.compare(userPassword, existingUser.userPassword);

    if (!isPasswordValid) {
        return res.status(401).json({
            message: "Invalid password or email"
        })
    }

    // JWT token generation logic can be implemented here
    const token = jwt.sign({
        userId: existingUser._id,
        tokenVersion: existingUser.tokenVersion || 0
    }, process.env.JWT_SECRET, {
        expiresIn: "30d"
    })

    return res.status(200).json({
        message: "Login successful",
        token,
        user: toPublicUser(existingUser)
    })
}

const getCurrentUser = async (req, res) => {
    return res.status(200).json({ success: true, data: toPublicUser(req.user) });
};

const updateCurrentUser = async (req, res) => {
    const allowedFields = ["userName", "userEmail", "userPhoneNumber", "gender", "dateOfBirth", "address", "profilePicture"];
    const updates = Object.fromEntries(allowedFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    if (updates.userEmail !== undefined) updates.userEmail = String(updates.userEmail).trim().toLowerCase();
    if (updates.profilePicture && !/^\/uploads\/college\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(updates.profilePicture)) {
        return res.status(400).json({ success: false, message: "Invalid profile image reference" });
    }
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: "Provide at least one profile field to update" });
    if (updates.userEmail || updates.userPhoneNumber) {
        const duplicateQuery = [];
        if (updates.userEmail) duplicateQuery.push({ userEmail: updates.userEmail });
        if (updates.userPhoneNumber) duplicateQuery.push({ userPhoneNumber: updates.userPhoneNumber });
        const duplicate = await User.findOne({ $or: duplicateQuery, _id: { $ne: req.user._id } }).select("_id");
        if (duplicate) return res.status(409).json({ success: false, message: "Email or phone number is already in use" });
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    return res.json({ success: true, message: "Profile updated", data: toPublicUser(user) });
};

const changeCurrentPassword = async (req, res) => {
    const { currentPassword, newPassword } = getRequestBody(req);
    if (!currentPassword || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ success: false, message: "Provide your current password and a new password of at least 8 characters" });
    }
    const valid = await bcrypt.compare(currentPassword, req.user.userPassword);
    if (!valid) return res.status(401).json({ success: false, message: "Current password is incorrect" });
    req.user.userPassword = await bcrypt.hash(newPassword, 10);
    req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
    await req.user.save();
    const token = jwt.sign({ userId: req.user._id, tokenVersion: req.user.tokenVersion }, process.env.JWT_SECRET, { expiresIn: "30d" });
    return res.json({ success: true, message: "Password updated and other sessions signed out", token });
};

const logoutUser = async (req, res) => {
    req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
    await req.user.save();
    return res.status(200).json({ success: true, message: "Logged out successfully" });
};

// Forgot Password and Send OTP

/*
1. Accept email from the client
2. Validate email
3. Check if user exists
4. Generate OTP and save it in the database
5. Send OTP to the user's email
6. Send a response to the client
*/

const forgotPassword = async (req, res) => {
    const { userEmail } = getRequestBody(req);
    if (!userEmail) {
        return res.status(400).json({
            message: "Email is required"
        })
    }
    const existingUser = await User.findOne({ 
        userEmail
    });

    if (!existingUser) {
        return res.status(400).json({
            message: "User not found! Try registering instead"
        })
    }

    // Generate OTP and send it to the user's email
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
    existingUser.otp = otp;
    await existingUser.save();

    const options = {
        userEmail,
        subject: "Your OTP for Password Reset",
        text: `Your OTP for password reset is ${otp}. It is valid for 10 minutes.`,
        html: `<h1>Your OTP for password reset is <b>${otp}</b>. It is valid for 10 minutes.</h1>`
    }
    await sendEmail(options);

    return res.status(200).json({
        message: "OTP sent to email"
    })
}

// Verify OTP

const verifyOtp = async (req, res) => {
    const { userEmail, otp } = getRequestBody(req);
    if (!userEmail || !otp) {
        return res.status(400).json({
            message: "Email and OTP are required"
        })
    }

    const existingUser = await User.findOne({ // Object from the database
        userEmail
    })

    if (!existingUser) {
        return res.status(400).json({
            message: "User not found! Try registering instead"
        })
    }
    console.log(typeof(existingUser.otp),typeof(otp))
    const isOtpValid = existingUser.otp == otp;
    if (!isOtpValid) {
        return res.status(400).json({
            message: "Invalid OTP"
        })
    }

    // OTP expiry logic can be implemented here
    // OTP expiry time is 2 minutes
    const otpExpiryTime = 2 * 60 * 1000; // 2 minutes in milliseconds
    const currentTime = Date.now();
    const otpGeneratedTime = existingUser.updatedAt.getTime();
    const diff = currentTime - otpGeneratedTime;
    if (diff > otpExpiryTime) {
        existingUser.otp = null; // Clear the OTP after expiry
        await existingUser.save();

        return res.status(400).json({
            message: "OTP expired! Please generate a new one"
        })
    }

    existingUser.isOtpVerified = true; // Mark OTP as verified
    existingUser.otp = null; // Clear the OTP after successful verification
    await existingUser.save();

    // OTP is valid, allow the user to reset the password
    return res.status(200).json({
        message: "OTP verified successfully"
    })
}

// Reset Password
const resetPassword = async (req, res) => {
    const { userEmail, newPassword, confirmPassword } = getRequestBody(req);
    if (!userEmail || !newPassword || !confirmPassword) {
        return res.status(400).json({
            message: "Email and new password are required"
        })
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            message: "New password and confirm password do not match"
        })
    }
    const existingUser = await User.findOne({ // Object from the database
        userEmail
    })

    if (!existingUser) {
        return res.status(400).json({
            message: "User not found! Try registering instead"
        })
    }

    if (!existingUser.isOtpVerified) {
        return res.status(400).json({
            message: "OTP not verified! Please verify OTP before resetting password"
        })
    }

    // User must change password within 10 minutes of OTP verification
    const otpVerificationTime = existingUser.updatedAt.getTime();
    const currentTime = Date.now();
    const diff = currentTime - otpVerificationTime;
    const passwordResetExpiryTime = 10 * 60 * 1000; // 10 minutes in milliseconds
    if (diff > passwordResetExpiryTime) {
        existingUser.isOtpVerified = false; // Reset OTP verification status after expiry
        await existingUser.save();

        return res.status(400).json({
            message: "Password reset time expired! Please generate a new OTP"
        })
    }

    existingUser.userPassword = await bcrypt.hash(newPassword, 10);
    existingUser.isOtpVerified = false;
    existingUser.tokenVersion = (existingUser.tokenVersion || 0) + 1;
    await existingUser.save();

    return res.status(200).json({
        message: "Password reset successful"
    })
}

// Logout User



module.exports = {

    registerUser,
    loginUser,
    getCurrentUser,
    updateCurrentUser,
    changeCurrentPassword,
    logoutUser,
  forgotPassword,
    verifyOtp,
    resetPassword
}
