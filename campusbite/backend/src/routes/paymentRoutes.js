const express = require('express');
const { createPayment, verifyPayment, getPaymentsForOrder } = require('../controllers/paymentController');
const { optionalAuth, protect } = require('../middleware/auth');

const router = express.Router();

router.post('/create', optionalAuth, createPayment); // guests pay by UPI
router.post('/verify', optionalAuth, verifyPayment);
router.get('/:orderId', protect, getPaymentsForOrder);

module.exports = router;
