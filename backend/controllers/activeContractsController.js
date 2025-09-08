const Investment = require('../models/Investment');
const Payout = require('../models/Payout');
const EarningsService = require('../services/earningsService');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all active contracts for a user
// @route   GET /api/v1/contracts/active
// @access  Private
const getActiveContracts = async (req, res, next) => {
  try {
    const investments = await Investment.find({
      user: req.user.id,
      status: { $in: ['active', 'completed'] }
    }).sort({ createdAt: -1 });

    const contractsWithDetails = investments.map(investment => {
      const nextPayout = EarningsService.getNextPayoutInfo(investment);
      const progress = EarningsService.getInvestmentProgress(investment);
      const daysLeft = EarningsService.getDaysLeft(investment);

      return {
        id: investment._id,
        amount: investment.amount,
        startDate: investment.startDate,
        maturityDate: investment.maturityDate,
        status: investment.status.toUpperCase(),
        daysLeft: daysLeft,
        progress: progress,
        nextPayout: nextPayout,
        totalPayouts: investment.totalPayouts,
        remainingPayouts: investment.remainingPayouts,
        payoutSchedule: investment.payoutSchedule.map(payout => ({
          payoutDate: payout.payoutDate,
          payoutAmount: payout.payoutAmount,
          status: payout.status,
          completedAt: payout.completedAt
        })),
        createdAt: investment.createdAt
      };
    });

    res.status(200).json({
      success: true,
      count: contractsWithDetails.length,
      data: contractsWithDetails
    });
  } catch (error) {
    console.error('Error fetching active contracts:', error);
    return next(new ErrorResponse('Error fetching active contracts', 500));
  }
};

// @desc    Get contract details by ID
// @route   GET /api/v1/contracts/:id
// @access  Private
const getContractById = async (req, res, next) => {
  try {
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!investment) {
      return next(new ErrorResponse('Contract not found', 404));
    }

    const nextPayout = EarningsService.getNextPayoutInfo(investment);
    const progress = EarningsService.getInvestmentProgress(investment);
    const daysLeft = EarningsService.getDaysLeft(investment);

    const contractDetails = {
      id: investment._id,
      amount: investment.amount,
      startDate: investment.startDate,
      maturityDate: investment.maturityDate,
      status: investment.status.toUpperCase(),
      daysLeft: daysLeft,
      progress: progress,
      nextPayout: nextPayout,
      totalPayouts: investment.totalPayouts,
      remainingPayouts: investment.remainingPayouts,
      payoutSchedule: investment.payoutSchedule.map(payout => ({
        payoutDate: payout.payoutDate,
        payoutAmount: payout.payoutAmount,
        status: payout.status,
        completedAt: payout.completedAt
      })),
      createdAt: investment.createdAt
    };

    res.status(200).json({
      success: true,
      data: contractDetails
    });
  } catch (error) {
    console.error('Error fetching contract details:', error);
    return next(new ErrorResponse('Error fetching contract details', 500));
  }
};

// @desc    Trigger manual payout processing (admin only)
// @route   POST /api/v1/contracts/process-payouts
// @access  Private/Admin
const triggerPayoutProcessing = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(new ErrorResponse('Access denied. Admin only.', 403));
    }

    const SchedulerService = require('../services/schedulerService');
    const result = await SchedulerService.triggerPayouts();

    res.status(200).json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Error triggering payout processing:', error);
    return next(new ErrorResponse('Error triggering payout processing', 500));
  }
};

// @desc    Get contracts summary for a user
// @route   GET /api/v1/contracts/summary
// @access  Private
const getContractsSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all investments for the user
    const allInvestments = await Investment.find({ user: userId });
    
    // Calculate active contracts
    const activeContracts = allInvestments.filter(inv => inv.status === 'active');
    const totalActiveContracts = activeContracts.length;
    
    // Calculate total investment (sum of all active contract amounts)
    const totalInvestment = activeContracts.reduce((sum, inv) => sum + inv.amount, 0);
    
    // Calculate completed contracts
    const completedContracts = allInvestments.filter(inv => inv.status === 'completed').length;
    
    // Get total payouts received from Payout model
    const payouts = await Payout.find({ user: userId, status: 'completed' });
    const totalPayoutsReceived = payouts.reduce((sum, payout) => sum + payout.amount, 0);

    const summary = {
      totalActiveContracts,
      totalInvestment,
      completedContracts,
      totalPayoutsReceived
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching contract summary:', error);
    return next(new ErrorResponse('Error fetching contract details', 500));
  }
};

module.exports = {
  getActiveContracts,
  getContractById,
  triggerPayoutProcessing,
  getContractsSummary
};