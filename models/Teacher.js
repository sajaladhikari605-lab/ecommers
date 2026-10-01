const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, unique: true },
    teacherId: { type: String, required: true, trim: true, unique: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    qualification: { type: String, required: true, trim: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    joiningDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Teacher", teacherSchema);