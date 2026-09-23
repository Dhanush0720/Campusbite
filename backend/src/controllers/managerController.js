const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');
const Payment = require('../models/Payment');

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

// GET /api/manager/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const today = startOfToday();

    const [
      todaySalesAgg,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      paymentSplit,
      popularItems,
      lowStockMenu,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: 'PAID', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments({}),
      Order.countDocuments({ orderStatus: { $in: ['PLACED', 'CONFIRMED', 'PREPARING'] } }),
      Order.countDocuments({ orderStatus: { $in: ['DELIVERED', 'CLOSED'] } }),
      Order.countDocuments({ orderStatus: 'CANCELLED' }),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $group: { _id: '$paymentMethod', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', qty: { $sum: '$items.quantity' } } },
        { $sort: { qty: -1 } },
        { $limit: 5 },
      ]),
      MenuItem.find({ $expr: { $lte: ['$availableQuantity', 5] } }).select('name availableQuantity'),
    ]);

    res.json({
      todaySales: todaySalesAgg[0]?.total || 0,
      todayOrderCount: todaySalesAgg[0]?.count || 0,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      paymentSplit,
      popularItems,
      lowStockMenu,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/manager/reports?range=daily|weekly|monthly
const getReports = async (req, res, next) => {
  try {
    const { range = 'daily' } = req.query;
    const since = range === 'weekly' ? startOfWeek() : range === 'monthly' ? startOfMonth() : startOfToday();

    const dateFormat = range === 'monthly' ? '%Y-%m-%d' : range === 'weekly' ? '%Y-%m-%d' : '%H:00';

    const salesTrend = await Order.aggregate([
      { $match: { paymentStatus: 'PAID', createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          total: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const statusDistribution = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]);

    const categoryBreakdown = await Order.aggregate([
      { $match: { paymentStatus: 'PAID', createdAt: { $gte: since } } },
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
    ]);

    res.json({ range, salesTrend, statusDistribution, categoryBreakdown });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getReports };
