require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Investment = require('./models/Investment');

async function checkAlankoInvestments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Find the current user (alanko)
    const currentUser = await User.findOne({ username: 'alanko' });
    
    if (!currentUser) {
      console.log('User alanko not found');
      return;
    }
    
    console.log('=== ALL INVESTMENTS FOR ALANKO ===');
    console.log('User ID:', currentUser._id);
    console.log('Current passive wallet:', currentUser.passiveWallet || 0);
    
    // Find all investments for alanko
    const allInvestments = await Investment.find({ user: currentUser._id })
      .sort({ createdAt: -1 });
    
    if (allInvestments.length === 0) {
      console.log('No investments found for alanko');
      return;
    }
    
    console.log(`\nFound ${allInvestments.length} investments:\n`);
    
    allInvestments.forEach((investment, index) => {
      console.log(`--- Investment ${index + 1} ---`);
      console.log('ID:', investment._id);
      console.log('Amount: ₱' + investment.amount);
      console.log('Status:', investment.status);
      console.log('Start Date:', investment.startDate);
      console.log('Maturity Date:', investment.maturityDate);
      console.log('Payouts completed:', investment.payouts.length);
      console.log('Remaining payouts:', investment.remainingPayouts);
      console.log('Payout schedule length:', investment.payoutSchedule.length);
      
      // Show payout schedule details
      console.log('Payout Schedule:');
      investment.payoutSchedule.forEach((payout, i) => {
        console.log(`  ${i + 1}. ₱${payout.payoutAmount} - ${payout.status} - ${payout.payoutDate}`);
      });
      
      console.log('Created:', investment.createdAt);
      console.log('');
    });
    
    // Create a new ₱50,000 investment if none exists
    const largeInvestment = allInvestments.find(inv => inv.amount >= 50000);
    
    if (!largeInvestment) {
      console.log('=== CREATING NEW ₱50,000 INVESTMENT ===');
      
      const startDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const maturityDate = new Date(startDate.getTime() + (15 * 24 * 60 * 60 * 1000)); // 15 days from start
      
      const newInvestment = new Investment({
        user: currentUser._id,
        amount: 50000,
        startDate: startDate,
        maturityDate: maturityDate,
        status: 'active'
      });
      
      await newInvestment.save();
      console.log('New ₱50,000 investment created!');
      console.log('Investment ID:', newInvestment._id);
      
      // Update payout dates to past
      for (let i = 0; i < newInvestment.payoutSchedule.length; i++) {
        newInvestment.payoutSchedule[i].payoutDate = new Date(Date.now() - (i + 1) * 60 * 60 * 1000);
      }
      await newInvestment.save();
      console.log('Payout dates set to past for immediate processing');
    } else {
      console.log('Large investment already exists:', largeInvestment.amount);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkAlankoInvestments();