const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboardController');
const { 
  getAdminDashboard, 
  getAdminWallet, 
  addFundsToAdminWallet, 
  deductFundsFromAdminWallet,
  getLeaderSalesData 
} = require('../controllers/adminDashboardController');
const User = require('../models/User');

router.get('/', protect, getDashboard);

// @desc    Get comprehensive admin dashboard data
// @route   GET /api/v1/dashboard/admin
// @access  Private/Admin
router.get('/admin', protect, authorize('admin'), getAdminDashboard);

// @desc    Get admin wallet details
// @route   GET /api/v1/dashboard/admin/wallet
// @access  Private/Admin
router.get('/admin/wallet', protect, authorize('admin'), getAdminWallet);

// @desc    Add funds to admin wallet
// @route   POST /api/v1/dashboard/admin/wallet/add
// @access  Private/Admin
router.post('/admin/wallet/add', protect, authorize('admin'), addFundsToAdminWallet);

// @desc    Deduct funds from admin wallet
// @route   POST /api/v1/dashboard/admin/wallet/deduct
// @access  Private/Admin
router.post('/admin/wallet/deduct', protect, authorize('admin'), deductFundsFromAdminWallet);

// @desc    Get leader sales monitoring data
// @route   GET /api/v1/dashboard/admin/leaders
// @access  Private/Admin
router.get('/admin/leaders', protect, authorize('admin'), getLeaderSalesData);

// @desc    Get user dashboard data
// @route   GET /api/v1/dashboard/user
// @access  Private/User
router.get('/user', protect, authorize('user'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User dashboard access granted',
    data: {
      userRole: req.user.role,
      userId: req.user._id,
      dashboardType: 'user'
    }
  });
});

// @desc    Get all users for admin panel
// @route   GET /api/v1/dashboard/users
// @access  Private/Admin
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

module.exports = router;