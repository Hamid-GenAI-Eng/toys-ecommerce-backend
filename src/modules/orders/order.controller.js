const Order = require('./order.model');
const Cart = require('../cart/cart.model');
const Product = require('../products/product.model');
const sendEmail = require('../../utils/emailService');
const { processMobilePayment } = require('./payment.service');

// @desc    Create New Order (Checkout)
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  const { shippingAddress, paymentMethod, deliveryMethod, mobileAccount } = req.body;

  try {
    // 1. Get User Cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // 2. Calculate Prices
    const itemsPrice = cart.totalPrice;
    const shippingPrice = deliveryMethod === 'Express' ? 500 : 200; // Example Rates
    let totalPrice = itemsPrice + shippingPrice;

    // 3. Payment Processing Logic
    let paymentInfo = { id: null, status: 'Pending' };
    let isPaid = false;

    if (paymentMethod === 'JazzCash' || paymentMethod === 'Easypaisa') {
      try {
        const paymentResponse = await processMobilePayment(paymentMethod, totalPrice, mobileAccount);
        paymentInfo = {
          id: paymentResponse.transactionId,
          status: 'Completed',
          update_time: new Date().toISOString()
        };
        isPaid = true;
      } catch (paymentError) {
        return res.status(400).json({ message: `Payment Failed: ${paymentError.message}` });
      }
    } else if (paymentMethod === 'COD') {
        // Here you could implement the "Advance Delivery Charge" logic
        // For now, we allow standard COD
        paymentInfo = { status: 'Pending COD' };
    }

    // 4. Create Order
    const order = await Order.create({
      user: req.user._id,
      orderItems: cart.items,
      shippingAddress,
      paymentMethod,
      paymentResult: paymentInfo,
      deliveryMethod,
      shippingPrice,
      totalPrice,
      isPaid,
      paidAt: isPaid ? Date.now() : null
    });

    // 5. Update Inventory (Subtract Stock)
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock_quantity: -item.quantity }
      });
    }

    // 6. Clear Cart
    await Cart.findOneAndDelete({ user: req.user._id });

    // 7. Send Confirmation Email
    const message = `
      <h1>Order Confirmation</h1>
      <p>Order ID: ${order._id}</p>
      <p>Total: PKR ${totalPrice}</p>
      <p>Status: ${order.orderStatus}</p>
      <p>Thank you for shopping with TechMall PK!</p>
    `;
    
    try {
        await sendEmail({
            email: req.user.email,
            subject: 'Order Confirmed - TechMall PK',
            message
        });
    } catch(e) { console.log('Email failed'); }

    res.status(201).json(order);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Order by ID
// @route   GET /api/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      // Ensure only Admin or the Owner can view
      if(req.user.role !== 'Admin' && order.user._id.toString() !== req.user._id.toString()){
          return res.status(401).json({ message: 'Not authorized' });
      }
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get My Orders
// @route   GET /api/orders/myorders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Order Status (Admin)
// @route   PUT /api/orders/:id/deliver
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body; // 'Shipped', 'Delivered', etc.
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.orderStatus = status;

    if (status === 'Delivered') {
      order.deliveredAt = Date.now();
      // If COD, mark as paid upon delivery
      if (order.paymentMethod === 'COD') {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get All Orders (Admin Dashboard)
// @route   GET /api/admin/orders
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.page) || 1;
    
    // Filtering logic
    const keyword = req.query.search
      ? {
          _id: req.query.search // Search by Order ID
        }
      : {};

    // Filter by Status (e.g., ?status=Pending)
    if (req.query.status) {
      keyword.orderStatus = req.query.status;
    }

    const count = await Order.countDocuments({ ...keyword });
    const orders = await Order.find({ ...keyword })
      .populate('user', 'id name email') // Include Customer Name & Email
      .sort({ createdAt: -1 }) // Newest first
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      orders,
      page,
      pages: Math.ceil(count / pageSize),
      totalOrders: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Order Status & Tracking (Admin)
// @route   PUT /api/admin/orders/:id
exports.updateOrderAdmin = async (req, res) => {
  const { status, courierName, trackingId } = req.body;

  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 1. Update Status
    if (status) {
      order.orderStatus = status;
      
      // Auto-timestamp for delivery
      if (status === 'Delivered') {
        order.deliveredAt = Date.now();
        // If COD, mark as paid automatically when delivered
        if (order.paymentMethod === 'COD' && !order.isPaid) {
          order.isPaid = true;
          order.paidAt = Date.now();
        }
      }
    }

    // 2. Update Courier Info (For "Shipment Confirmation")
    if (courierName) order.courierInfo.courierName = courierName;
    if (trackingId) order.courierInfo.trackingId = trackingId;

    const updatedOrder = await order.save();

    // 3. Send Email Notification to User (Scalable feature)
    if (status === 'Shipped') {
      const message = `
        <h1>Order Shipped!</h1>
        <p>Dear ${order.user.name},</p>
        <p>Your order <strong>${order._id}</strong> has been shipped via <strong>${order.courierInfo.courierName}</strong>.</p>
        <p>Tracking ID: ${order.courierInfo.trackingId}</p>
        <p>Track here: <a href="https://leopardscourier.com/track?id=${order.courierInfo.trackingId}">Track Order</a></p>
      `;
      // Don't await email to prevent blocking the response
      sendEmail({ email: order.user.email, subject: 'Order Shipped - TechMall PK', message }).catch(console.error);
    }

    res.json(updatedOrder);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Order Statistics (For Admin Cards)
// @route   GET /api/admin/orders/stats
exports.getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' }, // Total Sales
          totalOrders: { $sum: 1 },              // Total Count
          pendingOrders: { 
            $sum: { $cond: [{ $eq: ['$orderStatus', 'Pending'] }, 1, 0] } 
          },
          paidOrders: { 
            $sum: { $cond: [{ $eq: ['$isPaid', true] }, 1, 0] } 
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({ totalRevenue: 0, totalOrders: 0, pendingOrders: 0 });
    }

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};