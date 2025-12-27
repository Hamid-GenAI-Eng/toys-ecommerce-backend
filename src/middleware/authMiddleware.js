const jwt = require('jsonwebtoken');
const User = require('../modules/auth/user.model');

// 1. Verify Token (Authentication)
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Proceed to next middleware
      return; // <--- ADD THIS: Stop execution here

    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' }); // <--- ADD Return
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' }); // <--- ADD Return
  }
};

// 2. Verify Admin Role (Authorization)
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access Denied: Admins only' });
  }
};