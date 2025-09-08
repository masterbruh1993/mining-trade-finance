const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Investment = require('../models/Investment');
const Wallet = require('../models/Wallet');
const AdminLog = require('../models/AdminLog');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

// Protect all routes and require admin role
router.use(protect);
router.use(authorize('admin'));

// @desc    Add balance to user wallet (for testing purposes)
// @route   POST /api/v1/admin/wallets/add-balance
// @access  Private/Admin
router.post('/wallets/add-balance', async (req, res, next) => {
  try {
    const { userId, walletType, amount } = req.body;
    const Wallet = require('../models/Wallet');

    if (!userId || !walletType || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, walletType, and amount'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find or create the wallet
    let wallet = await Wallet.findOne({ user: userId, walletType: walletType });
    console.log(`🔍 Found existing wallet for ${walletType}:`, wallet ? `balance: ${wallet.balance}` : 'not found');
    
    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await Wallet.create({
        user: userId,
        walletType: walletType,
        balance: 0
      });
      console.log(`✅ Created new wallet for ${walletType}:`, wallet._id);
    }

    const previousBalance = wallet.balance;
    wallet.balance += amount;
    await wallet.save();
    console.log(`💰 Updated ${walletType} wallet balance: ${previousBalance} → ${wallet.balance}`);

    // Also update the User model wallet fields to keep them in sync
    const updateField = `${walletType}Wallet`;
    const currentUserBalance = user[updateField] || 0;
    await User.findByIdAndUpdate(
      userId,
      { [updateField]: currentUserBalance + amount },
      { runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: `Successfully added ₱${amount} to ${walletType} wallet`,
      data: {
        userId: userId,
        walletType,
        previousBalance: previousBalance,
        addedAmount: amount,
        newBalance: wallet.balance
      }
    });
  } catch (error) {
    console.error('Error adding wallet balance:', error);
    next(new ErrorResponse('Error adding wallet balance', 500));
  }
});

// @desc    Reset user withdrawal requests
// @route   POST /api/v1/admin/reset-user-requests
// @access  Private/Admin
router.post('/reset-user-requests', async (req, res, next) => {
  try {
    const { userId, scope } = req.body;
    const Withdrawal = require('../models/Withdrawal');
    const AdminLog = require('../models/AdminLog');

    if (!userId || !scope) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId and scope (all or today)'
      });
    }

    if (!['all', 'today'].includes(scope)) {
      return res.status(400).json({
        success: false,
        message: 'Scope must be either "all" or "today"'
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build query based on scope
    let deleteQuery = { user: userId };
    if (scope === 'today') {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      deleteQuery.createdAt = {
        $gte: startOfDay,
        $lt: endOfDay
      };
    }

    // Delete withdrawal records
    const deleteResult = await Withdrawal.deleteMany(deleteQuery);

    // Log the admin action
    await AdminLog.create({
      adminId: req.user.id,
      action: 'reset_user_withdrawals',
      targetUserId: userId,
      description: `Reset ${scope} withdrawal requests for user ${user.email}. Deleted ${deleteResult.deletedCount} records.`
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${deleteResult.deletedCount} pending withdrawal request(s) for user ${user.username || user.email}. Balances and contracts remain unaffected.`,
      data: {
        userId: userId,
        scope: scope,
        deletedCount: deleteResult.deletedCount,
        userIdentifier: user.username || user.email
      }
    });
  } catch (error) {
    console.error('Error resetting user withdrawal requests:', error);
    next(new ErrorResponse('Error resetting user withdrawal requests', 500));
  }
});

// @desc    Get all investments for admin panel
// @route   GET /api/v1/admin/investments
// @access  Private/Admin
router.get('/investments', async (req, res, next) => {
  try {
    const investments = await Investment.find({})
      .populate('user', 'username email fullName')
      .sort({ createdAt: -1 });

    const investmentsData = investments.map(investment => {
      const user = investment.user;
      const cycleProgress = Math.round((investment.payouts.length / investment.totalCycles) * 100);
      const totalReturns = investment.totalPayouts;
      
      // Handle case where user might be null or not populated
      const userName = user ? (user.fullName || user.username || user.email || 'Unknown User') : 'Unknown User';
      const userEmail = user ? user.email || 'No email' : 'No email';
      const userId = user ? user._id : null;
      
      return {
        id: investment._id,
        user: userName,
        userEmail: userEmail,
        userId: userId,
        amount: investment.amount,
        startDate: investment.startDate,
        maturityDate: investment.maturityDate,
        cycleProgress: cycleProgress,
        totalReturns: totalReturns,
        status: investment.status,
        payoutSchedule: investment.payoutSchedule,
        remainingPayouts: investment.remainingPayouts
      };
    });

    res.status(200).json({
      success: true,
      count: investmentsData.length,
      data: investmentsData
    });
  } catch (error) {
    console.error('Error fetching admin investments:', error);
    next(new ErrorResponse('Error fetching investments data', 500));
  }
});

// @desc    Void an investment (Admin action)
// @route   PUT /api/v1/admin/investments/:id/void
// @access  Private/Admin
router.put('/investments/:id/void', async (req, res, next) => {
  try {
    const { reason } = req.body;
    const investmentId = req.params.id;

    // Find the investment
    const investment = await Investment.findById(investmentId).populate('user');
    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    if (investment.status === 'voided' || investment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Investment is already voided'
      });
    }

    const userId = investment.user._id;
    const investmentAmount = investment.amount;

    // Update investment status to voided
    investment.status = 'voided';
    await investment.save();

    // Calculate bonuses to rollback
    const directBonusAmount = investmentAmount * 0.10; // 10% direct bonus
    let indirectBonusTotal = 0;

    // Rollback direct bonus from sponsor
    const user = await User.findById(userId).populate('sponsor');
    if (user.sponsor) {
      const sponsorWallet = await Wallet.findOne({ 
        user: user.sponsor._id, 
        walletType: 'directBonus' 
      });
      if (sponsorWallet && sponsorWallet.balance >= directBonusAmount) {
        sponsorWallet.balance -= directBonusAmount;
        await sponsorWallet.save();
      }
    }

    // Rollback indirect bonuses from uplines (simplified - 5% for level 2)
    if (user.sponsor) {
      const sponsorUser = await User.findById(user.sponsor._id).populate('sponsor');
      if (sponsorUser && sponsorUser.sponsor) {
        const indirectBonusAmount = investmentAmount * 0.05; // 5% indirect bonus
        const uplineWallet = await Wallet.findOne({ 
          user: sponsorUser.sponsor._id, 
          walletType: 'directBonus' 
        });
        if (uplineWallet && uplineWallet.balance >= indirectBonusAmount) {
          uplineWallet.balance -= indirectBonusAmount;
          await uplineWallet.save();
          indirectBonusTotal += indirectBonusAmount;
        }
      }
    }

    // Log the admin action
    await AdminLog.create({
      adminId: req.user.id,
      action: 'void_investment',
      targetUserId: userId,
      description: `Voided investment of ${investmentAmount} for user ${investment.user.email}. Direct bonus rollback: ${directBonusAmount}, Indirect bonus rollback: ${indirectBonusTotal}. Reason: ${reason || 'No reason provided'}`,
      oldValues: {
        investmentId: investmentId,
        amount: investmentAmount,
        status: 'active',
        directBonusRollback: directBonusAmount,
        indirectBonusRollback: indirectBonusTotal
      },
      newValues: {
         status: 'voided',
         reason: reason || 'No reason provided'
       }
    });

    res.status(200).json({
      success: true,
      message: 'Investment voided successfully',
      data: {
        investmentId: investmentId,
        userId: userId,
        amount: investmentAmount,
        directBonusRollback: directBonusAmount,
        indirectBonusRollback: indirectBonusTotal,
        reason: reason || 'No reason provided'
      }
    });
  } catch (error) {
    console.error('Error voiding investment:', error);
    next(new ErrorResponse('Error voiding investment', 500));
  }
});

module.exports = router;