const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Payout = require('./models/Payout');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function test15kPassivePayout() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find alanko user
    const user = await User.findOne({ email: 'alanko@gmail.com' });
    if (!user) {
      console.log('❌ Alanko user not found');
      return;
    }

    console.log('\n=== BEFORE PAYOUT ===');
    console.log(`Current Passive Wallet: ₱${user.passiveWallet?.toLocaleString() || 0}`);
    console.log(`Current Total Balance: ₱${user.walletBalance?.toLocaleString() || 0}`);

    // Add ₱15,000 to Passive Wallet
    const payoutAmount = 15000;
    user.passiveWallet = (user.passiveWallet || 0) + payoutAmount;
    user.walletBalance = (user.walletBalance || 0) + payoutAmount;
    await user.save();

    // Note: Skipping Payout record creation as it requires valid contract and cycle data

    // Create a transaction record
    const transaction = new Transaction({
      user: user._id,
      type: 'earning',
      amount: payoutAmount,
      netAmount: payoutAmount,
      description: 'Passive Wallet Payout - Test',
      status: 'completed',
      walletType: 'passive'
    });
    await transaction.save();

    console.log('\n=== AFTER PAYOUT ===');
    console.log(`✅ Added ₱${payoutAmount.toLocaleString()} to Passive Wallet`);
    console.log(`New Passive Wallet: ₱${user.passiveWallet.toLocaleString()}`);
    console.log(`New Total Balance: ₱${user.walletBalance.toLocaleString()}`);
    console.log(`Transaction ID: ${transaction._id}`);
    console.log(`Transaction Type: ${transaction.type}`);
    console.log(`Transaction Status: ${transaction.status}`);

    console.log('\n🎯 TEST INSTRUCTIONS:');
    console.log('1. Refresh the Dashboard page - should show ₱15,000 in Passive Wallet');
    console.log('2. Go to My Wallet page - should show ₱15,000 in Passive Wallet card');
    console.log('3. Go to Withdrawal Request page - should show ₱15,000 as available balance');
    console.log('4. All three pages should display the same ₱15,000 balance');

  } catch (error) {
    console.error('❌ Error during payout test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

test15kPassivePayout();