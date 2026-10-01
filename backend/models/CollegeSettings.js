const mongoose = require("mongoose");

const collegeSettingsSchema = new mongoose.Schema({
    key: { type: String, default: "college", unique: true, immutable: true },
    collegeName: { type: String, required: true, trim: true },
    collegeLogo: { type: String, default: "" },
    academicYear: { type: String, required: true, trim: true },
    currentSemester: { type: Number, required: true, min: 1 },
    gradingScale: {
        type: [{
            grade: { type: String, enum: ["A", "B", "C", "D", "F"], required: true },
            minimumPercentage: { type: Number, min: 0, max: 100, required: true }
        }],
        default: [
            { grade: "A", minimumPercentage: 90 },
            { grade: "B", minimumPercentage: 80 },
            { grade: "C", minimumPercentage: 70 },
            { grade: "D", minimumPercentage: 60 },
            { grade: "F", minimumPercentage: 0 }
        ]
    },
    contactInformation: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("CollegeSettings", collegeSettingsSchema);