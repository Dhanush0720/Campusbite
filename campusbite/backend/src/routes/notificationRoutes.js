const express = require('express');
const { getNotifications, markRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markRead);

module.exports = router;
