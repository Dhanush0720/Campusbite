const express = require('express');
const {
  getBalance,
  getTransactions,
  topUp,
  createRazorpayTopUp,
  verifyRazorpayTopUp,
} = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/balance', protect, getBalance);
router.get('/transactions', protect, getTransactions);
router.post('/topup', protect, topUp);
router.post('/topup/razorpay/create', protect, createRazorpayTopUp);
router.post('/topup/razorpay/verify', protect, verifyRazorpayTopUp);

module.exports = router;
