const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    // Password is not required if user logs in via Google
    required: function() { return !this.googleId; }
  },
  role: {
    type: String,
    enum: ['Customer', 'Admin'],
    default: 'Customer'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  googleId: {
    type: String,
    default: null
  },
  // For Email Verification
  verificationToken: String,
  verificationTokenExpires: Date
}, { timestamps: true });

// Pre-save middleware to hash password
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;