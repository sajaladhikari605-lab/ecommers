const mongoose = require("mongoose");
const CollegeSettings = require("./CollegeSettings");

const markSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    theoryMarks: { type: Number, default: 0, min: 0 },
    practicalMarks: { type: Number, default: 0, min: 0 },
    total: { type: Number, min: 0 },
    percentage: { type: Number, min: 0, max: 100 },
    grade: { type: String, enum: ["A", "B", "C", "D", "F"] },
    result: { type: String, enum: ["Pass", "Fail"] }
}, { timestamps: true });

markSchema.index({ student: 1, exam: 1 }, { unique: true });
markSchema.pre("validate", async function () {
    const [exam, settings] = await Promise.all([
        mongoose.model("Exam").findById(this.exam).select("fullMarks passMarks course"),
        CollegeSettings.findOne({ key: "college" }).select("gradingScale")
    ]);
    if (!exam) {
        this.invalidate("exam", "Exam not found");
        return;
    }
    this.course = exam.course;
    this.total = Number(this.theoryMarks || 0) + Number(this.practicalMarks || 0);
    if (this.total > exam.fullMarks) this.invalidate("total", "Obtained marks cannot exceed full marks");
    this.percentage = Number(((this.total / exam.fullMarks) * 100).toFixed(2));
    const gradingScale = (settings?.gradingScale?.length ? settings.gradingScale : [
        { grade: "A", minimumPercentage: 90 },
        { grade: "B", minimumPercentage: 80 },
        { grade: "C", minimumPercentage: 70 },
        { grade: "D", minimumPercentage: 60 },
        { grade: "F", minimumPercentage: 0 }
    ]).sort((first, second) => second.minimumPercentage - first.minimumPercentage);
    this.grade = gradingScale.find((rule) => this.percentage >= rule.minimumPercentage)?.grade || "F";
    this.result = this.total >= exam.passMarks ? "Pass" : "Fail";
});

module.exports = mongoose.model("Mark", markSchema);