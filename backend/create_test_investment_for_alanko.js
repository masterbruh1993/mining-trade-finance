require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Investment = require('./models/Investment');
const EarningsService = require('./services/earningsService');

async function createTestInvestmentForAlanko() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Find the current user (alanko)
    const currentUser = await User.findOne({ username: 'alanko' });
    
    if (!currentUser) {
      console.log('User alanko not found');
      return;
    }
    
    console.log('=== CREATING TEST INVESTMENT FOR ALANKO ===');
    console.log('Current user:', currentUser.username);
    console.log('Current passive wallet:', currentUser.passiveWallet || 0);
    
    // Create a test investment
    const startDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    const maturityDate = new Date(startDate.getTime() + (15 * 24 * 60 * 60 * 1000)); // 15 days from start
    
    const testInvestment = new Investment({
      user: currentUser._id,
      amount: 50000,
      startDate: startDate,
      maturityDate: maturityDate,
      status: 'active'
    });
    
    await testInvestment.save();
    console.log('Test investment created successfully');
    console.log('Investment ID:', testInvestment._id);
    console.log('Amount: ₱50,000');
    console.log('Expected total payouts: ₱75,000 (50% ROI)');
    
    // Update payout dates to past dates so they can be processed
    console.log('\n=== UPDATING PAYOUT DATES TO PAST ===');
    for (let i = 0; i < testInvestment.payoutSchedule.length; i++) {
      testInvestment.payoutSchedule[i].payoutDate = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
    }
    await testInvestment.save();
    console.log('Payout dates updated to past dates');
    
    // Process the pending payouts
    console.log('\n=== PROCESSING PENDING PAYOUTS ===');
    await EarningsService.processPendingPayouts();
    
    // Check the updated user wallet
    const updatedUser = await User.findById(currentUser._id);
    console.log('\n=== UPDATED WALLET BALANCES ===');
    console.log('Credit Wallet:', updatedUser.creditWallet || 0);
    console.log('Passive Wallet:', updatedUser.passiveWallet || 0);
    console.log('Bonus Wallet:', updatedUser.bonusWallet || 0);
    console.log('Total Balance:', updatedUser.walletBalance || 0);
    
    // Check the investment status
    const updatedInvestment = await Investment.findById(testInvestment._id);
    console.log('\n=== INVESTMENT STATUS ===');
    console.log('Status:', updatedInvestment.status);
    console.log('Completed payouts:', updatedInvestment.payouts.length);
    console.log('Remaining payouts:', updatedInvestment.remainingPayouts);
    
    console.log('\n✅ Test investment created and processed successfully!');
    console.log('The user alanko should now see ₱75,000 in their Passive Wallet');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createTestInvestmentForAlanko();