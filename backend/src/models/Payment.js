const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    method: { type: String, enum: ['UPI', 'WALLET', 'RAZORPAY'], required: true },
    amount: { type: Number, required: true },
    provider: { type: String, default: 'sandbox' },
    providerReference: { type: String, index: true }, // UPI txn ref / gateway id
    utrNumber: { type: String }, // 12-digit UPI reference ID (UTR)
    idempotencyKey: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['CREATED', 'PENDING', 'SUCCESS', 'FAILED'],
      default: 'CREATED',
      index: true,
    },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
