const express = require('express');
const { getBalance, getTransactions, topUp } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/balance', protect, getBalance);
router.get('/transactions', protect, getTransactions);
router.post('/topup', protect, topUp);

module.exports = router;
