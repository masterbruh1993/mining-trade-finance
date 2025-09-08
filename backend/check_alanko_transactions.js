require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Payout = require('./models/Payout');

async function checkAlankoTransactions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Find the current user (alanko)
    const currentUser = await User.findOne({ username: 'alanko' });
    
    if (!currentUser) {
      console.log('User alanko not found');
      return;
    }
    
    console.log('=== ALANKO TRANSACTION HISTORY ===');
    console.log('User ID:', currentUser._id);
    console.log('Current passive wallet: ₱' + (currentUser.passiveWallet || 0));
    
    // Find all transactions for alanko using correct field name
    const allTransactions = await Transaction.find({ user: currentUser._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    console.log(`\n=== TRANSACTIONS (${allTransactions.length} found) ===`);
    if (allTransactions.length > 0) {
      allTransactions.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.type.toUpperCase()} - ₱${tx.amount} (${tx.status})`);
        console.log(`   Transaction Type: ${tx.transactionType}`);
        console.log(`   Wallet Type: ${tx.walletType}`);
        console.log(`   Description: ${tx.description || 'N/A'}`);
        console.log(`   Date: ${tx.createdAt}`);
        console.log(`   Reference: ${tx.reference || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('No transactions found for alanko');
    }
    
    // Find all payouts for alanko
    const allPayouts = await Payout.find({ userId: currentUser._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    console.log(`\n=== PAYOUTS (${allPayouts.length} found) ===`);
    if (allPayouts.length > 0) {
      allPayouts.forEach((payout, index) => {
        console.log(`${index + 1}. ₱${payout.amount} - ${payout.status || 'N/A'}`);
        console.log(`   Contract: ${payout.contractId}`);
        console.log(`   Cycle: ${payout.cycle}`);
        console.log(`   Date: ${payout.createdAt}`);
        console.log('');
      });
    } else {
      console.log('No payouts found for alanko');
    }
    
    // Check if there are any recent earnings transactions
    const earningsTransactions = await Transaction.find({ 
      user: currentUser._id,
      transactionType: 'earnings'
    }).sort({ createdAt: -1 });
    
    console.log(`\n=== EARNINGS TRANSACTIONS (${earningsTransactions.length} found) ===`);
    if (earningsTransactions.length > 0) {
      earningsTransactions.forEach((tx, index) => {
        console.log(`${index + 1}. ₱${tx.amount} - ${tx.status} - ${tx.createdAt}`);
        console.log(`   Description: ${tx.description}`);
        console.log(`   Reference: ${tx.reference}`);
        console.log('');
      });
    } else {
      console.log('No earnings transactions found');
    }
    
    // Summary
    const totalEarnings = earningsTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total Earnings Transactions: ₱${totalEarnings}`);
    console.log(`Current Passive Wallet: ₱${currentUser.passiveWallet || 0}`);
    console.log(`Total Transactions: ${allTransactions.length}`);
    console.log(`Total Payouts: ${allPayouts.length}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkAlankoTransactions();