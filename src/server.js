const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import Routes
const authRoutes = require('./modules/auth/auth.routes');

const app = express();

// --- 1. Security & Configuration Middleware (Top Level) ---

// CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:5173",             // Local Development (Vite)
    "https://playful-pixels.vercel.app"  // Production Frontend
  ],
  credentials: true, // Allows sending cookies/authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Security Headers
app.use(helmet()); 

// Logger (for debugging)
app.use(morgan('dev'));

// Body Parser (to read JSON inputs)
app.use(express.json());

// --- 2. Routes ---
app.use('/api/auth', authRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.send('TechMall API is running...');
});

// --- 3. Global Error Handler (Optional but Recommended) ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;