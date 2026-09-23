const Inventory = require('../models/Inventory');
const AuditLog = require('../models/AuditLog');
const { emitLowStock } = require('../services/orderService');

// GET /api/inventory
const listInventory = async (req, res, next) => {
  try {
    const { lowStockOnly } = req.query;
    let items = await Inventory.find().sort({ name: 1 });
    if (lowStockOnly === 'true') {
      items = items.filter((i) => i.quantity <= i.lowStockThreshold);
    }
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

// POST /api/inventory  (manager)
const createInventoryItem = async (req, res, next) => {
  try {
    const { name, unit, quantity, lowStockThreshold, linkedMenuItem, supplier } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const item = await Inventory.create({
      name,
      unit,
      quantity: quantity || 0,
      lowStockThreshold,
      linkedMenuItem,
      supplier,
      history: quantity ? [{ change: quantity, reason: 'INITIAL_STOCK', actorId: req.user._id }] : [],
    });

    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/inventory/:id/adjust  (manager) - body: { change, reason }
const adjustInventory = async (req, res, next) => {
  try {
    const { change, reason } = req.body;
    if (!change || !reason) {
      return res.status(400).json({ message: 'change and reason are required' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });

    const newQuantity = item.quantity + Number(change);
    if (newQuantity < 0) {
      return res.status(400).json({ message: 'Adjustment would result in negative stock' });
    }

    item.quantity = newQuantity;
    item.history.unshift({ change: Number(change), reason, actorId: req.user._id });
    await item.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'INVENTORY_ADJUSTED',
      entityType: 'Inventory',
      entityId: item._id,
      metadata: { change, reason, newQuantity },
    });

    if (item.quantity <= item.lowStockThreshold) {
      emitLowStock({ _id: item._id, name: item.name, availableQuantity: item.quantity });
    }

    res.json({ item });
  } catch (err) {
    next(err);
  }
};

module.exports = { listInventory, createInventoryItem, adjustInventory };
