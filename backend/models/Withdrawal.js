const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [300, 'Minimum withdrawal amount is ₱300']
  },
  walletType: {
    type: String,
    enum: ['passive', 'bonus', 'credit'],
    default: 'passive',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED'],
    default: 'PENDING'
  },
  processedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  },
  remarks: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['gcash', 'paymaya', 'gotyme'],
    default: 'gcash'
  },
  paymentDetails: {
    accountNumber: String,
    accountName: String,
    bankName: String
  },
  transactionHash: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
WithdrawalSchema.index({ user: 1, status: 1 });
WithdrawalSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);