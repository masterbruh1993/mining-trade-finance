const Payment = require('../models/Payment');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const ErrorResponse = require('../utils/errorResponse');
const path = require('path');
const fs = require('fs');

// @desc    Submit deposit request
// @route   POST /api/v1/payments/deposit
// @access  Private
exports.submitDeposit = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    // Validate amount
    if (!amount || amount <= 0) {
      return next(new ErrorResponse('Please provide a valid amount', 400));
    }

    // Check if file was uploaded
    if (!req.file) {
      return next(new ErrorResponse('Please upload a receipt file', 400));
    }

    // Create payment record with relative file path
    const filePath = `/uploads/${req.file.filename}`;
    const payment = await Payment.create({
      userId,
      amount: parseFloat(amount),
      receipt: filePath,
      status: "Pending"
    });

    res.status(201).json({
      success: true,
      message: 'Deposit submitted successfully, awaiting admin approval',
      data: payment
    });
  } catch (error) {
    // Clean up uploaded file if payment creation fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Get all deposit requests (Admin only)
// @route   GET /api/v1/payments/deposits
// @access  Private/Admin
exports.getDeposits = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const deposits = await Payment.find(query)
      .populate('userId', 'name email')
      .populate('approvedBy', 'name')
      .populate('rejectedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: deposits.length,
      total,
      data: deposits
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve payment
// @route   POST /api/v1/payments/approve
// @access  Private/Admin
exports.approvePayment = async (req, res, next) => {
  console.log('\n🚀 APPROVE PAYMENT ENDPOINT HIT!');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  try {
    console.log('=== APPROVE PAYMENT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user?.email, 'Role:', req.user?.role);
    
    const { paymentId } = req.body;
    
    // 1. Find the payment by ID
    const payment = await Payment.findById(paymentId);
    console.log('Found payment:', payment ? payment._id : 'NOT FOUND');
    console.log('Payment status:', payment ? payment.status : 'N/A');
    console.log('Payment amount:', payment ? payment.amount : 'N/A');
    
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    
    // Check if status is Pending
    if (payment.status !== "Pending") {
      console.log('Payment not pending, current status:', payment.status);
      return res.status(400).json({ success: false, message: "Payment has already been processed" });
    }

    // Find the user
    const user = await User.findById(payment.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Find admin master wallet (admin user)
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin master wallet not found" });
    }

    // Initialize admin wallet balance if undefined or null
    if (admin.walletBalance === undefined || admin.walletBalance === null || isNaN(admin.walletBalance)) {
      console.log('Admin wallet balance is undefined/null, initializing with default balance...');
      const defaultAdminBalance = 100000000; // ₱100,000,000
      await User.findByIdAndUpdate(admin._id, { walletBalance: defaultAdminBalance }, { runValidators: false });
      admin = await User.findById(admin._id); // Refresh admin object
      console.log(`Admin wallet initialized with balance: ₱${admin.walletBalance}`);
    }

    // Check if admin has sufficient balance
    if (admin.walletBalance < payment.amount) {
      return res.status(400).json({ success: false, message: `Insufficient admin wallet balance. Available: ₱${admin.walletBalance}, Required: ₱${payment.amount}` });
    }

    // 1. Update payment status to "Approved"
    console.log('Updating payment status to Approved...');
    await Payment.findByIdAndUpdate(paymentId, { 
      status: "Approved",
      approvedAt: new Date(),
      approvedBy: req.user.id
    }, { runValidators: false });
    console.log('Payment status updated successfully');
    console.log('About to start wallet update process...');

    // 2. Credit User's Credit Wallet
    console.log('=== WALLET UPDATE SECTION ===');
    console.log('Looking for user wallet:', payment.userId, 'type: credit');
    
    let userWallet;
    try {
      userWallet = await Wallet.findOne({ 
        user: payment.userId, 
        walletType: 'credit' 
      });
      console.log('Found user wallet:', userWallet ? userWallet._id : 'NOT FOUND');
      
      if (!userWallet) {
        console.log('Creating new credit wallet for user:', payment.userId);
        userWallet = await Wallet.create({
          user: payment.userId,
          walletType: 'credit',
          balance: 0
        });
        console.log('New wallet created:', userWallet._id);
      }
      
      console.log('Current wallet balance:', userWallet.balance);
      console.log('Adding amount:', payment.amount);
      userWallet.balance += payment.amount;
      await userWallet.save();
      console.log('New wallet balance after save:', userWallet.balance);
    } catch (walletError) {
      console.error('=== WALLET UPDATE ERROR ===');
      console.error('Error:', walletError.message);
      console.error('Stack:', walletError.stack);
      throw walletError;
    }
    
    console.log('Wallet updated:', {
      walletId: userWallet._id,
      userId: payment.userId,
      walletType: userWallet.walletType,
      newBalance: userWallet.balance,
      amountAdded: payment.amount
    });
    console.log('Wallet update section completed successfully');

    // 3. Also update User model's creditWallet field
    await User.findByIdAndUpdate(
      payment.userId,
      { $inc: { creditWallet: payment.amount } },
      { new: true }
    );

    // 4. Deduct Admin Master Wallet using findOneAndUpdate with $inc
    await User.findOneAndUpdate({ role: 'admin' }, { 
      $inc: { walletBalance: -payment.amount } 
    }, { runValidators: false });

    // 5. Create Transaction History record with required fields
    const transactionData = {
      user: payment.userId,  // userId reference
      type: 'deposit',  // Standardized type
      amount: payment.amount,  // amount
      netAmount: payment.amount,
      walletType: 'credit',
      status: 'completed',  // status="Approved"
      description: `Credit Deposit - ₱${payment.amount.toLocaleString()} approved`,
      createdAt: new Date()  // date=new Date()
    };
    
    const transaction = new Transaction(transactionData);
    await transaction.save();

    console.log('Payment approved successfully:', {
      paymentId: paymentId,
      userId: payment.userId,
      amount: payment.amount,
      transactionId: transaction._id
    });

    // 6. Return success response with updated balances
    const updatedUser = await User.findById(payment.userId);
    const updatedAdmin = await User.findOne({ role: 'admin' });
    
    res.status(200).json({ 
      success: true, 
      message: "Funds credited to user and logged successfully",
      data: {
        userBalance: updatedUser.walletBalance,
        adminBalance: updatedAdmin.walletBalance,
        transactionId: transaction._id,
        amount: payment.amount
      }
    });
  } catch (err) {
    console.error('=== APPROVE PAYMENT ERROR ===');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// @desc    Approve deposit request
// @route   PUT /api/v1/payments/deposits/:id/approve
// @access  Private/Admin
exports.approveDeposit = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return next(new ErrorResponse('Payment not found', 404));
    }

    if (payment.status !== 'Pending') {
      return next(new ErrorResponse('Payment has already been processed', 400));
    }

    // Find user's credit wallet
    let wallet = await Wallet.findOne({ 
      user: payment.userId, 
      walletType: 'credit' 
    });

    // If credit wallet doesn't exist, create it
    if (!wallet) {
      wallet = await Wallet.create({
        user: payment.userId,
        walletType: 'credit',
        balance: 0
      });
    }

    // Update payment status
    payment.status = 'Approved';
    payment.approvedAt = new Date();
    payment.approvedBy = req.user.id;
    await payment.save();

    // Credit amount to user's wallet
    wallet.balance += payment.amount;
    await wallet.save();

    // Also update User model's creditWallet field
    await User.findByIdAndUpdate(
      payment.userId,
      { $inc: { creditWallet: payment.amount } },
      { new: true }
    );

    // Create transaction record
    const transactionData = {
      user: payment.userId,
      type: 'deposit',
      amount: payment.amount,
      netAmount: payment.amount,
      walletType: 'credit',
      status: 'completed',
      description: `Credit Deposit - ₱${payment.amount.toLocaleString()} approved`,
      createdAt: new Date()
    };
    
    const transaction = new Transaction(transactionData);
    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Deposit approved successfully',
      data: {
        payment,
        transactionId: transaction._id
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject deposit request
// @route   PUT /api/v1/payments/deposits/:id/reject
// @access  Private/Admin
exports.rejectDeposit = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return next(new ErrorResponse('Payment not found', 404));
    }

    if (payment.status !== 'Pending') {
      return next(new ErrorResponse('Payment has already been processed', 400));
    }

    // Update payment status
    payment.status = 'Rejected';
    payment.rejectedAt = new Date();
    payment.rejectedBy = req.user.id;
    payment.rejectionReason = reason || 'No reason provided';
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Deposit rejected successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's deposit history
// @route   GET /api/v1/payments/my-deposits
// @access  Private
exports.getMyDeposits = async (req, res, next) => {
  try {
    const deposits = await Payment.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deposits.length,
      data: deposits
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get deposit receipt file
// @route   GET /api/v1/payments/receipt/:filename
// @access  Private
exports.getReceipt = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return next(new ErrorResponse('Receipt file not found', 404));
    }

    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};