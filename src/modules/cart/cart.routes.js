const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { getCart, addToCart, removeFromCart } = require('./cart.controller');

router.use(protect);
router.route('/').get(getCart).post(addToCart);
router.route('/:productId').delete(removeFromCart);

module.exports = router;