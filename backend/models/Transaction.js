const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'activation', 'earning', 'withdrawal'],
    required: true
  },
  sourceUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  level: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  fee: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  walletType: {
    type: String,
    enum: ['passive', 'credit'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String
  },
  reference: {
    type: String
  },
  payoutMethod: {
    type: String,
    enum: ['GCash', 'Maya', 'GoTyme'],
    required: function() {
      return this.type === 'withdrawal';
    }
  },
  accountDetails: {
    type: String,
    required: function() {
      return this.type === 'withdrawal';
    }
  },
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate reference number before saving
TransactionSchema.pre('save', function(next) {
  if (!this.reference) {
    // Generate a unique reference number
    const prefix = this.type.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().substring(6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.reference = `${prefix}${timestamp}${random}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Transaction', TransactionSchema);