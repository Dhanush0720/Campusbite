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
const WalletRechargeRequest = require('../models/WalletRechargeRequest');
const { notifyUser, notifyRole } = require('../sockets');

const generateRequestCode = () => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `CR-${num}`;
};

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

    const cleanUtr = utrNumber ? String(utrNumber).trim() : '';
    if (!cleanUtr || cleanUtr.length < 8) {
      return res.status(400).json({ message: 'Valid 12-digit UPI Reference (UTR) number is mandatory to verify wallet top-up.' });
    }

    // Check if this UTR has already been redeemed for wallet top-up
    const duplicateTxn = await WalletTransaction.findOne({ idempotencyKey: `topup:utr:${cleanUtr}` });
    if (duplicateTxn) {
      return res.status(400).json({ message: 'This UTR has already been redeemed for a wallet recharge.' });
    }

    const idempotencyKey = `topup:utr:${cleanUtr}`;

    const session = await mongoose.startSession();
    let txn;
    try {
      await session.withTransaction(async () => {
        txn = await creditWallet(
          {
            userId: req.user._id,
            amount: numAmount,
            note: `Recharge via UPI (UTR: ${cleanUtr})`,
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

// POST /api/wallet/recharge/request (student raises counter cash top-up ticket)
const requestRecharge = async (req, res, next) => {
  try {
    const { amount, paymentType = 'CASH', notes } = req.body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    if (numAmount > 10000) {
      return res.status(400).json({ message: 'Single recharge capped at ₹10,000' });
    }

    // Cancel any existing pending requests for this student to keep queue clean
    await WalletRechargeRequest.updateMany(
      { userId: req.user._id, status: 'PENDING' },
      { status: 'CANCELLED', rejectionReason: 'Replaced by a newer request' }
    );

    // Generate unique requestCode
    let requestCode = generateRequestCode();
    let collision = await WalletRechargeRequest.findOne({ requestCode, status: 'PENDING' });
    while (collision) {
      requestCode = generateRequestCode();
      collision = await WalletRechargeRequest.findOne({ requestCode, status: 'PENDING' });
    }

    const request = await WalletRechargeRequest.create({
      userId: req.user._id,
      studentName: req.user.name,
      studentEmail: req.user.email,
      studentId: req.user.studentId || '',
      studentPhone: req.user.phone || '',
      amount: numAmount,
      requestCode,
      paymentType,
      notes,
      status: 'PENDING',
    });

    // Notify staff & managers in real-time
    notifyRole('staff', 'recharge:new', request);
    notifyRole('manager', 'recharge:new', request);

    res.status(201).json({
      message: 'Recharge request submitted. Please pay cash at the canteen counter.',
      request,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/wallet/recharge/my (student views their tickets)
const getMyRechargeRequests = async (req, res, next) => {
  try {
    const requests = await WalletRechargeRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ requests });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/wallet/recharge/:id/cancel (student cancels a pending ticket)
const cancelRechargeRequest = async (req, res, next) => {
  try {
    const request = await WalletRechargeRequest.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'PENDING',
    });
    if (!request) {
      return res.status(404).json({ message: 'Pending recharge request not found' });
    }
    request.status = 'CANCELLED';
    await request.save();

    notifyRole('staff', 'recharge:updated', request);
    notifyRole('manager', 'recharge:updated', request);

    res.json({ message: 'Request cancelled', request });
  } catch (err) {
    next(err);
  }
};

// GET /api/wallet/recharge/pending (staff/manager/admin view queue)
const getPendingRechargeRequests = async (req, res, next) => {
  try {
    const { status = 'PENDING', search } = req.query;
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { requestCode: regex },
        { studentName: regex },
        { studentEmail: regex },
        { studentId: regex },
      ];
    }
    const requests = await WalletRechargeRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ requests });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/wallet/recharge/:id/approve (staff/manager/admin collects cash and approves)
const approveRechargeRequest = async (req, res, next) => {
  try {
    const request = await WalletRechargeRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Recharge request not found' });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: `Request is already ${request.status.toLowerCase()}` });
    }

    const session = await mongoose.startSession();
    let txn;
    try {
      await session.withTransaction(async () => {
        request.status = 'APPROVED';
        request.approvedBy = req.user._id;
        request.approvedByName = req.user.name || req.user.role;
        request.approvedAt = new Date();
        await request.save({ session });

        txn = await creditWallet(
          {
            userId: request.userId,
            amount: request.amount,
            note: `Counter Cash Recharge (${request.requestCode}) verified by ${req.user.name}`,
            idempotencyKey: `recharge:${request._id}`,
          },
          session
        );
      });
    } finally {
      session.endSession();
    }

    // Real-time notification to the student's room
    notifyUser(request.userId.toString(), 'recharge:status', {
      status: 'APPROVED',
      amount: request.amount,
      requestCode: request.requestCode,
      request,
    });
    notifyRole('staff', 'recharge:updated', request);
    notifyRole('manager', 'recharge:updated', request);

    res.json({
      message: `Successfully approved ₹${request.amount} for ${request.studentName}`,
      request,
      transaction: txn,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/wallet/recharge/:id/reject (staff/manager rejects fake/unpaid ticket)
const rejectRechargeRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const request = await WalletRechargeRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Recharge request not found' });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: `Request is already ${request.status.toLowerCase()}` });
    }

    request.status = 'REJECTED';
    request.approvedBy = req.user._id;
    request.approvedByName = req.user.name || req.user.role;
    request.rejectionReason = reason || 'Cash payment not received';
    await request.save();

    notifyUser(request.userId.toString(), 'recharge:status', {
      status: 'REJECTED',
      amount: request.amount,
      requestCode: request.requestCode,
      reason: request.rejectionReason,
      request,
    });
    notifyRole('staff', 'recharge:updated', request);
    notifyRole('manager', 'recharge:updated', request);

    res.json({ message: 'Recharge request rejected', request });
  } catch (err) {
    next(err);
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
  requestRecharge,
  getMyRechargeRequests,
  cancelRechargeRequest,
  getPendingRechargeRequests,
  approveRechargeRequest,
  rejectRechargeRequest,
};
