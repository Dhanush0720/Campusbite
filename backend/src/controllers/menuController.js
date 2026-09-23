const MenuItem = require('../models/MenuItem');
const AuditLog = require('../models/AuditLog');

// GET /api/menu?category=&search=&isAvailable=
const getMenu = async (req, res, next) => {
  try {
    const { category, search, isAvailable } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
    if (search) filter.$text = { $search: search };

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

// GET /api/menu/:id
const getMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Food item not found' });
    res.json({ item });
  } catch (err) {
    next(err);
  }
};

// POST /api/menu (manager/admin)
const createMenuItem = async (req, res, next) => {
  try {
    const { name, description, category, price, image, availableQuantity, preparationTime } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ message: 'name, category, and price are required' });
    }
    const item = await MenuItem.create({
      name,
      description,
      category,
      price,
      image,
      availableQuantity: availableQuantity || 0,
      preparationTime,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'MENU_ITEM_CREATED',
      entityType: 'MenuItem',
      entityId: item._id,
      metadata: { name: item.name, price: item.price },
    });

    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
};

// PUT /api/menu/:id (manager/admin)
const updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Food item not found' });

    const allowedFields = [
      'name', 'description', 'category', 'price', 'image',
      'availableQuantity', 'isAvailable', 'preparationTime',
    ];
    const changes = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        changes[field] = req.body[field];
        item[field] = req.body[field];
      }
    });

    await item.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'MENU_ITEM_UPDATED',
      entityType: 'MenuItem',
      entityId: item._id,
      metadata: changes,
    });

    res.json({ item });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/menu/:id (manager/admin) - soft delete via isAvailable=false to preserve order history references
const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Food item not found' });

    item.isAvailable = false;
    item.availableQuantity = 0;
    await item.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'MENU_ITEM_DEACTIVATED',
      entityType: 'MenuItem',
      entityId: item._id,
    });

    res.json({ message: 'Food item deactivated', item });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMenu, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem };
