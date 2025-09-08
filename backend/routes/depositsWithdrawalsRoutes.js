const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Withdrawal = require('../models/Withdrawal');

// @desc    Get deposits and withdrawals summary with time filtering
// @route   GET /api/v1/deposits-withdrawals/summary
// @access  Private/Admin
router.get('/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const { timeframe = 'all', startDate, endDate } = req.query;
    
    let dateFilter = {};
    
    // Apply time filtering
    if (timeframe !== 'all') {
      const now = new Date();
      let filterDate;
      
      switch (timeframe) {
        case 'day':
          filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'custom':
          if (startDate && endDate) {
            dateFilter = {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            };
          }
          break;
        default:
          filterDate = null;
      }
      
      if (filterDate && timeframe !== 'custom') {
        dateFilter = {
          createdAt: { $gte: filterDate }
        };
      }
    }
    
    // Get total approved deposits
    const depositsResult = await Payment.aggregate([
      { 
        $match: { 
          status: 'Approved',
          ...dateFilter
        }
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get total completed withdrawals
    const withdrawalsResult = await Withdrawal.aggregate([
      { 
        $match: { 
          status: 'COMPLETED',
          ...dateFilter
        }
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalDeposits = depositsResult.length > 0 ? depositsResult[0].total : 0;
    const depositsCount = depositsResult.length > 0 ? depositsResult[0].count : 0;
    const totalWithdrawals = withdrawalsResult.length > 0 ? withdrawalsResult[0].total : 0;
    const withdrawalsCount = withdrawalsResult.length > 0 ? withdrawalsResult[0].count : 0;
    
    // Calculate net flow
    const netFlow = totalDeposits - totalWithdrawals;
    
    res.json({
      success: true,
      data: {
        deposits: totalDeposits,
        withdrawals: totalWithdrawals,
        netFlow,
        depositsCount,
        withdrawalsCount,
        timeframe,
        dateRange: dateFilter.createdAt || null
      }
    });
    
  } catch (error) {
    console.error('Error fetching deposits/withdrawals summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deposits and withdrawals data'
    });
  }
});

// @desc    Get detailed deposits data
// @route   GET /api/v1/deposits-withdrawals/deposits
// @access  Private/Admin
router.get('/deposits', protect, authorize('admin'), async (req, res) => {
  try {
    const { timeframe = 'all', page = 1, limit = 10 } = req.query;
    
    let dateFilter = {};
    
    // Apply time filtering (same logic as summary)
    if (timeframe !== 'all') {
      const now = new Date();
      let filterDate;
      
      switch (timeframe) {
        case 'day':
          filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          filterDate = null;
      }
      
      if (filterDate) {
        dateFilter = {
          createdAt: { $gte: filterDate }
        };
      }
    }
    
    const deposits = await Payment.find({
      status: 'Approved',
      ...dateFilter
    })
    .populate('userId', 'username email')
    .populate('approvedBy', 'username')
    .sort({ approvedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    const total = await Payment.countDocuments({
      status: 'Approved',
      ...dateFilter
    });
    
    res.json({
      success: true,
      data: deposits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deposits data'
    });
  }
});

// @desc    Get detailed withdrawals data
// @route   GET /api/v1/deposits-withdrawals/withdrawals
// @access  Private/Admin
router.get('/withdrawals', protect, authorize('admin'), async (req, res) => {
  try {
    const { timeframe = 'all', page = 1, limit = 10 } = req.query;
    
    let dateFilter = {};
    
    // Apply time filtering (same logic as summary)
    if (timeframe !== 'all') {
      const now = new Date();
      let filterDate;
      
      switch (timeframe) {
        case 'day':
          filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          filterDate = null;
      }
      
      if (filterDate) {
        dateFilter = {
          createdAt: { $gte: filterDate }
        };
      }
    }
    
    const withdrawals = await Withdrawal.find({
      status: 'COMPLETED',
      ...dateFilter
    })
    .populate('user', 'username email')
    .populate('processedBy', 'username')
    .sort({ processedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    const total = await Withdrawal.countDocuments({
      status: 'COMPLETED',
      ...dateFilter
    });
    
    res.json({
      success: true,
      data: withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching withdrawals data'
    });
  }
});

module.exports = router;