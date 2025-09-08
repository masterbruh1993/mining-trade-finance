const express = require('express');
const {
  requestWithdrawal,
  getUserWithdrawals,
  getAllWithdrawals,
  processWithdrawal,
  setWithdrawalAsPaid,
  cancelWithdrawal
} = require('../controllers/withdrawalController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// @desc    Request withdrawal & Get user withdrawals
// @route   POST /api/v1/withdrawals
// @route   GET /api/v1/withdrawals
// @access  Private
router.route('/')
  .post(requestWithdrawal)
  .get(getUserWithdrawals);

// @desc    Get all withdrawals (Admin only)
// @route   GET /api/v1/withdrawals/admin
// @access  Private/Admin
router.get('/admin', authorize('admin'), getAllWithdrawals);

// @desc    Process withdrawal (Admin only)
// @route   PUT /api/v1/withdrawals/:id/process
// @access  Private/Admin
router.put('/:id/process', authorize('admin'), processWithdrawal);

// @desc    Set withdrawal as paid (Admin only)
// @route   PUT /api/v1/withdrawals/:id/set-paid
// @access  Private/Admin
router.put('/:id/set-paid', authorize('admin'), setWithdrawalAsPaid);

// @desc    Cancel withdrawal (Admin only)
// @route   PUT /api/v1/withdrawals/:id/cancel
// @access  Private/Admin
router.put('/:id/cancel', authorize('admin'), cancelWithdrawal);

module.exports = router;