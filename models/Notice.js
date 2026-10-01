const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: ["General", "Exam", "Holiday", "Event", "Important", "Emergency"], default: "General" },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    date: { type: Date, default: Date.now },
    priority: { type: String, enum: ["Low", "Normal", "High", "Urgent"], default: "Normal" },
    attachment: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Notice", noticeSchema);