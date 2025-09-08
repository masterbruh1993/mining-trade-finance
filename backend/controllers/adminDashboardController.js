const User = require('../models/User');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Withdrawal = require('../models/Withdrawal');
const AdminWallet = require('../models/AdminWallet');
const Payout = require('../models/Payout');

// Get comprehensive admin dashboard data
exports.getAdminDashboard = async (req, res) => {
  try {
    console.log('Fetching admin dashboard data...');

    // Get admin master wallet
    const adminWallet = await AdminWallet.getMasterWallet();

    // Overview Section - Real-time counts
    const totalUsers = await User.countDocuments();
    const activeInvestments = await Investment.countDocuments({ status: 'active' });
    
    // Total invested - sum of all investment activations
    const totalInvestedResult = await Investment.aggregate([
      { $match: { status: { $in: ['active', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalInvested = totalInvestedResult.length > 0 ? totalInvestedResult[0].total : 0;

    // Pending payouts - count of due payouts not yet processed
    const pendingPayouts = await Payout.countDocuments({ status: 'pending' });
    
    // Pending approvals - count of withdrawal requests with status PENDING
    const pendingApprovals = await Withdrawal.countDocuments({ status: 'PENDING' });
    
    // Total earnings - sum of all user earnings (Passive + Bonus)
    const totalEarningsResult = await Transaction.aggregate([
      { 
        $match: { 
          type: { $in: ['earning', 'referral'] },
          status: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalEarnings = totalEarningsResult.length > 0 ? totalEarningsResult[0].total : 0;

    // Deposits vs Withdrawals Section
    // Deposits - sum of all approved deposits (status: 'Approved')
    const depositsResult = await Payment.aggregate([
      { $match: { status: 'Approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalDeposits = depositsResult.length > 0 ? depositsResult[0].total : 0;

    // Withdrawals - sum of all completed withdrawals (status: 'COMPLETED')
    const withdrawalsResult = await Withdrawal.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalWithdrawals = withdrawalsResult.length > 0 ? withdrawalsResult[0].total : 0;

    // Net flow = Deposits - Withdrawals
    const netFlow = totalDeposits - totalWithdrawals;

    // Investment Performance Section
    // Total investments - sum of all contracts (active + completed)
    const totalInvestmentsResult = await Investment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalInvestments = totalInvestmentsResult.length > 0 ? totalInvestmentsResult[0].total : 0;

    // Total returns - total amount already paid out
    const totalReturnsResult = await Transaction.aggregate([
      { 
        $match: { 
          type: { $in: ['earning', 'referral'] },
          status: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalReturns = totalReturnsResult.length > 0 ? totalReturnsResult[0].total : 0;

    // ROI % = (Total Returns ÷ Total Investments) × 100
    const roiPercentage = totalInvestments > 0 ? (totalReturns / totalInvestments) * 100 : 0;

    // Active investments count
    const activeInvestmentsCount = await Investment.countDocuments({ status: 'active' });

    // Recent Activity Section
    // Pending transactions - count of all unprocessed deposits/withdrawals
    const pendingDeposits = await Payment.countDocuments({ status: 'pending' });
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'PENDING' });
    const pendingTransactions = pendingDeposits + pendingWithdrawals;

    // Payout requests - count of pending payout approvals
    const payoutRequests = await Payout.countDocuments({ status: 'pending' });

    // Daily Sales Logs - investments activated per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailySales = await Investment.aggregate([
      {
        $match: {
          status: { $in: ['active', 'completed'] },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalSales: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 }
      }
    ]);

    // Format daily sales data
    const formattedDailySales = dailySales.map(day => ({
      date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
      totalSales: day.totalSales,
      count: day.count
    }));

    // Active vs Inactive Members
    const activeUsers = await User.countDocuments({ status: 'active' });
    const inactiveUsers = totalUsers - activeUsers;
    const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    console.log('Admin dashboard data compiled successfully');

    res.json({
      success: true,
      data: {
        // Admin Master Wallet
        adminWallet: {
          balance: adminWallet.balance,
          totalIn: adminWallet.totalIn,
          totalOut: adminWallet.totalOut,
          recentTransactions: adminWallet.transactions.slice(-10).reverse() // Last 10 transactions
        },
        
        // Overview Section
        overview: {
          totalUsers,
          activeInvestments,
          totalInvested,
          pendingPayouts,
          pendingApprovals,
          totalEarnings
        },
        
        // Deposits vs Withdrawals
        depositsVsWithdrawals: {
          deposits: totalDeposits,
          withdrawals: totalWithdrawals,
          netFlow
        },
        
        // Investment Performance
        investmentPerformance: {
          totalInvestments,
          totalReturns,
          roiPercentage: Math.round(roiPercentage * 100) / 100, // Round to 2 decimal places
          activeInvestments: activeInvestmentsCount
        },
        
        // Recent Activity
        recentActivity: {
          pendingTransactions,
          payoutRequests,
          pendingDeposits,
          pendingWithdrawals
        },
        
        // Active vs Inactive Members
        memberEngagement: {
          activeUsers,
          inactiveUsers,
          totalMembers: totalUsers,
          engagementRate: Math.round(engagementRate * 100) / 100
        },
        
        // Daily Sales Logs
        dailySales: formattedDailySales
      }
    });

  } catch (error) {
    console.error('Admin dashboard fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard data',
      error: error.message
    });
  }
};

// Get admin wallet details
exports.getAdminWallet = async (req, res) => {
  try {
    const adminWallet = await AdminWallet.getMasterWallet();
    
    res.json({
      success: true,
      data: {
        balance: adminWallet.balance,
        totalIn: adminWallet.totalIn,
        totalOut: adminWallet.totalOut,
        transactions: adminWallet.transactions.reverse() // Most recent first
      }
    });
  } catch (error) {
    console.error('Admin wallet fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin wallet data',
      error: error.message
    });
  }
};

// Add funds to admin wallet
exports.addFundsToAdminWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    const adminWallet = await AdminWallet.getMasterWallet();
    await adminWallet.addFunds(amount, description || 'Manual addition');
    
    res.json({
      success: true,
      message: 'Funds added successfully',
      data: {
        newBalance: adminWallet.balance,
        amountAdded: amount
      }
    });
  } catch (error) {
    console.error('Add funds error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Deduct funds from admin wallet
exports.deductFundsFromAdminWallet = async (req, res) => {
  try {
    const { amount, userId, userName, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    const adminWallet = await AdminWallet.getMasterWallet();
    await adminWallet.deductFunds(amount, userId, userName, description || 'Payment approval');
    
    res.json({
      success: true,
      message: 'Funds deducted successfully',
      data: {
        newBalance: adminWallet.balance,
        amountDeducted: amount
      }
    });
  } catch (error) {
    console.error('Deduct funds error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get leader sales monitoring data
exports.getLeaderSalesData = async (req, res) => {
  try {
    const { usernames, days = 30 } = req.query;
    
    if (!usernames) {
      return res.status(400).json({
        success: false,
        message: 'Please provide usernames to monitor'
      });
    }
    
    const usernameArray = usernames.split(',').map(u => u.trim());
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    
    const leaderData = [];
    
    for (const username of usernameArray) {
      const leader = await User.findOne({ username });
      if (!leader) {
        leaderData.push({
          username,
          error: 'User not found',
          totalSales: 0,
          referralCount: 0,
          dailyBreakdown: []
        });
        continue;
      }
      
      // Get all users referred by this leader
      const referredUsers = await User.find({ referredBy: leader._id });
      const referredUserIds = referredUsers.map(u => u._id);
      
      // Get investments made by referred users
      const referralInvestments = await Investment.aggregate([
        {
          $match: {
            userId: { $in: referredUserIds },
            status: { $in: ['active', 'completed'] },
            createdAt: { $gte: daysAgo }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);
      
      const totalSales = referralInvestments.length > 0 ? referralInvestments[0].totalSales : 0;
      const investmentCount = referralInvestments.length > 0 ? referralInvestments[0].count : 0;
      
      // Daily breakdown
      const dailyBreakdown = await Investment.aggregate([
        {
          $match: {
            userId: { $in: referredUserIds },
            status: { $in: ['active', 'completed'] },
            createdAt: { $gte: daysAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            dailySales: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 }
        }
      ]);
      
      const formattedDailyBreakdown = dailyBreakdown.map(day => ({
        date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
        sales: day.dailySales,
        count: day.count
      }));
      
      leaderData.push({
        username,
        userId: leader._id,
        fullName: leader.fullName,
        totalSales,
        investmentCount,
        referralCount: referredUsers.length,
        dailyBreakdown: formattedDailyBreakdown
      });
    }
    
    res.json({
      success: true,
      data: {
        leaders: leaderData,
        period: `${days} days`,
        generatedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('Leader sales data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leader sales data',
      error: error.message
    });
  }
};