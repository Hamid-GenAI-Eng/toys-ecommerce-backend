const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { 
  getWishlist, 
  addToWishlist, 
  removeFromWishlist, 
  checkWishlistStatus 
} = require('./wishlist.controller');

// Apply Auth Middleware to all routes
router.use(protect);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.get('/check/:productId', checkWishlistStatus);

module.exports = router;