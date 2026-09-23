const express = require('express');
const {
  getMenu, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem,
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getMenu); // public - guests browse too
router.get('/:id', getMenuItem);
router.post('/', protect, authorize('manager', 'admin'), createMenuItem);
router.put('/:id', protect, authorize('manager', 'admin'), updateMenuItem);
router.delete('/:id', protect, authorize('manager', 'admin'), deleteMenuItem);

module.exports = router;
