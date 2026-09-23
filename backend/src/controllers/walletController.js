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

const Razorpay = require('razorpay');
const crypto = require('crypto');

const getRazorpayInstance = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return null;
};

// POST /api/wallet/topup/razorpay/create
const createRazorpayTopUp = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }
    const rzp = getRazorpayInstance();
    if (!rzp) {
      return res.status(200).json({ isDemo: true, message: 'Razorpay keys not configured; using direct top-up' });
    }

    const rzpOrder = await rzp.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt: `topup_${Date.now()}`,
      notes: { userId: req.user._id.toString(), type: 'WALLET_TOPUP' },
    });

    res.status(201).json({
      razorpay: {
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/wallet/topup/razorpay/verify
const verifyRazorpayTopUp = async (req, res, next) => {
  try {
    const { amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing Razorpay signature details' });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'RAZORPAY_KEY_SECRET not configured' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    const session = await mongoose.startSession();
    let txn;
    try {
      await session.withTransaction(async () => {
        txn = await creditWallet(
          {
            userId: req.user._id,
            amount: Number(amount),
            note: `Recharge via Razorpay (${razorpay_payment_id})`,
            idempotencyKey: `topup:${razorpay_payment_id}`,
          },
          session
        );
      });
      res.json({ transaction: txn, message: 'Wallet recharged successfully' });
    } finally {
      session.endSession();
    }
  } catch (err) {
    next(err);
  }
};

// POST /api/wallet/topup (direct/demo top-up fallback)
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
        { userId: req.user._id, amount, note: 'Self top-up' },
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

module.exports = { getBalance, getTransactions, topUp, createRazorpayTopUp, verifyRazorpayTopUp };
