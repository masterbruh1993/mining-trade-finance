const User = require('../models/User');
const Wallet = require('../models/Wallet');
// Referral system removed
const ErrorResponse = require('../utils/errorResponse');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, mobileNumber } = req.body;

    // Validate required fields
    if (!fullName || fullName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide your full name.'
      });
    }

    if (!mobileNumber || mobileNumber.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide your mobile number'
      });
    }

    // Validate mobile number format
    if (!/^09\d{9}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format'
      });
    }

    // Check for duplicate email or username
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { username: username }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Registration failed: Email already exists'
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          success: false,
          message: 'Registration failed: Username already exists'
        });
      }
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      mobileNumber,
      role: 'user',
      status: 'Inactive',
      walletBalance: 0
    });

    // Referral system removed - no referral processing

    // Create wallets for user
    const walletTypes = ['bonus', 'passive', 'credit'];
    console.log('Creating wallets for user:', user._id);
    console.log('Wallet types to create:', walletTypes);
    
    for (const type of walletTypes) {
      const wallet = await Wallet.create({
        user: user._id,
        walletType: type,
        balance: 0
      });
      console.log('Created wallet:', wallet.walletType, 'for user:', user._id);
    }
    
    // Verify created wallets
    const createdWallets = await Wallet.find({ user: user._id });
    console.log('Total wallets created for user:', createdWallets.length);
    createdWallets.forEach(w => console.log('  -', w.walletType));

    res.status(201).json({
      success: true,
      message: "User registered successfully! Please login.",
      // No referral warnings
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors);
      let message = 'Registration failed';
      
      // Check for specific validation errors
      const passwordError = errors.find(err => err.path === 'password');
      const mobileError = errors.find(err => err.path === 'mobileNumber');
      
      if (passwordError) {
        message = 'Password must be at least 8 characters long and contain at least 1 special character.';
      } else if (mobileError) {
        message = mobileError.message;
      } else {
        message = errors.map(val => val.message).join(', ');
      }
      
      return res.status(400).json({
        success: false,
        message: message
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      let message = 'Registration failed';
      
      if (field === 'email') {
        message = 'Email already exists';
      } else if (field === 'username') {
        message = 'Username already exists';
      } else {
        message = `${field} already exists`;
      }
      
      return res.status(400).json({
        success: false,
        message: message
      });
    }
    
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed: Server error'
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Validate emailOrUsername & password
    if (!emailOrUsername || !password) {
      return next(new ErrorResponse('Please provide an email/username and password', 400));
    }

    // Check for user by email or username
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password'
      });
    }

    // Create token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        referralCode: user.referralCode,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      fullName: req.body.fullName,
      mobileNumber: req.body.mobileNumber
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return next(new ErrorResponse('Password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    // Create token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    next(error);
  }
};