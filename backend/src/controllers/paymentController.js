const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { debitWallet } = require('../services/walletService');
const { finalizePaidOrder, emitOrderConfirmed } = require('../services/orderService');

// POST /api/payments/create
// body: { orderId, method: 'UPI' | 'WALLET' }
// WALLET is settled immediately (internal ledger, no external gateway needed).
// UPI creates a PENDING payment + a sandbox "intent" the client displays; /verify finalizes it.
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

  if (method === 'UPI') {
    try {
      const idempotencyKey = `order:${order._id}:upi:${uuidv4()}`;
      const payment = await Payment.create({
        orderId: order._id,
        userId: req.user ? req.user._id : undefined,
        method: 'UPI',
        amount: order.totalAmount,
        provider: process.env.UPI_PROVIDER_NAME || 'sandbox',
        providerReference: idempotencyKey,
        idempotencyKey,
        status: 'PENDING',
      });

      // Sandbox intent - swap for a real UPI gateway's payment-intent response in production.
      const upiIntent = {
        payeeVpa: process.env.UPI_MERCHANT_VPA || 'campusbite@sandbox',
        amount: order.totalAmount,
        note: `CampusBite order ${order.orderNumber}`,
        reference: payment.providerReference,
      };

      res.status(201).json({ payment, upiIntent });
    } catch (err) {
      next(err);
    }
    return;
  }

  res.status(400).json({ message: 'method must be UPI or WALLET' });
};

// POST /api/payments/verify
// body: { orderId, providerReference }
// In sandbox mode this simulates the gateway webhook telling us payment succeeded.
// A real integration would verify a signature here instead of trusting the client.
const verifyPayment = async (req, res, next) => {
  const { orderId, providerReference } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.paymentStatus === 'PAID') {
    return res.status(200).json({ message: 'Already verified', order });
  }

  const payment = await Payment.findOne({ orderId: order._id, providerReference, status: 'PENDING' });
  if (!payment) {
    return res.status(404).json({ message: 'No pending payment found for this reference' });
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      payment.status = 'SUCCESS';
      payment.verifiedAt = new Date();
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
