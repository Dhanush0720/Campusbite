const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { hashToken } = require('../utils/qrToken');
const { emitStatusChange } = require('../services/orderService');

// POST /api/orders/verify-qr  (staff)
// body: { qrToken } OR { orderNumber, deliveryPin }
// Looks up the order, checks it is still active/undelivered, and returns its details
// WITHOUT marking it delivered - staff must explicitly confirm handover in a second step.
const verifyQr = async (req, res, next) => {
  try {
    const { qrToken, orderNumber, deliveryPin } = req.body;

    let order;
    if (qrToken) {
      const tokenHash = hashToken(qrToken);
      order = await Order.findOne({ qrTokenHash: tokenHash });
    } else if (orderNumber && deliveryPin) {
      order = await Order.findOne({ orderNumber, deliveryPin });
    } else {
      return res.status(400).json({ message: 'Provide qrToken or (orderNumber + deliveryPin)' });
    }

    if (!order) {
      return res.status(404).json({ message: 'Invalid or unrecognized QR / PIN' });
    }
    if (!order.qrIsActive) {
      return res.status(409).json({ message: 'This QR code has already been used or closed' });
    }
    if (order.qrExpiresAt && order.qrExpiresAt < new Date()) {
      return res.status(410).json({ message: 'This QR code has expired' });
    }
    if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'CLOSED') {
      return res.status(409).json({ message: 'Order already delivered' });
    }
    if (order.orderStatus === 'CANCELLED') {
      return res.status(409).json({ message: 'Order was cancelled' });
    }
    if (order.orderStatus !== 'READY' && order.orderStatus !== 'PREPARING' && order.orderStatus !== 'CONFIRMED') {
      return res.status(409).json({ message: `Order is in unexpected state: ${order.orderStatus}` });
    }

    await AuditLog.create({
      actorId: req.user._id,
      action: 'QR_SCANNED',
      entityType: 'Order',
      entityId: order._id,
    });

    res.json({ order });
  } catch (err) {
    next(err);
  }
};

// POST /api/orders/:id/deliver  (staff)
// The ONLY place an order can be marked DELIVERED. Requires the order to have already been
// through verify-qr in this session (enforced here by re-checking qrIsActive) and be READY.
const deliverOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'CLOSED') {
      return res.status(409).json({ message: 'Order already delivered - cannot deliver twice' });
    }
    if (!order.qrIsActive) {
      return res.status(409).json({ message: 'QR/PIN is not active for this order' });
    }
    if (order.orderStatus !== 'READY') {
      return res.status(409).json({
        message: `Order must be READY before handover (currently ${order.orderStatus})`,
      });
    }

    order.orderStatus = 'DELIVERED';
    order.deliveredBy = req.user._id;
    order.deliveredAt = new Date();
    order.qrIsActive = false; // one-time use - cannot be scanned again
    await order.save();

    // Auto-close immediately after delivery; a manager could instead leave CLOSED for later
    // reconciliation if the college wants a separate closing step.
    order.orderStatus = 'CLOSED';
    await order.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'ORDER_DELIVERED',
      entityType: 'Order',
      entityId: order._id,
      metadata: { deliveredBy: req.user._id, deliveredAt: order.deliveredAt },
    });

    if (order.userId) {
      await Notification.create({
        userId: order.userId,
        title: 'Order delivered',
        message: `Order ${order.orderNumber} has been handed over. Enjoy your meal!`,
        type: 'ORDER',
        referenceOrderId: order._id,
      });
    }

    emitStatusChange(order);

    res.json({ order });
  } catch (err) {
    next(err);
  }
};

module.exports = { verifyQr, deliverOrder };
