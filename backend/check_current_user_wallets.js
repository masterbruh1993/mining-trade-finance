require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');

async function checkCurrentUserWallets() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Find the current logged-in user (assuming it's alanko based on the UI)
    const currentUser = await User.findOne({ username: 'alanko' });
    
    if (currentUser) {
      console.log('=== CURRENT USER WALLET DETAILS ===');
      console.log('ID:', currentUser._id);
      console.log('Username:', currentUser.username);
      console.log('Email:', currentUser.email);
      console.log('Full Name:', currentUser.fullName);
      console.log('\n--- USER MODEL WALLET FIELDS ---');
      console.log('Credit Wallet:', currentUser.creditWallet || 0);
      console.log('Passive Wallet:', currentUser.passiveWallet || 0);
      console.log('Bonus Wallet:', currentUser.bonusWallet || 0);
      console.log('Wallet Balance (Total):', currentUser.walletBalance || 0);
      
      // Check corresponding Wallet model
      const userWallet = await Wallet.findOne({ userId: currentUser._id });
      if (userWallet) {
        console.log('\n--- WALLET MODEL FIELDS ---');
        console.log('Credit Balance:', userWallet.creditBalance || 0);
        console.log('Passive Balance:', userWallet.passiveBalance || 0);
        console.log('Bonus Balance:', userWallet.bonusBalance || 0);
        console.log('Total Balance:', userWallet.totalBalance || 0);
      } else {
        console.log('\n--- WALLET MODEL ---');
        console.log('No Wallet model found for this user');
      }
      
      // Check recent transactions
      const recentTransactions = await Transaction.find({ userId: currentUser._id })
        .sort({ createdAt: -1 })
        .limit(10);
        
      console.log('\n--- RECENT TRANSACTIONS ---');
      if (recentTransactions.length > 0) {
        recentTransactions.forEach((tx, index) => {
          console.log(`${index + 1}. ${tx.type} - ₱${tx.amount} (${tx.status}) - ${tx.createdAt}`);
        });
      } else {
        console.log('No transactions found');
      }
      
    } else {
      console.log('Current user (alanko) not found');
      
      // List all users to see what's available
      const allUsers = await User.find({}, 'username email role').limit(10);
      console.log('\n=== AVAILABLE USERS ===');
      allUsers.forEach(user => {
        console.log(`${user.username} (${user.email}) - ${user.role}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkCurrentUserWallets();