const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, default: 1, min: 1 },
      price: { type: Number, required: true }, // Store price at time of add
      image: String,
      name: String
    }
  ],
  totalPrice: { type: Number, default: 0 }
}, { timestamps: true });

// Auto-calculate Total Price before saving
cartSchema.pre('save', function() {
  // We can just run logic. Mongoose detects it's synchronous.
  this.totalPrice = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
});

module.exports = mongoose.model('Cart', cartSchema);