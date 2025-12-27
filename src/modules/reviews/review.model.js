const mongoose = require('mongoose');
const Product = require('../products/product.model');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true }, // Store name to avoid extra lookups
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Prevent user from submitting multiple reviews for one product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to calculate Avg Rating & breakdown
reviewSchema.statics.calcAverageRatings = async function(productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        // Calculate counts for each star level
        star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
      }
    }
  ]);

  // Update Product Document
  if (stats.length > 0) {
    const total = stats[0].nRating;
    await Product.findByIdAndUpdate(productId, {
      ratings: {
        average: Math.round(stats[0].avgRating * 10) / 10, // Round to 1 decimal (e.g. 4.8)
        count: total,
        breakdown: {
          5: Math.round((stats[0].star5 / total) * 100),
          4: Math.round((stats[0].star4 / total) * 100),
          3: Math.round((stats[0].star3 / total) * 100),
          2: Math.round((stats[0].star2 / total) * 100),
          1: Math.round((stats[0].star1 / total) * 100)
        }
      }
    });
  } else {
    // Reset if no reviews left
    await Product.findByIdAndUpdate(productId, {
      ratings: { average: 0, count: 0, breakdown: { 5:0, 4:0, 3:0, 2:0, 1:0 } }
    });
  }
};

// Call calcAverageRatings after Save/Delete
reviewSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.product);
});

reviewSchema.post('remove', function() {
  this.constructor.calcAverageRatings(this.product);
});

module.exports = mongoose.model('Review', reviewSchema);