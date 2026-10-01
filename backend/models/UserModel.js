const mongoose = require ('mongoose');

const userSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true,
        unique: true
    },
    userPhoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    userName: {
        type: String,
        required: true
    },
    userPassword: {
        type: String,
        required: true
    },
    userRole: {
        type: String,
        enum: ['admin', 'teacher', 'student', 'accountant', 'seller', 'customer'],
        default: 'student'
    },
    gender: {
        type: String,
        enum: ['female', 'male', 'non-binary', 'prefer-not-to-say', '']
    },
    dateOfBirth: Date,
    address: String,
    profilePicture: String,
    isActive: {
        type: Boolean,
        default: true
    },
    tokenVersion: {
        type: Number,
        default: 0
    },
    cart: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    otp: {
        type: Number,
        default: null
    },
    isOtpVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

const User = mongoose.model('user', userSchema);

module.exports = User;