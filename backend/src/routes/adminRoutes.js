const express = require('express');
const { listUsers, createStaffUser, updateUser } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Admin: full user management. Manager: staff-only subset (enforced inside the controller too).
router.get('/users', protect, authorize('admin', 'manager'), listUsers);
router.post('/users', protect, authorize('admin', 'manager'), createStaffUser);
router.patch('/users/:id', protect, authorize('admin', 'manager'), updateUser);

module.exports = router;
