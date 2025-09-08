require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Investment = require('./models/Investment');
const EarningsService = require('./services/earningsService');

async function processAllPayoutsForAlanko() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Find the current user (alanko)
    const currentUser = await User.findOne({ username: 'alanko' });
    
    if (!currentUser) {
      console.log('User alanko not found');
      return;
    }
    
    console.log('=== PROCESSING ALL REMAINING PAYOUTS FOR ALANKO ===');
    console.log('Current passive wallet:', currentUser.passiveWallet || 0);
    
    // Find the active investment for alanko
    const activeInvestment = await Investment.findOne({ 
      user: currentUser._id, 
      status: 'active' 
    });
    
    if (!activeInvestment) {
      console.log('No active investment found for alanko');
      return;
    }
    
    console.log('\n=== INVESTMENT DETAILS ===');
    console.log('Investment ID:', activeInvestment._id);
    console.log('Amount:', activeInvestment.amount);
    console.log('Current status:', activeInvestment.status);
    console.log('Payout schedule length:', activeInvestment.payoutSchedule.length);
    
    // Update all remaining payout dates to past dates
    console.log('\n=== UPDATING ALL PAYOUT DATES TO PAST ===');
    let updatedPayouts = 0;
    for (let i = 0; i < activeInvestment.payoutSchedule.length; i++) {
      if (activeInvestment.payoutSchedule[i].status === 'pending') {
        activeInvestment.payoutSchedule[i].payoutDate = new Date(Date.now() - (i + 1) * 60 * 60 * 1000); // Hours ago
        updatedPayouts++;
      }
    }
    
    await activeInvestment.save();
    console.log(`Updated ${updatedPayouts} pending payouts to past dates`);
    
    // Process payouts multiple times to ensure all are processed
    console.log('\n=== PROCESSING PAYOUTS (Multiple Rounds) ===');
    for (let round = 1; round <= 5; round++) {
      console.log(`\nRound ${round}:`);
      await EarningsService.processPendingPayouts();
      
      // Check current status
      const updatedUser = await User.findById(currentUser._id);
      const updatedInvestment = await Investment.findById(activeInvestment._id);
      
      console.log(`  Passive Wallet: ₱${updatedUser.passiveWallet || 0}`);
      console.log(`  Completed payouts: ${updatedInvestment.payouts.length}`);
      console.log(`  Remaining payouts: ${updatedInvestment.remainingPayouts}`);
      console.log(`  Investment status: ${updatedInvestment.status}`);
      
      // Break if all payouts are completed
      if (updatedInvestment.remainingPayouts === 0 || updatedInvestment.status === 'completed') {
        console.log('  All payouts completed!');
        break;
      }
    }
    
    // Final status check
    const finalUser = await User.findById(currentUser._id);
    const finalInvestment = await Investment.findById(activeInvestment._id);
    
    console.log('\n=== FINAL RESULTS ===');
    console.log('Credit Wallet:', finalUser.creditWallet || 0);
    console.log('Passive Wallet:', finalUser.passiveWallet || 0);
    console.log('Bonus Wallet:', finalUser.bonusWallet || 0);
    console.log('Total Balance:', finalUser.walletBalance || 0);
    console.log('\nInvestment Status:', finalInvestment.status);
    console.log('Completed Payouts:', finalInvestment.payouts.length);
    console.log('Remaining Payouts:', finalInvestment.remainingPayouts);
    
    if (finalUser.passiveWallet >= 75000) {
      console.log('\n✅ SUCCESS: Full ₱75,000 passive wallet achieved!');
    } else {
      console.log(`\n⚠️  PARTIAL: Only ₱${finalUser.passiveWallet} achieved, expected ₱75,000`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

processAllPayoutsForAlanko();