const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/authMiddleware');
const { 
  createOrder, 
  getOrderById, 
  getMyOrders, 
  getAllOrdersAdmin, // NEW
  updateOrderAdmin,  // NEW
  getOrderStats      // NEW
} = require('./order.controller');

// --- Customer Routes ---
router.route('/').post(protect, createOrder);
router.route('/myorders').get(protect, getMyOrders);

// --- Admin Routes ---
// Note: Put specific routes like /stats BEFORE /:id to avoid ID conflict
router.get('/admin/stats', protect, admin, getOrderStats);

router.route('/admin')
  .get(protect, admin, getAllOrdersAdmin); // Get All with Pagination

// Shared/Specific ID Route
router.route('/:id')
  .get(protect, getOrderById) // User sees theirs, Admin sees all
  .put(protect, admin, updateOrderAdmin); // Admin updates Status/Courier

module.exports = router;