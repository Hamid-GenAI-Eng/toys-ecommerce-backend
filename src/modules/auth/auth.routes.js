const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { registerUser, loginUser, verifyEmail, googleAuth } = require('./auth.controller');

// Security: Rate limiter (Max 100 requests per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: 'Too many login attempts, please try again later.'
});

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/verify-email', verifyEmail);
router.post('/google', googleAuth);

module.exports = router;