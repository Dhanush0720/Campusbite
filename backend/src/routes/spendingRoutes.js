const express = require('express');
const { getSummary, getTransactions } = require('../controllers/spendingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', protect, getSummary);
router.get('/transactions', protect, getTransactions);

module.exports = router;
