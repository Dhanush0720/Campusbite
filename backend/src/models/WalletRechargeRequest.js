const mongoose = require('mongoose');

const walletRechargeRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    studentId: { type: String },
    studentPhone: { type: String },
    amount: { type: Number, required: true, min: 1 },
    requestCode: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    paymentType: {
      type: String,
      enum: ['CASH', 'COUNTER_UPI'],
      default: 'CASH',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedByName: { type: String },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WalletRechargeRequest', walletRechargeRequestSchema);
