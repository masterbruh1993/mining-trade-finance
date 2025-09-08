require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

async function checkWalletTransactions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find the test user
    const testUser = await User.findOne({ email: 'test1@gmail.com' });
    if (!testUser) {
      console.log('Test user not found');
      return;
    }

    console.log(`\nChecking wallet transactions for user: ${testUser.email}`);
    console.log(`Current Passive Wallet Balance: ₱${testUser.passiveWallet.toLocaleString()}`);

    // Get all transactions for this user
    const transactions = await Transaction.find({ user: testUser._id })
      .sort({ createdAt: -1 })
      .limit(20);

    console.log(`\nFound ${transactions.length} transactions:`);
    console.log('='.repeat(80));

    transactions.forEach((transaction, index) => {
      console.log(`${index + 1}. ${transaction.type} - ₱${transaction.amount.toLocaleString()}`);
      console.log(`   Status: ${transaction.status}`);
      console.log(`   Wallet: ${transaction.walletType}`);
      console.log(`   Description: ${transaction.description}`);
      console.log(`   Date: ${transaction.createdAt.toLocaleString()}`);
      console.log(`   Reference: ${transaction.reference}`);
      console.log('-'.repeat(60));
    });

    // Count payout transactions specifically
    const payoutTransactions = transactions.filter(t => 
      t.transactionType === 'earnings' || 
      t.type === 'Earnings' ||
      t.description.includes('Payout')
    );

    console.log(`\nPayout-related transactions: ${payoutTransactions.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkWalletTransactions();