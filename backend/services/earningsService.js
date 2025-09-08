const Investment = require('../models/Investment');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Payout = require('../models/Payout');
const mongoose = require('mongoose');

class EarningsService {
  /**
   * Process all pending payouts for investments
   */
  static async processPendingPayouts() {
    try {
      console.log('Starting payout processing...');
      
      // Find all active investments that have reached maturity
      const now = new Date();
      const activeInvestments = await Investment.find({
        status: 'active',
        maturityDate: { $lte: now }
      }).populate('user');

      console.log(`Found ${activeInvestments.length} active investments to process`);

      for (const investment of activeInvestments) {
        await this.processInvestmentPayouts(investment);
      }

      console.log('Payout processing completed');
    } catch (error) {
      console.error('Error processing payouts:', error);
      throw error;
    }
  }

  /**
   * Process payouts for a specific investment
   */
  static async processInvestmentPayouts(investment) {
    try {
      const now = new Date();
      let payoutsProcessed = 0;

      // Check if investment has reached maturity and hasn't been paid yet
      if (now >= investment.maturityDate && !investment.payouts.includes(1)) {
        // Calculate total payout (400% of investment)
        const payoutAmount = investment.amount * (investment.totalROI / 100);
        
        // Credit the passive wallet in User model
        await User.findByIdAndUpdate(
          investment.user._id,
          { $inc: { passiveWallet: payoutAmount } }
        );
        
        // Also update the Wallet model for consistency
        const Wallet = require('../models/Wallet');
        await Wallet.findOneAndUpdate(
          { user: investment.user._id, walletType: 'passive' },
          { $inc: { balance: payoutAmount, totalIn: payoutAmount } },
          { upsert: true }
        );

        // Create transaction record
        const transaction = new Transaction({
          user: investment.user._id,
          type: 'earning',
          amount: payoutAmount,
          netAmount: payoutAmount,
          walletType: 'passive',
          status: 'completed',
          description: `Maturity Payout – ₱${payoutAmount.toLocaleString()} (400% total return) from ₱${investment.amount.toLocaleString()} contract`,
          reference: `EARN${Date.now()}${Math.floor(Math.random() * 1000)}`
        });

        await transaction.save();

        // Create payout record
        const payoutRecord = new Payout({
          contractId: investment._id,
          userId: investment.user._id,
          amount: payoutAmount,
          cycle: 1,
          dateReleased: now
        });

        await payoutRecord.save();

        // Mark payout as completed
        investment.payouts.push(1);
        investment.totalPayouts = 1;
        investment.remainingPayouts = 0;
        investment.status = 'completed';

        payoutsProcessed++;

        console.log(`Processed maturity payout for investment ${investment._id}: ₱${payoutAmount.toLocaleString()} (400% total return)`);
      }

      // Save the updated investment
      await investment.save();
      
      if (payoutsProcessed > 0) {
        console.log(`Processed ${payoutsProcessed} payouts for user ${investment.user.username}`);
      }

    } catch (error) {
      console.error(`Error processing payouts for investment ${investment._id}:`, error);
      throw error;
    }
  }

  /**
   * Get next payout information for an investment
   */
  static getNextPayoutInfo(investment) {
    const now = new Date();
    const nextPayout = investment.payoutSchedule.find(p => p.status === 'pending');
    
    if (!nextPayout) {
      return null;
    }

    const timeUntilPayout = nextPayout.payoutDate.getTime() - now.getTime();
    
    if (timeUntilPayout <= 0) {
      return {
        status: 'due',
        message: 'Payout is due'
      };
    }

    const days = Math.floor(timeUntilPayout / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeUntilPayout % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilPayout % (1000 * 60 * 60)) / (1000 * 60));

    return {
      status: 'pending',
      payoutDate: nextPayout.payoutDate,
      payoutAmount: nextPayout.payoutAmount,
      timeLeft: {
        days,
        hours,
        minutes,
        formatted: `${days}d ${hours}h ${minutes}m`
      }
    };
  }

  /**
   * Get investment progress information
   */
  static getInvestmentProgress(investment) {
    const completedPayouts = investment.payoutSchedule.filter(p => p.status === 'completed').length;
    const totalPayouts = investment.payoutSchedule.length;
    
    return {
      completed: completedPayouts,
      total: totalPayouts,
      percentage: Math.round((completedPayouts / totalPayouts) * 100)
    };
  }

  /**
   * Calculate days left until maturity
   */
  static getDaysLeft(investment) {
    const now = new Date();
    const timeLeft = investment.maturityDate.getTime() - now.getTime();
    
    if (timeLeft <= 0) {
      return 0;
    }
    
    return Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  }
}

module.exports = EarningsService;