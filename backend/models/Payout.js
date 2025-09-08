const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  cycle: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  dateReleased: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
payoutSchema.index({ contractId: 1, cycle: 1 });
payoutSchema.index({ userId: 1, dateReleased: -1 });

module.exports = mongoose.model('Payout', payoutSchema);