const express = require('express');
const { listInventory, createInventoryItem, adjustInventory } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('manager', 'admin'), listInventory);
router.post('/', protect, authorize('manager', 'admin'), createInventoryItem);
router.patch('/:id/adjust', protect, authorize('manager', 'admin'), adjustInventory);

module.exports = router;
