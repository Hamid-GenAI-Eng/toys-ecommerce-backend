const User = require('./user.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { registerSchema, loginSchema, googleAuthSchema } = require('./auth.validation');
const sendEmail = require('../../utils/emailService');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
exports.registerUser = async (req, res) => {
  try {
    // 1. Validation
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, email, password } = req.body;

    // 2. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // 3. Generate Verification Token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // 4. Create User
    const user = await User.create({
      name,
      email,
      password,
      verificationToken,
      verificationTokenExpires
    });

    // 5. Send Verification Email
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const message = `
      <h1>Welcome to TechMall PK!</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}" clicktracking=off>${verifyUrl}</a>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'TechMall PK - Email Verification',
        message
      });
    } catch (emailError) {
      console.error("Email send failed", emailError);
      // We don't stop registration if email fails, but we log it
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      message: 'Registration successful! Please check email to verify.'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Email
// @route   POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
  const { token } = req.body;
  
  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() }
  });

  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.status(200).json({ message: 'Email Verified Successfully' });
};

// @desc    Google Auth (Login/Signup)
// @route   POST /api/auth/google
exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const { name, email, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (user) {
      // User exists - Login them
      // If they didn't have googleId before, link it now
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // User doesn't exist - Create them
      user = await User.create({
        name,
        email,
        password: crypto.randomBytes(16).toString('hex'), // Random password
        googleId,
        isVerified: true // Google emails are already verified
      });
      
       // Send Welcome Email (Optional)
       await sendEmail({
         email: user.email,
         subject: 'Welcome to TechMall PK',
         message: `<h1>Welcome ${name}!</h1><p>Thanks for signing up with Google.</p>`
       });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });

  } catch (error) {
    res.status(500).json({ message: 'Google Auth Failed' });
  }
};