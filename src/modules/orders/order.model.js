const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  orderItems: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      name: String,
      quantity: { type: Number, required: true },
      image: String,
      price: { type: Number, required: true }
    }
  ],

  shippingAddress: {
    address: { type: String, required: true },
    apartment: String,
    city: { type: String, required: true },
    province: { type: String, required: true },
    postalCode: String,
    phone: { type: String, required: true }
  },

  paymentMethod: {
    type: String,
    enum: ['COD', 'JazzCash', 'Easypaisa'],
    required: true
  },

  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },

  deliveryMethod: { type: String, default: 'Standard' },
  shippingPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },

  isPaid: { type: Boolean, default: false },
  paidAt: Date,

  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Returned', 'Cancelled'],
    default: 'Pending'
  },
  
  // NEW: Admin Tracking Info
  courierInfo: {
    courierName: { type: String },  // e.g., TCS, Leopards, Trax
    trackingId: { type: String }    // e.g., PK-123456789
  },

  deliveredAt: Date

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);