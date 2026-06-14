const User = require("../../models/UserModel");


//  register user
const registerUser = async (req, res) => {
    const { userEmail, userPhoneNumber, userName, userPassword } = req.body;
    if (!userEmail || !userPhoneNumber || !userName || !userPassword) {
        return res.status(400).json({
            message: "All fields are required"
        })
    }

    const existingUser = await User.findOne({
        userEmail
    })

    if (existingUser) {
        return res.status(400).json({
            message: "User already exists"
        })
    }

    await User.create({
        userEmail,
        userPhoneNumber,
        userName,
        userPassword
    })

    return res.status(201).json({
        message: "User registered successfully"
    })
}





// login user













// reset password






// log out



module.exports={
 
    registerUser
}
