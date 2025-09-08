const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [1, 'Investment amount must be greater than 0']
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  maturityDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'voided'],
    default: 'active',
    required: true
  },
  // Plan configuration
  payoutInterval: {
    type: Number,
    default: 60 // days
  },
  payoutPercent: {
    type: Number,
    default: 100 // 100% capital return
  },
  totalCycles: {
    type: Number,
    default: 1 // Single payout at maturity
  },
  totalROI: {
    type: Number,
    default: 400 // 300% profit + 100% capital return = 400% total
  },
  duration: {
    type: Number,
    default: 60 // 60 days
  },
  payoutSchedule: [{
    payoutDate: {
      type: Date,
      required: true
    },
    payoutAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    },
    completedAt: {
      type: Date
    }
  }],
  totalPayouts: {
    type: Number,
    default: 0
  },
  remainingPayouts: {
    type: Number,
    default: 1 // Single payout at maturity
  },
  // Track completed payout cycles
  payouts: {
    type: [Number],
    default: [] // Array of completed cycle numbers [1] for single payout
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

// Calculate maturity date and generate payout schedule before saving
InvestmentSchema.pre('save', function(next) {
  if (this.isNew) {
    // Calculate maturity date (60 days from start)
    this.maturityDate = new Date(this.startDate.getTime() + (60 * 24 * 60 * 60 * 1000));
    
    // Generate payout schedule (single payout at maturity = 400% total return)
    const payoutAmount = this.amount * 4.0; // 400% total return (300% profit + 100% capital)
    this.payoutSchedule = [];
    
    // Single payout at maturity (60 days)
    const payoutDate = new Date(this.startDate.getTime() + (60 * 24 * 60 * 60 * 1000));
    this.payoutSchedule.push({
      payoutDate: payoutDate,
      payoutAmount: payoutAmount,
      status: 'pending'
    });
  }
  
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Investment', InvestmentSchema);