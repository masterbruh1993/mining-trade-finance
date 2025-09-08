const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function test5kPassiveWithdrawal() {
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

    console.log('\n=== BEFORE WITHDRAWAL ===');
    console.log(`Current Passive Wallet: ₱${user.passiveWallet?.toLocaleString() || 0}`);
    console.log(`Current Total Balance: ₱${user.walletBalance?.toLocaleString() || 0}`);

    // Check if user has enough balance
    const withdrawalAmount = 5000;
    if ((user.passiveWallet || 0) < withdrawalAmount) {
      console.log(`❌ Insufficient balance. Current: ₱${user.passiveWallet?.toLocaleString() || 0}, Required: ₱${withdrawalAmount.toLocaleString()}`);
      return;
    }

    // Deduct ₱5,000 from Passive Wallet
    user.passiveWallet = (user.passiveWallet || 0) - withdrawalAmount;
    user.walletBalance = (user.walletBalance || 0) - withdrawalAmount;
    await user.save();

    // Create a withdrawal transaction record
    const transaction = new Transaction({
      user: user._id,
      type: 'withdrawal',
      amount: withdrawalAmount,
      netAmount: withdrawalAmount,
      description: 'Passive Wallet Withdrawal - Test',
      status: 'completed',
      walletType: 'passive',
      payoutMethod: 'GCash',
      accountDetails: '09123456789'
    });
    await transaction.save();

    console.log('\n=== AFTER WITHDRAWAL ===');
    console.log(`✅ Withdrew ₱${withdrawalAmount.toLocaleString()} from Passive Wallet`);
    console.log(`New Passive Wallet: ₱${user.passiveWallet.toLocaleString()}`);
    console.log(`New Total Balance: ₱${user.walletBalance.toLocaleString()}`);
    console.log(`Transaction ID: ${transaction._id}`);
    console.log(`Transaction Type: ${transaction.transactionType}`);
    console.log(`Transaction Status: ${transaction.status}`);
    console.log(`Payout Method: ${transaction.payoutMethod}`);

    console.log('\n🎯 TEST VERIFICATION:');
    console.log('1. Refresh the Dashboard page - should show updated Passive Wallet balance');
    console.log('2. Go to My Wallet page - should show the same updated balance');
    console.log('3. Go to Withdrawal Request page - should show the same updated balance');
    console.log('4. Check Transactions page - should show the withdrawal transaction');
    console.log('5. All pages should display consistent balance after withdrawal');

  } catch (error) {
    console.error('❌ Error during withdrawal test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

test5kPassiveWithdrawal();