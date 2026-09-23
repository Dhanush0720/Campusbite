const express = require('express');
const {
  getBalance,
  getTransactions,
  topUp,
  createUpiTopUp,
  verifyUpiTopUp,
  cashierTopUp,
  createRazorpayTopUp,
  verifyRazorpayTopUp,
} = require('../controllers/walletController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/balance', protect, getBalance);
router.get('/transactions', protect, getTransactions);
router.post('/topup', protect, topUp);

// Dynamic UPI wallet top-up
router.post('/topup/upi/create', protect, createUpiTopUp);
router.post('/topup/upi/verify', protect, verifyUpiTopUp);

// Counter Cashier wallet top-up (staff / manager / admin)
router.post('/cashier-topup', protect, authorize('staff', 'manager', 'admin'), cashierTopUp);

// Razorpay top-up (optional fallback if configured)
router.post('/topup/razorpay/create', protect, createRazorpayTopUp);
router.post('/topup/razorpay/verify', protect, verifyRazorpayTopUp);

module.exports = router;

