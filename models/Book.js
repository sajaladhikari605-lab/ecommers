const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
    bookId: { type: String, required: true, trim: true, unique: true },
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, required: true, trim: true, unique: true },
    category: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    availableQuantity: { type: Number, required: true, min: 0 }
}, { timestamps: true });

bookSchema.path("availableQuantity").validate(function (value) { return value <= this.quantity; }, "Available quantity cannot exceed total quantity");

module.exports = mongoose.model("Book", bookSchema);