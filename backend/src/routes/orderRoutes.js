const express = require('express');
const {
  createOrder, getMyOrders, getOrderById, listOrders, updateOrderStatus,
} = require('../controllers/orderController');
const { verifyQr, deliverOrder } = require('../controllers/qrController');
const { optionalAuth, protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', optionalAuth, createOrder); // guests allowed
router.get('/my-orders', protect, getMyOrders);
router.get('/', protect, authorize('staff', 'manager', 'admin'), listOrders);
router.get('/:id', optionalAuth, getOrderById);
router.patch('/:id/status', protect, authorize('staff', 'manager', 'admin'), updateOrderStatus);

// QR / counter pickup
router.post('/verify-qr', protect, authorize('staff', 'manager', 'admin'), verifyQr);
router.post('/:id/deliver', protect, authorize('staff', 'manager', 'admin'), deliverOrder);

module.exports = router;
