const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    organizer: { type: String, required: true, trim: true },
    image: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);