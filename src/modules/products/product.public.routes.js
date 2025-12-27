const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { 
  getPublicProducts, 
  getProductDetail, 
  createProductReview 
} = require('./product.public.controller');

// Public Routes (No Auth Required)
router.get('/', getPublicProducts);             // /api/products?search=lego&category=puzzles
router.get('/category/:category', getPublicProducts); // /api/products/category/educational (Handled by query param logic in controller)
router.get('/:slug', getProductDetail);         // /api/products/super-hero-figure

// Private Route (Login Required)
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;