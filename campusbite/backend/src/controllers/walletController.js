const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const { creditWallet } = require('../services/walletService');

// GET /api/wallet/balance
const getBalance = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) wallet = await Wallet.create({ userId: req.user._id, balance: 0 });
    res.json({ balance: wallet.balance });
  } catch (err) {
    next(err);
  }
};

// GET /api/wallet/transactions
const getTransactions = async (req, res, next) => {
  try {
    const transactions = await WalletTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(200);
    res.json({ transactions });
  } catch (err) {
    next(err);
  }
};

// POST /api/wallet/topup  (demo-mode self top-up so the wallet can be tested without a real gateway.
// A production build should route this through the same UPI verification flow as order payments,
// and college admins should confirm the applicable regulatory requirements before enabling
// real-money stored value.)
const topUp = async (req, res, next) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'amount must be a positive number' });
  }
  if (amount > 5000) {
    return res.status(400).json({ message: 'Demo top-up capped at 5000 per request' });
  }

  const session = await mongoose.startSession();
  try {
    let txn;
    await session.withTransaction(async () => {
      txn = await creditWallet(
        { userId: req.user._id, amount, note: 'Self top-up (demo mode)' },
        session
      );
    });
    res.status(201).json({ transaction: txn });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

module.exports = { getBalance, getTransactions, topUp };
