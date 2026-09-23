const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Snacks', 'Beverages', 'Desserts'],
      required: true,
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    availableQuantity: { type: Number, required: true, min: 0, default: 0 },
    isAvailable: { type: Boolean, default: true },
    preparationTime: { type: Number, default: 10 }, // minutes
    preparationType: {
      type: String,
      enum: ['READY_FOOD', 'MADE_TO_ORDER'],
      default: 'MADE_TO_ORDER',
    },
    isVeg: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

menuItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
