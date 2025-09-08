require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Investment = require('./models/Investment');
const EarningsService = require('./services/earningsService');

async function process50kInvestment() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Find the current user (alanko)
    const currentUser = await User.findOne({ username: 'alanko' });
    
    if (!currentUser) {
      console.log('User alanko not found');
      return;
    }
    
    console.log('=== PROCESSING ₱50,000 INVESTMENT ===');
    console.log('Current passive wallet:', currentUser.passiveWallet || 0);
    
    // Find the ₱50,000 investment
    const investment50k = await Investment.findOne({ 
      user: currentUser._id, 
      amount: 50000,
      status: 'active'
    });
    
    if (!investment50k) {
      console.log('No active ₱50,000 investment found');
      return;
    }
    
    console.log('\n=== INVESTMENT DETAILS ===');
    console.log('Investment ID:', investment50k._id);
    console.log('Amount: ₱' + investment50k.amount);
    console.log('Status:', investment50k.status);
    console.log('Completed payouts:', investment50k.payouts.length);
    console.log('Remaining payouts:', investment50k.remainingPayouts);
    
    // Update all payout dates to past dates
    console.log('\n=== UPDATING PAYOUT DATES TO PAST ===');
    let updatedPayouts = 0;
    for (let i = 0; i < investment50k.payoutSchedule.length; i++) {
      if (investment50k.payoutSchedule[i].status === 'pending') {
        investment50k.payoutSchedule[i].payoutDate = new Date(Date.now() - (i + 1) * 60 * 60 * 1000); // Hours ago
        updatedPayouts++;
        console.log(`  Payout ${i + 1}: ₱${investment50k.payoutSchedule[i].payoutAmount} - ${investment50k.payoutSchedule[i].payoutDate}`);
      }
    }
    
    await investment50k.save();
    console.log(`\nUpdated ${updatedPayouts} pending payouts to past dates`);
    
    // Process payouts multiple times to ensure all are processed
    console.log('\n=== PROCESSING PAYOUTS ===');
    for (let round = 1; round <= 3; round++) {
      console.log(`\nRound ${round}:`);
      await EarningsService.processPendingPayouts();
      
      // Check current status
      const updatedUser = await User.findById(currentUser._id);
      const updatedInvestment = await Investment.findById(investment50k._id);
      
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
    const finalInvestment = await Investment.findById(investment50k._id);
    
    console.log('\n=== FINAL RESULTS ===');
    console.log('Credit Wallet: ₱' + (finalUser.creditWallet || 0));
    console.log('Passive Wallet: ₱' + (finalUser.passiveWallet || 0));
    console.log('Bonus Wallet: ₱' + (finalUser.bonusWallet || 0));
    console.log('Total Balance: ₱' + (finalUser.walletBalance || 0));
    console.log('\nInvestment Status:', finalInvestment.status);
    console.log('Completed Payouts:', finalInvestment.payouts.length);
    console.log('Remaining Payouts:', finalInvestment.remainingPayouts);
    
    const expectedTotal = 16500 + (4 * 15000); // Current ₱16,500 + 4 remaining ₱15,000 payouts
    console.log(`\nExpected Total: ₱${expectedTotal}`);
    
    if (finalUser.passiveWallet >= expectedTotal) {
      console.log(`\n✅ SUCCESS: Expected passive wallet amount achieved!`);
    } else {
      console.log(`\n⚠️  PARTIAL: Only ₱${finalUser.passiveWallet} achieved, expected ₱${expectedTotal}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

process50kInvestment();