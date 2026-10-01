const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    courseCode: { type: String, required: true, trim: true, uppercase: true, unique: true },
    courseName: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    creditHours: { type: Number, required: true, min: 1, max: 12 },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    semester: { type: Number, required: true, min: 1 },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    courseType: { type: String, enum: ["Core", "Elective", "Lab"], default: "Core" }
}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);