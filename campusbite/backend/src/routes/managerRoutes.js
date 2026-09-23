const express = require('express');
const { getDashboard, getReports } = require('../controllers/managerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, authorize('manager', 'admin'), getDashboard);
router.get('/reports', protect, authorize('manager', 'admin'), getReports);

module.exports = router;
