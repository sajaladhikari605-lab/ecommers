const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    feeType: { type: String, enum: ["Admission Fee", "Semester Fee", "Exam Fee", "Library Fee", "Lab Fee", "Other"], required: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    remainingAmount: { type: Number, min: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["Paid", "Partial", "Pending"], default: "Pending" },
    paymentDate: Date
}, { timestamps: true });

feeSchema.pre("validate", function () {
    if (this.paidAmount > this.amount) this.invalidate("paidAmount", "Paid amount cannot exceed the fee amount");
    this.remainingAmount = Math.max(0, Number(this.amount || 0) - Number(this.paidAmount || 0));
    this.status = this.remainingAmount === 0 ? "Paid" : this.paidAmount > 0 ? "Partial" : "Pending";
    if (this.paidAmount > 0 && !this.paymentDate) this.paymentDate = new Date();
});

module.exports = mongoose.model("Fee", feeSchema);