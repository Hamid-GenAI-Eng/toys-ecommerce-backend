const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// const app = require('./app'); // ❌ DELETE THIS LINE
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const seedAdmin = require('./utils/seeder');
const authRoutes = require('./modules/auth/auth.routes');

dotenv.config();

const PORT = process.env.PORT || 5000;

// Initialize App here
const app = express();

// --- 1. Security & Configuration Middleware ---

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://playful-pixels.vercel.app"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors()); // Enable Pre-Flight

app.use(helmet()); 
app.use(morgan('dev'));
app.use(express.json());

// --- 2. Routes ---
app.use('/api/auth', authRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.send('TechMall API is running...');
});

// --- 3. Server Start & DB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;