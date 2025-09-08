const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Initialize wallets for user
// @route   POST /api/v1/wallets/initialize
// @access  Private
exports.initializeWallets = async (req, res, next) => {
  try {
    // Check if user already has wallets
    const existingWallets = await Wallet.find({ user: req.user.id });
    
    if (existingWallets.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Wallets already exist',
        data: existingWallets
      });
    }

    // Create wallets for user (bonus wallet removed)
    const walletTypes = ['passive', 'credit'];
    const wallets = [];
    
    for (const type of walletTypes) {
      const wallet = await Wallet.create({
        user: req.user.id,
        walletType: type,
        balance: 0
      });
      wallets.push(wallet);
    }

    res.status(201).json({
      success: true,
      message: 'Wallets initialized successfully',
      data: wallets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all wallets for a user
// @route   GET /api/v1/wallets
// @access  Private
exports.getWallets = async (req, res, next) => {
  try {
    console.log('Getting wallets for user:', req.user.id);
    let wallets = await Wallet.find({ user: req.user.id });
    console.log('Found existing wallets:', wallets.length);
    wallets.forEach(w => console.log('  - Existing:', w.walletType));

    // If no wallets exist, create default wallets
    if (wallets.length === 0) {
      console.log('No wallets found, creating default wallets');
      const walletTypes = ['passive', 'credit']; // Bonus wallet removed
      console.log('Wallet types to create:', walletTypes);
      const createdWallets = [];
      
      for (const type of walletTypes) {
        const wallet = await Wallet.create({
          user: req.user.id,
          walletType: type,
          balance: 0
        });
        console.log('Created wallet in getWallets:', wallet.walletType);
        createdWallets.push(wallet);
      }
      
      wallets = createdWallets;
    }
    
    // Final verification
    const finalWallets = await Wallet.find({ user: req.user.id });
    console.log('Final wallets count:', finalWallets.length);
    finalWallets.forEach(w => console.log('  - Final:', w.walletType));

    res.status(200).json({
      success: true,
      count: wallets.length,
      data: wallets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get credit wallet balance
// @route   GET /api/v1/wallet/credit
// @access  Private
exports.getCreditWallet = async (req, res, next) => {
  try {
    console.log('Getting credit wallet for user:', req.user.id);
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: 'User not found'
      });
    }
    
    console.log('Credit wallet balance from User model:', user.creditWallet);
    
    res.status(200).json({
      status: 'success',
      balance: user.creditWallet || 0
    });
  } catch (error) {
    console.error('Error getting credit wallet:', error);
    res.status(500).json({
      status: 'failed',
      message: 'Server error'
    });
  }
};

// @desc    Get single wallet
// @route   GET /api/v1/wallets/:id
// @access  Private
exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findById(req.params.id);

    if (!wallet) {
      return next(new ErrorResponse(`Wallet not found with id of ${req.params.id}`, 404));
    }

    // Make sure wallet belongs to user
    if (wallet.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`Not authorized to access this wallet`, 401));
    }

    res.status(200).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get wallet by type
// @route   GET /api/v1/wallets/type/:walletType
// @access  Private
exports.getWalletByType = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ 
      user: req.user.id, 
      walletType: req.params.walletType 
    });

    if (!wallet) {
      return next(new ErrorResponse(`Wallet not found with type of ${req.params.walletType}`, 404));
    }

    res.status(200).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get wallet transactions
// @route   GET /api/v1/wallets/:id/transactions
// @access  Private
exports.getWalletTransactions = async (req, res, next) => {
  try {
    const wallet = await Wallet.findById(req.params.id);

    if (!wallet) {
      return next(new ErrorResponse(`Wallet not found with id of ${req.params.id}`, 404));
    }

    // Make sure wallet belongs to user
    if (wallet.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`Not authorized to access this wallet`, 401));
    }

    const transactions = await Transaction.find({ 
      user: wallet.user,
      walletType: wallet.walletType
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Transfer between wallets
// @route   POST /api/v1/wallets/transfer
// @access  Private
exports.transferBetweenWallets = async (req, res, next) => {
  try {
    const { fromWalletType, toWalletType, amount } = req.body;

    // Validate input
    if (!fromWalletType || !toWalletType || !amount) {
      return next(new ErrorResponse('Please provide fromWalletType, toWalletType and amount', 400));
    }

    if (fromWalletType === toWalletType) {
      return next(new ErrorResponse('Cannot transfer to the same wallet', 400));
    }

    if (amount <= 0) {
      return next(new ErrorResponse('Amount must be greater than 0', 400));
    }

    // Get source wallet
    const sourceWallet = await Wallet.findOne({ 
      user: req.user.id, 
      walletType: fromWalletType 
    });

    if (!sourceWallet) {
      return next(new ErrorResponse(`Source wallet not found`, 404));
    }

    // Check if source wallet has enough balance
    if (sourceWallet.balance < amount) {
      return next(new ErrorResponse(`Insufficient balance in ${fromWalletType}`, 400));
    }

    // Get destination wallet
    const destWallet = await Wallet.findOne({ 
      user: req.user.id, 
      walletType: toWalletType 
    });

    if (!destWallet) {
      return next(new ErrorResponse(`Destination wallet not found`, 404));
    }

    // Create transaction for source wallet (debit)
    const sourceTransaction = await Transaction.create({
      user: req.user.id,
      type: 'withdrawal',
      amount: amount,
      fee: 0,
      netAmount: amount,
      walletType: fromWalletType,
      status: 'completed',
      description: `Transfer to ${toWalletType}`
    });

    // Create transaction for destination wallet (credit)
    const destTransaction = await Transaction.create({
      user: req.user.id,
      type: 'deposit',
      amount: amount,
      fee: 0,
      netAmount: amount,
      walletType: toWalletType,
      status: 'completed',
      description: `Transfer from ${fromWalletType}`,
      relatedTransaction: sourceTransaction._id
    })

    // Update source transaction with related transaction
    sourceTransaction.relatedTransaction = destTransaction._id;
    await sourceTransaction.save();

    // Update wallet balances
    sourceWallet.balance -= amount;
    sourceWallet.totalOut += amount;
    await sourceWallet.save();

    destWallet.balance += amount;
    destWallet.totalIn += amount;
    await destWallet.save();

    res.status(200).json({
      success: true,
      data: {
        sourceTransaction,
        destTransaction,
        sourceWallet,
        destWallet
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get passive wallet balance and transaction history
// @route   GET /api/v1/wallet/passive
// @access  Private
exports.getPassiveWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get passive wallet transactions
    const transactions = await Transaction.find({
      user: req.user.id,
      walletType: 'passive',
      status: 'completed'
    }).sort({ createdAt: -1 }).limit(50);

    res.status(200).json({
      success: true,
      data: {
        balance: user.passiveWallet || 0,
        transactions: transactions.map(tx => ({
          id: tx._id,
          amount: tx.amount,
          description: tx.description,
          reference: tx.reference,
          createdAt: tx.createdAt,
          type: tx.type
        }))
      }
    });
  } catch (error) {
    console.error('Error getting passive wallet:', error);
    return next(new ErrorResponse('Error fetching passive wallet data', 500));
  }
};

// @desc    Get all wallet balances from User model
// @route   GET /api/v1/wallet/balances
// @access  Private
exports.getAllWalletBalances = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all wallets for the user
    const wallets = await Wallet.find({ user: req.user.id });
    
    // Initialize balances
    let creditWallet = 0;
    let passiveWallet = 0;
    // Bonus wallet removed
    
    // Map wallet balances
    wallets.forEach(wallet => {
      switch (wallet.walletType) {
        case 'credit':
          creditWallet = wallet.balance;
          break;
        case 'passive':
          passiveWallet = wallet.balance;
          break;
        // Bonus wallet case removed
      }
    });
    
    // Calculate total wallet balance (passive only, excluding credit)
    const walletBalance = passiveWallet;

    res.status(200).json({
      success: true,
      data: {
        creditWallet,
        passiveWallet,
        // bonusWallet removed
        walletBalance
      }
    });
  } catch (error) {
    console.error('Error getting wallet balances:', error);
    return next(new ErrorResponse('Error fetching wallet balances', 500));
  }
};