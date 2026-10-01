const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

// Middleware to check if the user is authenticated
const isAuthenticated = async(req, res, next) => {
    try {
        const authorization = req.headers.authorization
        const token = authorization?.startsWith('Bearer ')
            ? authorization.slice(7)
            : authorization
        if (!token) {
            return res.status(401).json({
                message: "No token provided, authorization denied"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded) {
            return res.status(401).json({
                message: "Token is not valid"
            })
        }

        const userId = decoded.userId
        const user = await User.findById(userId)
        if (!user || !user.isActive) {
            return res.status(401).json({
                message: "User not found, authorization denied"
            })
        }
        if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
            return res.status(401).json({ success: false, message: "This session has expired. Please sign in again" });
        }

        req.user = user
        next()
    } catch (err) {
        const isTokenError = ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(err.name);
        return res.status(isTokenError ? 401 : 500).json({
            success: false,
            message: isTokenError ? "Invalid or expired authentication token" : "Unable to verify your account"
        });
    }
}
module.exports = isAuthenticated