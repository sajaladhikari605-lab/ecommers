
const { registerUser, loginUser, getCurrentUser, updateCurrentUser, changeCurrentPassword, logoutUser, forgotPassword, verifyOtp, resetPassword } = require('../../controller/auth/authController');
const catchAsync = require('../../services/catchAsync');
const isAuthenticated = require('../../middleware/isAuthenticated');

const router = require('express').Router();
router.route("/register").post(catchAsync(registerUser))
router.route("/login").post(catchAsync(loginUser))
router.route("/me").get(isAuthenticated, catchAsync(getCurrentUser))
router.route("/me").patch(isAuthenticated, catchAsync(updateCurrentUser))
router.route("/password").patch(isAuthenticated, catchAsync(changeCurrentPassword))
router.route("/logout").post(isAuthenticated, catchAsync(logoutUser))
router.route("/forgot-password").post(catchAsync(forgotPassword))
router.route("/verify-otp").post(catchAsync(verifyOtp))
router.route("/reset-password").post(catchAsync(resetPassword))











module.exports = router