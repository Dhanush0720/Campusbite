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
  requestRecharge,
  getMyRechargeRequests,
  cancelRechargeRequest,
  getPendingRechargeRequests,
  approveRechargeRequest,
  rejectRechargeRequest,
} = require('../controllers/walletController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/balance', protect, getBalance);
router.get('/transactions', protect, getTransactions);
router.post('/topup', protect, topUp);

// Student counter cash recharge requests
router.post('/recharge/request', protect, requestRecharge);
router.get('/recharge/my', protect, getMyRechargeRequests);
router.patch('/recharge/:id/cancel', protect, cancelRechargeRequest);

// Staff / Manager counter cash approvals
router.get('/recharge/pending', protect, authorize('staff', 'manager', 'admin'), getPendingRechargeRequests);
router.patch('/recharge/:id/approve', protect, authorize('staff', 'manager', 'admin'), approveRechargeRequest);
router.patch('/recharge/:id/reject', protect, authorize('staff', 'manager', 'admin'), rejectRechargeRequest);

// Dynamic UPI wallet top-up
router.post('/topup/upi/create', protect, createUpiTopUp);
router.post('/topup/upi/verify', protect, verifyUpiTopUp);

// Counter Cashier instant direct wallet top-up (staff / manager / admin)
router.post('/cashier-topup', protect, authorize('staff', 'manager', 'admin'), cashierTopUp);

// Razorpay top-up (optional fallback if configured)
router.post('/topup/razorpay/create', protect, createRazorpayTopUp);
router.post('/topup/razorpay/verify', protect, verifyRazorpayTopUp);

module.exports = router;

