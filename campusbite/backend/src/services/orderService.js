const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { generateQrToken, generateDeliveryPin } = require('../utils/qrToken');
const { notifyUser, notifyRole } = require('../sockets');

// Called once a payment (wallet or UPI) has been verified as SUCCESS.
// Deducts stock, generates the QR token, updates order status, logs, and notifies.
// Runs inside the same DB session as the payment/wallet write so it is atomic with them.
const finalizePaidOrder = async (order, session) => {
  // Deduct stock for each item (validated again here to prevent overselling between
  // order creation and payment confirmation).
  for (const line of order.items) {
    const menuItem = await MenuItem.findById(line.menuItem).session(session);
    if (!menuItem || menuItem.availableQuantity < line.quantity) {
      const err = new Error(`Insufficient stock for ${line.name}`);
      err.statusCode = 409;
      throw err;
    }
    menuItem.availableQuantity -= line.quantity;
    if (menuItem.availableQuantity === 0) menuItem.isAvailable = false;
    await menuItem.save({ session });
  }

  const { rawToken, tokenHash } = generateQrToken();
  const qrExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 6); // 6 hour validity

  order.paymentStatus = 'PAID';
  order.orderStatus = 'CONFIRMED';
  order.qrTokenHash = tokenHash;
  order.qrExpiresAt = qrExpiresAt;
  order.qrIsActive = true;
  order.deliveryPin = generateDeliveryPin();
  await order.save({ session });

  await AuditLog.create(
    [{
      actorId: order.userId,
      action: 'ORDER_PAID_CONFIRMED',
      entityType: 'Order',
      entityId: order._id,
      metadata: { orderNumber: order.orderNumber, totalAmount: order.totalAmount },
    }],
    { session }
  );

  await Notification.create(
    [{
      userId: order.userId,
      title: 'Order confirmed',
      message: `Your order ${order.orderNumber} is confirmed. Show your QR code at the counter.`,
      type: 'ORDER',
      referenceOrderId: order._id,
    }],
    { session }
  );

  // Fire-and-forget: real-time notifications (do not block the transaction on socket errors)
  const qrImageDataUrl = await QRCode.toDataURL(rawToken);

  return { rawToken, qrImageDataUrl };
};

const emitOrderConfirmed = (order) => {
  notifyUser(order.userId, 'order:confirmed', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.orderStatus,
  });
  notifyRole('staff', 'order:new', {
    orderId: order._id,
    orderNumber: order.orderNumber,
  });
  notifyRole('manager', 'order:new', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
  });
};

const emitStatusChange = (order) => {
  notifyUser(order.userId, 'order:status', {
    orderId: order._id,
    orderNumber: order.orderNumber,
    status: order.orderStatus,
  });
};

const emitLowStock = (menuItem) => {
  notifyRole('manager', 'inventory:low-stock', {
    menuItemId: menuItem._id,
    name: menuItem.name,
    availableQuantity: menuItem.availableQuantity,
  });
};

module.exports = { finalizePaidOrder, emitOrderConfirmed, emitStatusChange, emitLowStock };
