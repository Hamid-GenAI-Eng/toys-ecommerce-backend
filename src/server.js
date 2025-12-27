const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const seedAdmin = require('./utils/seeder');

// --- Import Routes ---
const authRoutes = require('./modules/auth/auth.routes');
const productAdminRoutes = require('./modules/products/product.routes');
const productPublicRoutes = require('./modules/products/product.public.routes');
const wishlistRoutes = require('./modules/wishlist/wishlist.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const orderRoutes = require('./modules/orders/order.routes');

const PORT = process.env.PORT || 5000;

// Initialize App
const app = express();

// --- 1. Database Connection Helper (Serverless Optimized) ---
let isConnected = false; // Track connection status

const connectDB = async () => {
  if (isConnected) {
    return; // Already connected, skip to save time
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      // These options are default in Mongoose 6+, but good for safety
      serverSelectionTimeoutMS: 5000 
    });
    isConnected = db.connections[0].readyState;
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Database Connection Failed:', error);
    // Don't exit process on Vercel, just throw so middleware catches it
    throw error;
  }
};

// --- 2. Security & Configuration Middleware ---
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
app.options(/(.*)/, cors());

app.use(helmet()); 
app.use(morgan('dev'));
app.use(express.json());

// --- 3. Database Check Middleware ---
// This ensures DB is connected before ANY route is hit on Vercel
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ message: "Database Connection Error" });
  }
});

// --- 4. Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/admin/products', productAdminRoutes);
app.use('/api/products', productPublicRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.send('TechMall API is running...');
});

// --- 5. Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// --- 6. Local Server Start (For Localhost Only) ---
// Vercel ignores this block, but it runs when you type 'npm start' locally
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      // We only run the seeder locally to avoid performance hits in Prod
      // To seed Prod: run this app locally but point .env to Prod DB URL once
      await seedAdmin(); 
      
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    } catch (err) {
      console.error(err);
    }
  })();
}

// --- 7. Export for Vercel ---
module.exports = app;