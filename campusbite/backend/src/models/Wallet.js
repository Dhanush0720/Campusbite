const mongoose = require('mongoose');

// Separate current-balance document per user, kept in sync with WalletTransaction ledger.
// The ledger (WalletTransaction) is the source of truth for history; this is a fast-read cache.
const walletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', walletSchema);
