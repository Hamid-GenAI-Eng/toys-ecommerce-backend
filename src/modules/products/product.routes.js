const express = require('express');
const router = express.Router();
const productUpload = require('../../middleware/uploadMiddleware');
const { protect, admin } = require('../../middleware/authMiddleware');
const { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} = require('./product.controller');

 
router.use(protect);
router.use(admin);

router.route('/')
  .get(getProducts)
  .post(productUpload, createProduct); // Add 'productUpload' here

// Route: /api/admin/products/:id
router.route('/:id')
  .put(productUpload, updateProduct)   // Add 'productUpload' here
  .delete(deleteProduct);

module.exports = router;