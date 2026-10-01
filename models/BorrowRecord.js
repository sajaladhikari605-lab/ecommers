const mongoose = require("mongoose");

const borrowRecordSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: Date,
    fine: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["Borrowed", "Returned", "Overdue"], default: "Borrowed" }
}, { timestamps: true });

module.exports = mongoose.model("BorrowRecord", borrowRecordSchema);