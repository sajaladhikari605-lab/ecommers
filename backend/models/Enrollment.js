const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    semester: { type: Number, required: true, min: 1 },
    academicYear: { type: String, required: true, trim: true },
    enrollmentDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "completed", "withdrawn"], default: "active" }
}, { timestamps: true });

enrollmentSchema.index({ student: 1, course: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);