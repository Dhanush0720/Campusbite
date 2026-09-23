const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['CREDIT', 'DEBIT', 'REFUND'], required: true },
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true },
    referenceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    idempotencyKey: { type: String, required: true, unique: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
    note: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
