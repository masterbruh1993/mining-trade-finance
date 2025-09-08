const express = require('express');
const { 
  getMe, 
  updateDetails, 
  updatePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// @desc    Get user profile
// @route   GET /api/v1/settings/profile
// @access  Private
router.get('/profile', getMe);

// @desc    Update user profile
// @route   PUT /api/v1/settings/profile
// @access  Private
router.put('/profile', updateDetails);

// @desc    Update user password
// @route   PUT /api/v1/settings/password
// @access  Private
router.put('/password', updatePassword);

module.exports = router;