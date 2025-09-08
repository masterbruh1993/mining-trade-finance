const cron = require('node-cron');
const Investment = require('../models/Investment');
const Payout = require('../models/Payout');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

class PayoutService {
  static startPayoutScheduler() {
    // Run every midnight (0 0 * * *)
    cron.schedule('0 0 * * *', async () => {
      console.log('Running automatic payout job at:', new Date());
      await PayoutService.processPayouts();
    });
    
    console.log('Payout scheduler started - will run every midnight');
  }

  static async processPayouts() {
    try {
      // Use EarningsService for new 60-day single payout system
      const EarningsService = require('./earningsService');
      await EarningsService.processPendingPayouts();
    } catch (error) {
      console.error('Error processing payouts:', error);
    }
  }

  // Legacy method removed - now using EarningsService for 60-day single payout system
  static async processContractPayout(contract) {
    // This method is deprecated - use EarningsService.processInvestmentPayouts instead
    console.log('processContractPayout is deprecated - use EarningsService instead');
  }

  // Manual trigger for testing
  static async triggerPayouts() {
    console.log('Manually triggering payout processing...');
    await PayoutService.processPayouts();
  }
}

module.exports = PayoutService;