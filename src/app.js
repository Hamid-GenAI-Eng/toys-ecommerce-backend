const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import Routes
const authRoutes = require('./modules/auth/auth.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet()); // Security Headers
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('TechMall API is running...');
});

module.exports = app;