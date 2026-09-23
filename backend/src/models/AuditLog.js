const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true }, // e.g. ORDER_DELIVERED, PRICE_UPDATED, REFUND_ISSUED
    entityType: { type: String, required: true }, // Order, MenuItem, Payment, Wallet...
    entityId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
