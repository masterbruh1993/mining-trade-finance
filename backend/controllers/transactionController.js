const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all transactions for a user
// @route   GET /api/v1/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    // Add query parameters for filtering
    let query = { user: req.user.id };
    
    // Filter by transaction type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    // Filter by wallet type if provided
    if (req.query.wallet) {
      query.walletType = req.query.wallet;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Transaction.countDocuments(query);
    
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: transactions.length,
      pagination,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction
// @route   GET /api/v1/transactions/:id
// @access  Private
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return next(new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404));
    }

    // Make sure transaction belongs to user
    if (transaction.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`Not authorized to access this transaction`, 401));
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transactions for a specific user (Admin only)
// @route   GET /api/v1/transactions/user/:userId
// @access  Private/Admin
exports.getUserTransactions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Build query
    let query = { user: userId };
    
    // Filter by transaction type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const total = await Transaction.countDocuments(query);
    
    const transactions = await Transaction.find(query)
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Pagination result
    const pagination = {};
    
    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      pagination,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create deposit request
// @route   POST /api/v1/transactions/deposit
// @access  Private
exports.createDeposit = async (req, res, next) => {
  try {
    const { amount } = req.body;

    // Validate input
    if (!amount) {
      return next(new ErrorResponse('Please provide amount', 400));
    }

    if (amount <= 0) {
      return next(new ErrorResponse('Amount must be greater than 0', 400));
    }

    // Create deposit transaction
    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'deposit',
      amount,
      fee: 0,
      netAmount: amount,
      walletType: 'passive',
      status: 'pending',
      description: 'Deposit request - awaiting verification'
    });

    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create withdrawal request
// @route   POST /api/v1/transactions/withdraw
// @access  Private
exports.createWithdrawal = async (req, res, next) => {
  try {
    const { amount, walletType, payoutMethod, accountDetails } = req.body;

    // Validate input
    if (!amount || !walletType || !payoutMethod || !accountDetails) {
      return next(new ErrorResponse('Please provide amount, walletType, payoutMethod, and accountDetails', 400));
    }

    if (amount <= 0) {
      return next(new ErrorResponse('Amount must be greater than 0', 400));
    }

    // Validate payout method
    if (!['GCash', 'Maya', 'GoTyme'].includes(payoutMethod)) {
      return next(new ErrorResponse('Invalid payout method. Choose from GCash, Maya, or GoTyme', 400));
    }

    // Check withdrawal time window (11:00 AM - 3:00 PM server time)
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    
    if (currentHour < 11 || currentHour >= 15) {
      return next(new ErrorResponse('Withdrawal window closed. Withdrawals are only allowed between 11:00 AM - 3:00 PM', 400));
    }

    // Validate wallet type - only allow withdrawals from passive and bonus wallets
    if (walletType === 'credit') {
      return next(new ErrorResponse('Withdrawals from Credit Wallet are not allowed. Please activate your funds first.', 400));
    }

    if (!['passive', 'bonus'].includes(walletType)) {
      return next(new ErrorResponse('Invalid wallet type. Only Passive and Bonus wallets support withdrawals.', 400));
    }

    // Check minimum withdrawal amounts
    if (walletType === 'passive' && amount < 300) {
      return next(new ErrorResponse('Minimum withdrawal amount for Passive Wallet is ₱300', 400));
    }

    if (walletType === 'bonus' && amount < 500) {
      return next(new ErrorResponse('Minimum withdrawal amount for Bonus Wallet is ₱500', 400));
    }

    // Check bonus wallet withdrawal schedule (Tue/Thu/Sat only)
    if (walletType === 'bonus') {
      const dayOfWeek = currentTime.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const allowedDays = [2, 4, 6]; // Tuesday, Thursday, Saturday
      
      if (!allowedDays.includes(dayOfWeek)) {
        return next(new ErrorResponse('Bonus Wallet withdrawals are only allowed on Tuesday, Thursday, and Saturday', 400));
      }
    }

    // Get wallet
    const wallet = await Wallet.findOne({ 
      user: req.user.id, 
      walletType 
    });

    if (!wallet) {
      return next(new ErrorResponse(`Wallet not found`, 404));
    }

    // Check if wallet has enough balance
    if (wallet.balance < amount) {
      return next(new ErrorResponse(`Insufficient balance in ${walletType} wallet`, 400));
    }

    // No withdrawal fee for this system
    const fee = 0;
    const netAmount = amount;

    // Create withdrawal transaction
    const transaction = await Transaction.create({
      user: req.user.id,
      type: 'withdrawal',
      amount,
      fee,
      netAmount,
      walletType,
      status: 'pending',
      payoutMethod,
      accountDetails,
      description: `Withdrawal request - ${payoutMethod} (${accountDetails})`
    });

    // Update wallet balance (deduct amount)
    wallet.balance -= amount;
    wallet.totalOut += amount;
    await wallet.save();
    
    // Update User model wallet field for consistency
    if (walletType === 'bonus') {
      await User.findByIdAndUpdate(
        req.user.id,
        { $inc: { bonusWallet: -amount } }
      );
    } else if (walletType === 'passive') {
      await User.findByIdAndUpdate(
        req.user.id,
        { $inc: { passiveWallet: -amount } }
      );
    }

    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Process withdrawal
// @route   PUT /api/v1/transactions/:id/process
// @access  Private/Admin
exports.processTransaction = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;

    if (!status || !['completed', 'failed', 'cancelled'].includes(status)) {
      return next(new ErrorResponse('Please provide a valid status (completed, failed, cancelled)', 400));
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return next(new ErrorResponse(`Transaction not found with id of ${req.params.id}`, 404));
    }

    // Only process pending transactions
    if (transaction.status !== 'pending') {
      return next(new ErrorResponse(`Transaction has already been processed`, 400));
    }

    // Update transaction status
    transaction.status = status;
    if (remarks) {
      transaction.description = `${transaction.description} | Admin remarks: ${remarks}`;
    }
    await transaction.save();

    // If transaction is cancelled or failed, refund the amount to wallet
    if (status === 'cancelled' || status === 'failed') {
      const wallet = await Wallet.findOne({ 
        user: transaction.user, 
        walletType: transaction.walletType 
      });

      if (wallet) {
        wallet.balance += transaction.amount;
        wallet.totalOut -= transaction.amount;
        await wallet.save();
        
        // Update User model wallet field for consistency
        if (transaction.walletType === 'bonus') {
          await User.findByIdAndUpdate(
            transaction.user,
            { $inc: { bonusWallet: transaction.amount } }
          );
        } else if (transaction.walletType === 'passive') {
          await User.findByIdAndUpdate(
            transaction.user,
            { $inc: { passiveWallet: transaction.amount } }
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction summary/statistics for a user
// @route   GET /api/v1/transactions/summary
// @access  Private
exports.getTransactionSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get all transactions for the user (for total count)
    const allTransactions = await Transaction.find({ 
      user: userId
    });
    
    // Get only completed transactions for calculations (handle both 'completed' and 'complete' status)
    const completedTransactions = await Transaction.find({ 
      user: userId, 
      status: { $in: ['completed', 'complete'] }
    });
    
    // Calculate summary statistics
    const summary = {
      totalTransactions: allTransactions.length,
      totalDeposits: completedTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0),
      totalWithdrawals: completedTransactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0),
      totalActivations: completedTransactions
        .filter(t => t.type === 'activation')
        .length,
      // Total Earnings = Passive Earnings + Referral Commissions (same as Dashboard logic)
      totalEarnings: completedTransactions
        .filter(t => t.type === 'earning' || t.type === 'referral')
        .reduce((sum, t) => sum + t.amount, 0),
      totalReferrals: completedTransactions
        .filter(t => t.type === 'referral')
        .reduce((sum, t) => sum + t.amount, 0)
    };
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};