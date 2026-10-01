const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    semester: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true },
    fullMarks: { type: Number, required: true, min: 1 },
    passMarks: { type: Number, required: true, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }
}, { timestamps: true });

examSchema.path("passMarks").validate(function (value) {
    const fullMarks = typeof this.get === "function" ? this.get("fullMarks") : this.fullMarks;
    return fullMarks === undefined || value <= fullMarks;
}, "Pass marks cannot exceed full marks");

module.exports = mongoose.model("Exam", examSchema);