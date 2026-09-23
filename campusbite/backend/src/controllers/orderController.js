const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const generateOrderNumber = require('../utils/orderNumber');
const { emitStatusChange } = require('../services/orderService');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

// POST /api/orders
// Creates an order in PLACED / PENDING state. Payment happens in a follow-up call.
const createOrder = async (req, res, next) => {
  try {
    const { items, paymentMethod, guestName } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must include at least one item' });
    }
    if (!['UPI', 'WALLET'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'paymentMethod must be UPI or WALLET' });
    }
    if (!req.user && !guestName) {
      return res.status(400).json({ message: 'Guest orders require a guestName' });
    }
    if (!req.user && paymentMethod === 'WALLET') {
      return res.status(400).json({ message: 'Guests cannot pay by wallet' });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const line of items) {
      const menuItem = await MenuItem.findById(line.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ message: `Item unavailable: ${line.menuItemId}` });
      }
      const qty = Number(line.quantity) || 0;
      if (qty <= 0) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
      }
      if (menuItem.availableQuantity < qty) {
        return res.status(409).json({ message: `Not enough stock for ${menuItem.name}` });
      }
      const lineTotal = menuItem.price * qty;
      subtotal += lineTotal;
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: qty,
      });
    }

    const totalAmount = subtotal; // discount logic can be layered in here later

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId: req.user ? req.user._id : null,
      guestName: req.user ? undefined : guestName,
      items: orderItems,
      subtotal,
      discount: 0,
      totalAmount,
      paymentMethod,
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
    });

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/my-orders
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = order.userId && req.user && order.userId.toString() === req.user._id.toString();
    const isStaffOrAbove = req.user && ['staff', 'manager', 'admin'].includes(req.user.role);
    if (!isOwner && !isStaffOrAbove) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({ order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders (staff/manager queue view)
const listOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.orderStatus = status;
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/status  (staff/manager) - PREPARING / READY / CANCELLED only.
// DELIVERED is only ever set via the QR/PIN verified handover flow (qrController), never here.
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedTransitions = {
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY', 'CANCELLED'],
    };

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const allowedNext = allowedTransitions[order.orderStatus] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        message: `Cannot move order from ${order.orderStatus} to ${status}`,
      });
    }

    order.orderStatus = status;
    await order.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: `ORDER_STATUS_${status}`,
      entityType: 'Order',
      entityId: order._id,
    });

    if (order.userId) {
      await Notification.create({
        userId: order.userId,
        title: `Order ${status === 'READY' ? 'ready for pickup' : status.toLowerCase()}`,
        message: `Your order ${order.orderNumber} is now ${status}.`,
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

module.exports = { createOrder, getMyOrders, getOrderById, listOrders, updateOrderStatus };
