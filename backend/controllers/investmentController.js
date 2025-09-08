const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all investments for a user
// @route   GET /api/v1/investments
// @access  Private
exports.getInvestments = async (req, res, next) => {
  try {
    const investments = await Investment.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: investments.length,
      data: investments
    });
  } catch (error) {
    next(error);
  }
};

// Commission logic removed for Mining Trade Finance

// @desc    Get single investment
// @route   GET /api/v1/investments/:id
// @access  Private
exports.getInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return next(new ErrorResponse(`Investment not found with id of ${req.params.id}`, 404));
    }

    // Make sure investment belongs to user
    if (investment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`Not authorized to access this investment`, 401));
    }

    res.status(200).json({
      success: true,
      data: investment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate investment from credit wallet
// @route   POST /api/v1/investments/activate
// @access  Private
exports.activateInvestment = async (req, res, next) => {
  try {
    const { amount } = req.body;
    
    // Validate input
    if (!amount) {
      return res.status(400).json({
        status: 'failed',
        message: 'Please provide investment amount'
      });
    }
    
    // Check minimum capital requirement
    if (amount < 25000) {
      return res.status(400).json({
        status: 'failed',
        message: 'Minimum activation is ₱25,000'
      });
    }
    
    // Check maximum capital requirement
    if (amount > 500000) {
      return res.status(400).json({
        status: 'failed',
        message: 'Maximum activation is ₱500,000'
      });
    }
    
    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'failed', message: 'User not found' });
    }

    // Determine the correct balance field and current balance
    let currentBalance;
    let balanceField;
    
    if (user.creditWallet !== undefined) {
      currentBalance = user.creditWallet;
      balanceField = 'creditWallet';
    } else if (user.credit_wallet !== undefined) {
      currentBalance = user.credit_wallet;
      balanceField = 'credit_wallet';
    } else if (user.balance !== undefined) {
      currentBalance = user.balance;
      balanceField = 'balance';
    } else if (user.walletBalance !== undefined) {
      currentBalance = user.walletBalance;
      balanceField = 'walletBalance';
    } else {
      return res.status(500).json({
        status: 'failed',
        message: 'No valid balance field found in user schema'
      });
    }
    


    // Check if user has enough balance
    if (currentBalance < amount) {
      return res.status(400).json({
        status: 'failed',
        message: 'Insufficient Credit Wallet balance'
      });
    }
    
    // Note: We're using User model's creditWallet field directly
    // No need to check separate Wallet model for credit wallet
    
    // Create investment record (60-day plan with single payout at maturity)
    const startDate = new Date();
    const maturityDate = new Date(startDate.getTime() + 60*24*60*60*1000); // 60 days from start
    
    const investment = await Investment.create({
      user: req.user.id,
      amount,
      startDate,
      maturityDate,
      duration: 60,
      totalROI: 400, // 300% profit + 100% capital return = 400% total
      payoutPercent: 100, // 100% capital return at maturity
      payoutInterval: 60, // Single payout at end
      totalCycles: 1, // Single payout cycle
      status: 'active'
    });
    
    // Create activation transaction record
    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'activation',
      amount,
      fee: 0,
      netAmount: amount,
      walletType: 'credit',
      status: 'completed',
      description: `Investment activation - ₱${amount}`
    });
    
    // Deduct from the correct balance field
    user[balanceField] -= amount;
    
    // Save the user with the updated balance
    await user.save({ validateBeforeSave: false });
    
    // Verify the save by refetching the user
    const updatedUser = await User.findById(req.user.id);
    
    // Note: We're using User model's creditWallet field directly
    // The separate Wallet model is not needed for credit wallet operations
    
    // Commission logic removed for Mining Trade Finance
    
    const activationResult = {
      investment,
      transaction,
      updatedBalance: updatedUser[balanceField] || updatedUser.creditWallet || updatedUser.credit_wallet || updatedUser.balance || updatedUser.walletBalance
    };
    
    res.status(200).json({
      status: 'success',
      message: 'Activation successful',
      data: activationResult
    });
  } catch (error) {
    next(error);
  }
};

// Alias for backward compatibility
exports.createInvestment = exports.activateInvestment;

// @desc    Process earnings payouts for active investments
// @route   POST /api/v1/investments/process-payouts
// @access  Private (Admin only)
exports.processEarningsPayouts = async (req, res, next) => {
  try {
    const currentDate = new Date();
    const processedPayouts = [];
    
    // Find all active investments
    const activeInvestments = await Investment.find({ status: 'active' });
    
    for (const investment of activeInvestments) {
      // Check for pending payouts that are due
      for (let i = 0; i < investment.payoutSchedule.length; i++) {
        const payout = investment.payoutSchedule[i];
        
        if (payout.status === 'pending' && currentDate >= payout.payoutDate) {
          // Get user's passive wallet
          const passiveWallet = await Wallet.findOne({
            user: investment.user,
            walletType: 'passive'
          });
          
          if (!passiveWallet) {
            console.error(`Passive wallet not found for user ${investment.user}`);
            continue;
          }
          
          // Credit the payout to passive wallet
          passiveWallet.balance += payout.payoutAmount;
          passiveWallet.totalIn += payout.payoutAmount;
          await passiveWallet.save();
          
          // Create earnings transaction
          const transaction = await Transaction.create({
            user: investment.user,
            type: 'earning',
            amount: payout.payoutAmount,
            fee: 0,
            netAmount: payout.payoutAmount,
            walletType: 'passive',
            status: 'completed',
            description: `Investment earnings payout - Day ${(i + 1) * 3}`
          });
          
          // Mark payout as completed
          investment.payoutSchedule[i].status = 'completed';
          investment.payoutSchedule[i].completedAt = currentDate;
          investment.totalPayouts += payout.payoutAmount;
          investment.remainingPayouts -= 1;
          
          processedPayouts.push({
            investmentId: investment._id,
            userId: investment.user,
            payoutAmount: payout.payoutAmount,
            transactionId: transaction._id
          });
        }
      }
      
      // Check if investment is completed (all payouts done)
      if (investment.remainingPayouts <= 0) {
        investment.status = 'completed';
      }
      
      await investment.save();
    }
    
    res.status(200).json({
      success: true,
      message: `Processed ${processedPayouts.length} payouts`,
      data: processedPayouts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get investment status
// @route   GET /api/v1/investments/:id/status
// @access  Private
exports.getInvestmentStatus = async (req, res, next) => {
  try {
    const investment = await Investment.findById(req.params.id);

    if (!investment) {
      return next(new ErrorResponse(`Investment not found with id of ${req.params.id}`, 404));
    }

    // Make sure investment belongs to user
    if (investment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`Not authorized to access this investment`, 401));
    }
    
    // Calculate days remaining
    const currentDate = new Date();
    const endDate = new Date(investment.endDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)));
    
    // Calculate expected return
    const expectedReturn = investment.amount * investment.returnRate;
    
    res.status(200).json({
      success: true,
      data: {
        investment,
        daysRemaining,
        expectedReturn,
        maturityDate: investment.endDate
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active contracts for a user
// @route   GET /api/v1/investments/active
// @access  Private
exports.getActiveContracts = async (req, res, next) => {
  try {
    const contracts = await Investment.find({
      user: req.user.id,
      status: 'active'
    }).sort({ createdAt: -1 });

    // Calculate additional fields for each contract
    const contractsWithDetails = contracts.map(contract => {
      const now = new Date();
      const startDate = new Date(contract.startDate);
      const maturityDate = new Date(contract.maturityDate);
      
      // Calculate days left
      const timeDiff = maturityDate.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
      
      // Calculate expected return (150% of original amount)
      const expectedReturn = contract.amount * (contract.totalROI / 100);
      
      // Calculate progress based on payouts array
      const completedPayouts = contract.payouts ? contract.payouts.length : 0;
      const totalPayouts = 1; // Single payout at 60-day maturity
      const progressPercentage = Math.round((completedPayouts / totalPayouts) * 100);
      
      // Calculate days passed and next payout info
      const daysPassed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      const daysUntilMaturity = Math.max(0, 60 - daysPassed);
      
      // Generate payout schedule with status (single payout at maturity)
      const payoutSchedule = [];
      const payoutAmount = contract.amount * 4.0; // 400% total return
      const isCompleted = contract.payouts && contract.payouts.includes(1);
      
      payoutSchedule.push({
        cycle: 1,
        day: 60,
        payoutAmount,
        status: isCompleted ? 'completed' : 'pending'
      });
      
      // Next payout information (maturity payout)
      const nextPayout = !isCompleted ? {
        cycle: 1,
        payoutAmount: payoutAmount,
        daysLeft: daysUntilMaturity,
        status: daysUntilMaturity === 0 ? 'due' : 'pending'
      } : null;
      
      return {
        _id: contract._id,
        amount: contract.amount,
        startDate: contract.startDate,
        maturityDate: contract.maturityDate,
        daysLeft,
        status: contract.status,
        expectedReturn,
        totalROI: contract.totalROI,
        duration: contract.duration,
        createdAt: contract.createdAt,
        // New fields for progress tracking
        progress: {
          completed: completedPayouts,
          total: totalPayouts,
          percentage: progressPercentage
        },
        payoutSchedule,
        nextPayout,
        payouts: contract.payouts || []
      };
    });

    res.status(200).json({
      status: 'success',
      data: contractsWithDetails
    });
  } catch (error) {
    console.error('Active contracts error:', error);
    res.status(500).json({
       status: 'failed',
       message: 'Server error'
     });
   }
 };

// @desc    Get investment summary for dashboard
// @route   GET /api/v1/investments/summary
// @access  Private
exports.getInvestmentSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get total active contracts count and total investment amount
    const activeContracts = await Investment.find({ 
      user: userId, 
      status: 'active' 
    });
    
    const totalActiveContracts = activeContracts.length;
    const totalInvestment = activeContracts.reduce((sum, contract) => sum + contract.amount, 0);

    // Get completed contracts count
    const completedContracts = await Investment.countDocuments({ 
      user: userId, 
      status: 'completed' 
    });

    // Get total payouts received from Payout records
    const Payout = require('../models/Payout');
    const payouts = await Payout.find({ userId });
    
    const totalPayoutsReceived = payouts.reduce((sum, payout) => sum + payout.amount, 0);

    res.status(200).json({
      status: 'success',
      data: {
        totalActiveContracts,
        totalInvestment,
        completedContracts,
        totalPayoutsReceived
      }
    });
  } catch (error) {
    console.error('Investment summary error:', error);
    res.status(500).json({
       status: 'failed',
       message: 'Server error'
     });
   }
 };