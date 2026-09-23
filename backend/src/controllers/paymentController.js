const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { debitWallet } = require('../services/walletService');
const { finalizePaidOrder, emitOrderConfirmed } = require('../services/orderService');

const Razorpay = require('razorpay');
const crypto = require('crypto');
const QRCode = require('qrcode');

const getRazorpayInstance = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return null;
};

// POST /api/payments/create
// body: { orderId, method: 'UPI' | 'WALLET' | 'RAZORPAY' }
const createPayment = async (req, res, next) => {
  const { orderId, method } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.paymentStatus === 'PAID') {
    return res.status(409).json({ message: 'Order already paid' });
  }
  if (order.userId && req.user && order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized for this order' });
  }

  const existingSuccess = await Payment.findOne({ orderId: order._id, status: 'SUCCESS' });
  if (existingSuccess) {
    return res.status(409).json({ message: 'Order already has a successful payment' });
  }

  if (method === 'WALLET') {
    if (!req.user) return res.status(401).json({ message: 'Login required for wallet payments' });

    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        const idempotencyKey = `order:${order._id}:wallet`;

        const walletTxn = await debitWallet(
          {
            userId: req.user._id,
            amount: order.totalAmount,
            referenceOrderId: order._id,
            note: `Payment for order ${order.orderNumber}`,
            idempotencyKey,
          },
          session
        );

        const [payment] = await Payment.create(
          [{
            orderId: order._id,
            userId: req.user._id,
            method: 'WALLET',
            amount: order.totalAmount,
            provider: 'internal-wallet',
            providerReference: walletTxn._id.toString(),
            idempotencyKey,
            status: 'SUCCESS',
            verifiedAt: new Date(),
          }],
          { session }
        );

        const { rawToken, qrImageDataUrl } = await finalizePaidOrder(order, session);
        result = { payment, order, rawToken, qrImageDataUrl };
      });

      emitOrderConfirmed(result.order);
      res.status(201).json({
        payment: result.payment,
        order: result.order,
        qrToken: result.rawToken, // shown once; not persisted in plaintext
        qrImage: result.qrImageDataUrl,
      });
    } catch (err) {
      next(err);
    } finally {
      session.endSession();
    }
    return;
  }

  if (method === 'RAZORPAY') {
    try {
      const rzp = getRazorpayInstance();
      if (!rzp) {
        return res.status(400).json({ message: 'Razorpay is not configured. Please choose Direct UPI.' });
      }

      const rzpOrder = await rzp.orders.create({
        amount: Math.round(order.totalAmount * 100), // amount in paise
        currency: 'INR',
        receipt: `order_${order.orderNumber}`,
        notes: { orderId: order._id.toString() },
      });

      const payment = await Payment.create({
        orderId: order._id,
        userId: req.user ? req.user._id : undefined,
        method: 'RAZORPAY',
        amount: order.totalAmount,
        provider: 'razorpay',
        providerReference: rzpOrder.id,
        idempotencyKey: rzpOrder.id,
        status: 'PENDING',
      });

      return res.status(201).json({
        payment,
        razorpay: {
          orderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          key: process.env.RAZORPAY_KEY_ID,
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  if (method === 'UPI') {
    try {
      // Direct Dynamic UPI QR
      const idempotencyKey = `order:${order._id}:upi:${uuidv4()}`;
      const payment = await Payment.create({
        orderId: order._id,
        userId: req.user ? req.user._id : undefined,
        method: 'UPI',
        amount: order.totalAmount,
        provider: process.env.UPI_PROVIDER_NAME || 'direct-upi',
        providerReference: idempotencyKey,
        idempotencyKey,
        status: 'PENDING',
      });

      const payeeVpa = process.env.UPI_MERCHANT_VPA || 'campusbite@upi';
      const payeeName = process.env.UPI_MERCHANT_NAME || 'CampusBite Canteen';
      const upiNote = `Order ${order.orderNumber}`;
      
      // Standard NPCI UPI URI string
      const upiUri = `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${encodeURIComponent(payeeName)}&am=${order.totalAmount.toFixed(2)}&tn=${encodeURIComponent(upiNote)}&tr=${encodeURIComponent(payment.providerReference)}&cu=INR`;
      
      // Generate scannable QR Code Data URL on the fly
      const qrImageDataUrl = await QRCode.toDataURL(upiUri, {
        margin: 2,
        width: 320,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });

      const upiIntent = {
        payeeVpa,
        payeeName,
        amount: order.totalAmount,
        note: upiNote,
        reference: payment.providerReference,
        upiUri,
        qrImageDataUrl,
      };

      return res.status(201).json({ payment, upiIntent });
    } catch (err) {
      next(err);
    }
    return;
  }

  res.status(400).json({ message: 'method must be UPI, RAZORPAY, or WALLET' });
};

// POST /api/payments/verify
// body: { orderId, providerReference, utrNumber, razorpay_order_id, razorpay_payment_id, razorpay_signature }
const verifyPayment = async (req, res, next) => {
  const { orderId, providerReference, utrNumber, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.paymentStatus === 'PAID') {
    return res.status(200).json({ message: 'Already verified', order });
  }

  const lookupRef = providerReference || razorpay_order_id;
  const payment = await Payment.findOne({ orderId: order._id, providerReference: lookupRef, status: 'PENDING' });
  if (!payment) {
    return res.status(404).json({ message: 'No pending payment found for this reference' });
  }

  // If method is UPI, UTR entry is mandatory
  if (payment.method === 'UPI') {
    const cleanUtr = utrNumber ? String(utrNumber).trim() : '';
    if (!cleanUtr || cleanUtr.length < 8) {
      return res.status(400).json({ message: 'Valid 12-digit UPI Reference / UTR number is mandatory to verify payment.' });
    }

    const duplicatePayment = await Payment.findOne({ utrNumber: cleanUtr, status: 'SUCCESS' });
    if (duplicatePayment && duplicatePayment.orderId.toString() !== order._id.toString()) {
      return res.status(400).json({ message: 'This UTR has already been submitted for another order.' });
    }
  }

  // If Razorpay signature is sent, verify HMAC SHA-256
  if (razorpay_signature) {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'RAZORPAY_KEY_SECRET is not configured' });
    }
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature from Razorpay' });
    }
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      payment.status = 'SUCCESS';
      payment.verifiedAt = new Date();
      if (razorpay_payment_id) {
        payment.providerReference = razorpay_payment_id;
      }
      if (utrNumber) {
        payment.utrNumber = String(utrNumber).trim();
      }
      await payment.save({ session });

      const { rawToken, qrImageDataUrl } = await finalizePaidOrder(order, session);
      result = { payment, order, rawToken, qrImageDataUrl };
    });

    emitOrderConfirmed(result.order);
    res.json({
      payment: result.payment,
      order: result.order,
      qrToken: result.rawToken,
      qrImage: result.qrImageDataUrl,
    });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};

// GET /api/payments/:orderId
const getPaymentsForOrder = async (req, res, next) => {
  try {
    const payments = await Payment.find({ orderId: req.params.orderId }).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPayment, verifyPayment, getPaymentsForOrder };
