const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    maxlength: [50, 'Username cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters long and contain at least 1 special character.'],
    validate: {
      validator: function(password) {
        // Check for at least one special character
        return /[!@#$%^&*(),.?":{}|<>]/.test(password);
      },
      message: 'Password must be at least 8 characters long and contain at least 1 special character.'
    },
    select: false
  },
  fullName: {
    type: String,
    required: [true, 'Please provide your full name']
  },
  mobileNumber: {
    type: String,
    required: [true, 'Please provide your mobile number'],
    validate: {
      validator: function(mobileNumber) {
        // Check for Philippines mobile number format (09 + 9 digits)
        return /^09\d{9}$/.test(mobileNumber);
      },
      message: 'Invalid mobile number format'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
// Referral system removed
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Inactive'
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  creditWallet: {
    type: Number,
    default: 0
  },
  passiveWallet: {
    type: Number,
    default: 0
  },
  // Bonus wallet removed with referral system
  isActive: {
    type: Boolean,
    default: false
  },
  activationDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Referral code generation removed

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ 
    id: this._id, 
    role: this.role 
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);