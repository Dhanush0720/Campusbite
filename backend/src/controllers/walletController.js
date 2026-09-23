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
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

const getRazorpayInstance = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return null;
};

// POST /api/wallet/topup/upi/create
// Generates a real dynamic UPI QR code & deep-link for topping up student wallet
const createUpiTopUp = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const referenceId = `topup_${req.user._id}_${Date.now()}`;
    const payeeVpa = process.env.UPI_MERCHANT_VPA || 'campusbite@upi';
    const payeeName = process.env.UPI_MERCHANT_NAME || 'CampusBite Canteen';
    const upiNote = `Wallet Top-Up - ${req.user.name || 'Student'}`;

    // Standard NPCI UPI URI string
    const upiUri = `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${encodeURIComponent(payeeName)}&am=${numAmount.toFixed(2)}&tn=${encodeURIComponent(upiNote)}&tr=${encodeURIComponent(referenceId)}&cu=INR`;

    const qrImageDataUrl = await QRCode.toDataURL(upiUri, {
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    res.status(200).json({
      referenceId,
      amount: numAmount,
      payeeVpa,
      payeeName,
      upiUri,
      qrImageDataUrl,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/wallet/topup/upi/verify
// Confirms UPI top-up with optional UTR / txn reference
const verifyUpiTopUp = async (req, res, next) => {
  try {
    const { amount, referenceId, utrNumber } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }
    if (!referenceId) {
      return res.status(400).json({ message: 'Missing referenceId' });
    }

    const cleanUtr = utrNumber ? String(utrNumber).trim() : null;
    const idempotencyKey = cleanUtr ? `topup:utr:${cleanUtr}` : `topup:${referenceId}`;

    const session = await mongoose.startSession();
    let txn;
    try {
      await session.withTransaction(async () => {
        txn = await creditWallet(
          {
            userId: req.user._id,
            amount: numAmount,
            note: cleanUtr ? `Recharge via UPI (UTR: ${cleanUtr})` : `Recharge via UPI (${referenceId})`,
            idempotencyKey,
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

// POST /api/wallet/cashier-topup
// Canteen Staff / Cashier / Manager credits cash directly to student's Campus Wallet
const cashierTopUp = async (req, res, next) => {
  try {
    const { identifier, amount, notes } = req.body; // identifier: student email, phone, studentId, or Mongo ID
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    if (!identifier) {
      return res.status(400).json({ message: 'Please provide student email, phone number, or student ID' });
    }

    const trimmed = identifier.trim();
    const query = {
      $or: [
        { email: trimmed.toLowerCase() },
        { phone: trimmed },
        { studentId: trimmed },
      ],
    };
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      query.$or.push({ _id: trimmed });
    }

    const student = await User.findOne(query);
    if (!student) {
      return res.status(404).json({ message: 'Student account not found with the provided identifier' });
    }

    const session = await mongoose.startSession();
    let txn;
    try {
      await session.withTransaction(async () => {
        txn = await creditWallet(
          {
            userId: student._id,
            amount: numAmount,
            note: `Cash Top-Up at Counter by ${req.user.name || req.user.role} (${notes || 'Cash handed at counter'})`,
            idempotencyKey: `cashier:${Date.now()}:${uuidv4()}`,
          },
          session
        );
      });
      res.status(200).json({
        message: `Successfully credited ₹${numAmount} to ${student.name}'s wallet`,
        student: { id: student._id, name: student.name, email: student.email, studentId: student.studentId },
        transaction: txn,
      });
    } finally {
      session.endSession();
    }
  } catch (err) {
    next(err);
  }
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
  if (amount > 10000) {
    return res.status(400).json({ message: 'Top-up capped at 10,000 per request' });
  }

  const session = await mongoose.startSession();
  try {
    let txn;
    await session.withTransaction(async () => {
      txn = await creditWallet(
        { userId: req.user._id, amount, note: 'Self top-up (Demo/Instant)' },
        session
      );
    });
    res.status(201).json({ transaction: txn, message: 'Wallet credited successfully' });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

module.exports = {
  getBalance,
  getTransactions,
  topUp,
  createUpiTopUp,
  verifyUpiTopUp,
  cashierTopUp,
  createRazorpayTopUp,
  verifyRazorpayTopUp,
};
