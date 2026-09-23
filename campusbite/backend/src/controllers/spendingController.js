const Order = require('../models/Order');

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const startOfWeek = () => {
  const d = startOfToday();
  d.setDate(d.getDate() - d.getDay());
  return d;
};
const startOfMonth = () => {
  const d = startOfToday();
  d.setDate(1);
  return d;
};

// GET /api/spending/summary
const getSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [today, week, month, allTime, byCategory, byMethod] = await Promise.all([
      Order.aggregate([
        { $match: { userId, paymentStatus: 'PAID', createdAt: { $gte: startOfToday() } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { userId, paymentStatus: 'PAID', createdAt: { $gte: startOfWeek() } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { userId, paymentStatus: 'PAID', createdAt: { $gte: startOfMonth() } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { userId, paymentStatus: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { userId, paymentStatus: 'PAID' } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'menuitems',
            localField: 'items.menuItem',
            foreignField: '_id',
            as: 'menuItemDoc',
          },
        },
        { $unwind: { path: '$menuItemDoc', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$menuItemDoc.category',
            total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
      ]),
      Order.aggregate([
        { $match: { userId, paymentStatus: 'PAID' } },
        { $group: { _id: '$paymentMethod', total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    res.json({
      today: today[0]?.total || 0,
      week: week[0]?.total || 0,
      month: month[0]?.total || 0,
      allTime: allTime[0]?.total || 0,
      byCategory,
      byMethod,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/spending/transactions?from=&to=
const getTransactions = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const filter = { userId: req.user._id, paymentStatus: 'PAID' };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getTransactions };
