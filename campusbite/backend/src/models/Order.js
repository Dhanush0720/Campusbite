const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true }, // snapshot at order time
    price: { type: Number, required: true }, // snapshot price
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    guestName: { type: String }, // for guest orders without account
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['UPI', 'WALLET'], required: true },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ['PLACED', 'PAID', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CLOSED', 'CANCELLED'],
      default: 'PLACED',
      index: true,
    },
    qrTokenHash: { type: String },
    qrExpiresAt: { type: Date },
    qrIsActive: { type: Boolean, default: false },
    deliveryPin: { type: String }, // optional 4-6 digit pin
    deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveredAt: { type: Date },
    canteenOutlet: { type: String, default: 'Main Canteen' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
