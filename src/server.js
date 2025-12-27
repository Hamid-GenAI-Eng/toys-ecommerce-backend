const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const seedAdmin = require('./utils/seeder');

// --- Import Routes ---
const authRoutes = require('./modules/auth/auth.routes');
const productAdminRoutes = require('./modules/products/product.routes');
const productPublicRoutes = require('./modules/products/product.public.routes');
const wishlistRoutes = require('./modules/wishlist/wishlist.routes');

dotenv.config();

const PORT = process.env.PORT || 5000;

// Initialize App
const app = express();

// --- 1. Security & Configuration Middleware ---

const corsOptions = {
  origin: [
    "http://localhost:5173",             // Local Frontend
    "https://playful-pixels.vercel.app"  // Production Frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors()); // Enable Pre-Flight for all routes

app.use(helmet()); 
app.use(morgan('dev'));
app.use(express.json()); // Parse JSON bodies

// --- 2. Routes ---

// Auth Routes
app.use('/api/auth', authRoutes);

// Product Routes (Admin Side - Protected)
app.use('/api/admin/products', productAdminRoutes);

// Product Routes (Public Side - Storefront)
app.use('/api/products', productPublicRoutes);

// Wishlist Routes (User Side - Protected)
app.use('/api/wishlist', wishlistRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.send('TechMall API is running...');
});

// --- 3. Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// --- 4. Server Start & DB Connection ---
// Only connect if this file is run directly (not imported by Lambda handler)
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log('✅ MongoDB Connected');
      
      // Run Admin Seeder
      await seedAdmin();
      
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Database Connection Failed:', err);
      process.exit(1);
    });
}

// Export app for Serverless/Lambda handler
module.exports = app;