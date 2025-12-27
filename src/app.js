const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/products/product.routes');
const productPublicRoutes = require('./modules/products/product.public.routes');
const wishlistRoutes = require('./modules/wishlist/wishlist.routes');

const app = express();

// AWS Lambda often handles CORS at the Gateway level, 
// but we keep this for local testing and double safety.
const corsOptions = {
  origin: [
    "http://localhost:5173", 
    "https://playful-pixels.vercel.app"
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/products', productRoutes);
app.use('/api/products', productPublicRoutes);
app.use('/api/wishlist', wishlistRoutes);

app.get('/', (req, res) => {
  res.send('TechMall Auth Service (Lambda) is running...');
});

module.exports = app;