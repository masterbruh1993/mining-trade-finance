const Withdrawal = require('../models/Withdrawal');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const EncashmentSettings = require('../models/EncashmentSettings');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Request withdrawal
// @route   POST /api/v1/withdrawals
// @access  Private
exports.requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, walletType = 'passive', payoutMethod, accountDetails } = req.body;
    const userId = req.user.id;

    // Check wallet-specific encashment settings first
    const encashmentSettings = await EncashmentSettings.getSettings();
    const walletTypeForEncashment = walletType === 'directBonus' ? 'directBonus' : 'passive';
    const encashmentStatus = encashmentSettings.getEncashmentStatus(walletTypeForEncashment);
    
    if (!encashmentStatus.isAllowed) {
      return next(new ErrorResponse(`${encashmentStatus.message} for ${walletType} wallet`, 403));
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return next(new ErrorResponse('Please provide a valid amount', 400));
    }

    // Helper function to create rejected withdrawal
    const createRejectedWithdrawal = async (reason) => {
      const rejectedWithdrawal = await Withdrawal.create({
        user: userId,
        amount: parseFloat(amount) || 0,
        walletType: walletType,
        paymentMethod: paymentMethod || 'gcash',
        paymentDetails: {
          accountNumber: accountDetails ? accountDetails.trim() : '',
          accountName: req.user.fullName || req.user.username
        },
        status: 'REJECTED',
        remarks: reason
      });
      return rejectedWithdrawal;
    };

    // Minimum withdrawal amount based on wallet type
    const minimumAmount = walletType === 'passive' ? 300 : 500;
    if (amount < minimumAmount) {
      await createRejectedWithdrawal(`Amount below minimum requirement of ₱${minimumAmount}`);
      return next(new ErrorResponse(`Minimum withdrawal amount for ${walletType} wallet is ₱${minimumAmount}`, 400));
    }

    // Validate payout method and account details
    if (!payoutMethod) {
      await createRejectedWithdrawal('Invalid payout method');
      return next(new ErrorResponse('Please select a payout method', 400));
    }

    if (!accountDetails || accountDetails.trim() === '') {
      await createRejectedWithdrawal('Missing account details');
      return next(new ErrorResponse('Please provide account details', 400));
    }

    // Map payout method to model format
    const paymentMethod = payoutMethod.toLowerCase().replace('cash', 'cash').replace('maya', 'paymaya');
    if (!['gcash', 'paymaya', 'gotyme'].includes(paymentMethod)) {
      return next(new ErrorResponse('Invalid payout method', 400));
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ 
      user: userId, 
      walletType: walletType 
    });

    console.log(`🔍 Withdrawal Debug - User: ${userId}, WalletType: ${walletType}`);
    console.log(`🔍 Withdrawal Debug - Wallet found:`, wallet ? `balance: ${wallet.balance}` : 'not found');
    console.log(`🔍 Withdrawal Debug - Requested amount: ${amount}`);

    if (!wallet) {
      return next(new ErrorResponse('Wallet not found', 404));
    }

    // Check if user has sufficient balance
    if (wallet.balance < amount) {
      await createRejectedWithdrawal(`Insufficient balance. Available: ₱${wallet.balance}, Requested: ₱${amount}`);
      return next(new ErrorResponse('Insufficient balance', 400));
    }

    // Check for pending withdrawals for this specific wallet type
    const pendingWithdrawal = await Withdrawal.findOne({
      user: userId,
      walletType: walletType,
      status: { $regex: /^pending$/i }
    });

    if (pendingWithdrawal) {
      const walletDisplayName = walletType === 'passive' ? 'Passive' : 
                               walletType === 'bonus' ? 'Bonus' : 
                               walletType === 'directBonus' ? 'Direct Bonus' : 'Credit';
      return next(new ErrorResponse(`You already have a pending ${walletDisplayName} Wallet withdrawal request`, 400));
    }

    // Check for daily withdrawal limit per wallet type (1 request per day per wallet)
    // Only count PENDING and COMPLETED requests toward the daily limit
    // CANCELLED and REJECTED requests do not count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayActiveWithdrawal = await Withdrawal.findOne({
      user: userId,
      walletType: walletType,
      status: { $in: ['PENDING', 'COMPLETED'] },
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (todayActiveWithdrawal) {
      const walletDisplayName = walletType === 'passive' ? 'Passive' : 
                               walletType === 'bonus' ? 'Bonus' : 
                               walletType === 'directBonus' ? 'Direct Bonus' : 'Credit';
      return next(new ErrorResponse(`You already have a ${todayActiveWithdrawal.status.toLowerCase()} ${walletDisplayName} Wallet withdrawal request today. Please try again tomorrow.`, 400));
    }

    // Create withdrawal request (do NOT deduct balance or create transaction yet)
    const withdrawal = await Withdrawal.create({
      user: userId,
      amount: parseFloat(amount),
      walletType: walletType,
      paymentMethod: paymentMethod,
      paymentDetails: {
        accountNumber: accountDetails.trim(),
        accountName: req.user.fullName || req.user.username
      },
      status: 'PENDING'
    });

    // Note: Wallet balance will be deducted only when withdrawal is approved
    // Transaction record will be created only when withdrawal is approved

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: withdrawal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user withdrawals
// @route   GET /api/v1/withdrawals
// @access  Private
exports.getUserWithdrawals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user.id;

    let query = { user: userId };
    if (status) {
      query.status = status;
    }

    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'fullName email')
      .populate('processedBy', 'fullName');

    const total = await Withdrawal.countDocuments(query);

    res.status(200).json({
      success: true,
      count: withdrawals.length,
      total,
      data: withdrawals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all withdrawals (Admin only)
// @route   GET /api/v1/withdrawals/admin
// @access  Private/Admin
exports.getAllWithdrawals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, walletType } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }
    if (walletType) {
      query.walletType = walletType;
    }

    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'fullName email mobileNumber')
      .populate('processedBy', 'fullName');

    const total = await Withdrawal.countDocuments(query);

    res.status(200).json({
      success: true,
      count: withdrawals.length,
      total,
      data: withdrawals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process withdrawal (Admin only)
// @route   PUT /api/v1/withdrawals/:id/process
// @access  Private/Admin
exports.processWithdrawal = async (req, res, next) => {
  try {
    const { action, remarks } = req.body; // action: 'approve' or 'reject'
    const withdrawalId = req.params.id;
    const adminId = req.user.id;

    if (!['approve', 'reject'].includes(action)) {
      return next(new ErrorResponse('Invalid action. Use approve or reject', 400));
    }

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return next(new ErrorResponse('Withdrawal not found', 404));
    }

    if (withdrawal.status.toUpperCase() !== 'PENDING') {
      return next(new ErrorResponse('Withdrawal already processed', 400));
    }

    if (action === 'approve') {
      // First, verify user has sufficient balance and deduct it
      const wallet = await Wallet.findOne({
        user: withdrawal.user,
        walletType: withdrawal.walletType
      });

      if (!wallet) {
        return next(new ErrorResponse('User wallet not found', 404));
      }

      if (wallet.balance < withdrawal.amount) {
        return next(new ErrorResponse(`Insufficient balance. Available: ₱${wallet.balance}, Required: ₱${withdrawal.amount}`, 400));
      }

      // Deduct balance from wallet
      wallet.balance -= withdrawal.amount;
      await wallet.save();

      // Update withdrawal status to completed
      withdrawal.status = 'COMPLETED';
      withdrawal.approvedBy = adminId;
      withdrawal.approvedAt = new Date();
      withdrawal.processedBy = adminId;
      withdrawal.processedAt = new Date();
      withdrawal.remarks = remarks;
      await withdrawal.save();

      // Create transaction record
      await Transaction.create({
        user: withdrawal.user,
        type: 'withdrawal',
        amount: withdrawal.amount,
        netAmount: withdrawal.amount,
        walletType: withdrawal.walletType,
        status: 'completed',
        description: `Withdrawal approved - ₱${withdrawal.amount}`,
        reference: withdrawal._id
      });

    } else {
      // Reject withdrawal (no need to refund since balance wasn't deducted initially)
      withdrawal.status = 'REJECTED';
      withdrawal.rejectedBy = adminId;
      withdrawal.rejectedAt = new Date();
      withdrawal.processedBy = adminId;
      withdrawal.processedAt = new Date();
      withdrawal.remarks = remarks || 'Withdrawal rejected by admin';
      await withdrawal.save();

      // No transaction record to update since none was created during request
    }

    res.status(200).json({
      success: true,
      message: `Withdrawal ${action}d successfully`,
      data: withdrawal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set withdrawal as paid (Admin only)
// @route   PUT /api/v1/withdrawals/:id/set-paid
// @access  Private/Admin
exports.setWithdrawalAsPaid = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const withdrawalId = req.params.id;
    const adminId = req.user.id;

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return next(new ErrorResponse('Withdrawal not found', 404));
    }

    if (withdrawal.status.toUpperCase() !== 'PENDING') {
      return next(new ErrorResponse('Withdrawal already processed', 400));
    }

    // First, verify user has sufficient balance and deduct it
    const wallet = await Wallet.findOne({
      user: withdrawal.user,
      walletType: withdrawal.walletType
    });

    if (!wallet) {
      return next(new ErrorResponse('User wallet not found', 404));
    }

    if (wallet.balance < withdrawal.amount) {
      return next(new ErrorResponse(`Insufficient balance. Available: ₱${wallet.balance}, Required: ₱${withdrawal.amount}`, 400));
    }

    // Deduct balance from wallet
    wallet.balance -= withdrawal.amount;
    await wallet.save();

    // Update withdrawal status to completed
    withdrawal.status = 'COMPLETED';
    withdrawal.approvedBy = adminId;
    withdrawal.approvedAt = new Date();
    withdrawal.processedBy = adminId;
    withdrawal.processedAt = new Date();
    withdrawal.remarks = remarks || 'Marked as paid by admin';
    await withdrawal.save();

    // Create transaction record
    await Transaction.create({
      user: withdrawal.user,
      type: 'withdrawal',
      amount: withdrawal.amount,
      netAmount: withdrawal.amount,
      walletType: withdrawal.walletType,
      status: 'completed',
      description: `Withdrawal marked as paid - ₱${withdrawal.amount}`,
      reference: withdrawal._id
    });

    res.status(200).json({
      success: true,
      message: 'Withdrawal marked as paid successfully',
      data: withdrawal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel withdrawal request (Admin only)
// @route   PUT /api/v1/withdrawals/:id/cancel
// @access  Private/Admin
exports.cancelWithdrawal = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const withdrawalId = req.params.id;
    const adminId = req.user.id;

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return next(new ErrorResponse('Withdrawal not found', 404));
    }

    if (withdrawal.status.toUpperCase() !== 'PENDING') {
      return next(new ErrorResponse('Withdrawal already processed', 400));
    }

    // Cancel withdrawal (no need to refund since balance wasn't deducted initially)
    withdrawal.status = 'CANCELLED';
    withdrawal.cancelledBy = adminId;
    withdrawal.cancelledAt = new Date();
    withdrawal.processedBy = adminId;
    withdrawal.processedAt = new Date();
    withdrawal.remarks = remarks || 'Cancelled by admin';
    await withdrawal.save();

    // No transaction record to update since none was created during request

    res.status(200).json({
      success: true,
      message: 'Withdrawal cancelled successfully',
      data: withdrawal
    });
  } catch (error) {
    next(error);
  }
};