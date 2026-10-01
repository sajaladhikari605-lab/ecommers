const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema({
    day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], required: true },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    room: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1 },
    section: { type: String, required: true, trim: true }
}, { timestamps: true });

timetableSchema.path("endTime").validate(function (value) {
    const startTime = typeof this.get === "function" ? this.get("startTime") : this.startTime;
    return startTime === undefined || value > startTime;
}, "End time must be after start time");

module.exports = mongoose.model("Timetable", timetableSchema);