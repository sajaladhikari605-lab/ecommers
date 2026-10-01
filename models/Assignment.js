const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    deadline: { type: Date, required: true },
    attachment: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Assignment", assignmentSchema);