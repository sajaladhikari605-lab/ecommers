const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    attachment: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["Submitted", "Late", "Graded"], default: "Submitted" },
    marks: { type: Number, min: 0 },
    feedback: { type: String, trim: true, default: "" }
}, { timestamps: true });

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Submission", submissionSchema);