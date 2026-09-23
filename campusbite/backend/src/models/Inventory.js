const mongoose = require('mongoose');

const inventoryHistorySchema = new mongoose.Schema(
  {
    change: { type: Number, required: true }, // +ve = added, -ve = deducted
    reason: { type: String, required: true }, // e.g. RESTOCK, ORDER_DEDUCTION, WASTAGE, ADJUSTMENT
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referenceOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    unit: { type: String, default: 'units' }, // kg, litres, pieces...
    quantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    linkedMenuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    supplier: { type: String },
    history: { type: [inventoryHistorySchema], default: [] },
  },
  { timestamps: true }
);

inventorySchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.lowStockThreshold;
});
inventorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
