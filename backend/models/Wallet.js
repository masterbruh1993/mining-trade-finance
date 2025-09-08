const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  walletType: {
    type: String,
    enum: ['bonus', 'passive', 'credit'],
    default: 'passive',
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  totalIn: {
    type: Number,
    default: 0
  },
  totalOut: {
    type: Number,
    default: 0
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

// Update the updatedAt field before saving
WalletSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Wallet', WalletSchema);