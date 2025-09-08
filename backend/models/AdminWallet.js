const mongoose = require('mongoose');

const AdminWalletSchema = new mongoose.Schema({
  walletType: {
    type: String,
    default: 'master',
    required: true
  },
  balance: {
    type: Number,
    default: 100000000, // ₱100,000,000 initial balance
    required: true
  },
  totalIn: {
    type: Number,
    default: 0
  },
  totalOut: {
    type: Number,
    default: 0
  },
  transactions: [{
    type: {
      type: String,
      enum: ['addition', 'deduction'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    balanceAfter: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
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
AdminWalletSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get or create the master wallet
AdminWalletSchema.statics.getMasterWallet = async function() {
  let wallet = await this.findOne({ walletType: 'master' });
  if (!wallet) {
    wallet = await this.create({ walletType: 'master' });
  }
  return wallet;
};

// Method to add funds
AdminWalletSchema.methods.addFunds = function(amount, description = 'Manual addition') {
  if (amount <= 0) {
    throw new Error('Invalid amount');
  }
  
  this.balance += amount;
  this.totalIn += amount;
  
  this.transactions.push({
    type: 'addition',
    amount: amount,
    description: description,
    balanceAfter: this.balance,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to deduct funds
AdminWalletSchema.methods.deductFunds = function(amount, userId, userName, description = 'Payment approval') {
  if (amount <= 0) {
    throw new Error('Invalid amount');
  }
  
  if (this.balance < amount) {
    throw new Error('Insufficient funds in Admin Master Wallet');
  }
  
  this.balance -= amount;
  this.totalOut += amount;
  
  this.transactions.push({
    type: 'deduction',
    amount: amount,
    description: description,
    userId: userId,
    userName: userName,
    balanceAfter: this.balance,
    timestamp: new Date()
  });
  
  return this.save();
};

module.exports = mongoose.model('AdminWallet', AdminWalletSchema);