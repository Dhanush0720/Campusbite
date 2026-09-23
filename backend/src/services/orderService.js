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
  const qrImageDataUrl = await QRCode.toDataURL(rawToken);

  order.paymentStatus = 'PAID';
  // If the order is composed of already prepared food, skip cooking queue and set to READY immediately!
  order.orderStatus = order.orderType === 'READY_FOOD' ? 'READY' : 'CONFIRMED';
  order.qrTokenHash = tokenHash;
  order.qrImage = qrImageDataUrl;
  order.qrExpiresAt = qrExpiresAt;
  order.qrIsActive = true;
  order.deliveryPin = generateDeliveryPin();
  await order.save({ session });

  if (order.userId) {
    await AuditLog.create(
      [{
        actorId: order.userId,
        action: order.orderStatus === 'READY' ? 'ORDER_PAID_READY' : 'ORDER_PAID_CONFIRMED',
        entityType: 'Order',
        entityId: order._id,
        metadata: { orderNumber: order.orderNumber, totalAmount: order.totalAmount },
      }],
      { session }
    );

    await Notification.create(
      [{
        userId: order.userId,
        title: order.orderStatus === 'READY' ? 'Order ready for pickup!' : 'Order confirmed',
        message: order.orderStatus === 'READY'
          ? `Your order ${order.orderNumber} is ready! Show your QR code at the counter for instant handover.`
          : `Your order ${order.orderNumber} is confirmed. Kitchen is preparing your food.`,
        type: 'ORDER',
        referenceOrderId: order._id,
      }],
      { session }
    );
  }

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
