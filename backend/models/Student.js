const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, unique: true },
    studentId: { type: String, required: true, trim: true, unique: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    program: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1 },
    section: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    admissionDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);