require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const Investment = require('./models/Investment');

async function checkAllUserWallets() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Find all users with non-zero passive wallets
    const usersWithPassiveWallet = await User.find({ 
      passiveWallet: { $gt: 0 } 
    });
    
    console.log('=== USERS WITH PASSIVE WALLET BALANCES ===');
    if (usersWithPassiveWallet.length > 0) {
      for (const user of usersWithPassiveWallet) {
        console.log(`\n--- ${user.username} (${user.email}) ---`);
        console.log('Credit Wallet:', user.creditWallet || 0);
        console.log('Passive Wallet:', user.passiveWallet || 0);
        console.log('Bonus Wallet:', user.bonusWallet || 0);
        console.log('Total Balance:', user.walletBalance || 0);
        
        // Check transactions for this user
        const userTransactions = await Transaction.find({ userId: user._id })
          .sort({ createdAt: -1 })
          .limit(5);
        
        if (userTransactions.length > 0) {
          console.log('Recent Transactions:');
          userTransactions.forEach((tx, index) => {
            console.log(`  ${index + 1}. ${tx.type} - ₱${tx.amount} (${tx.status})`);
          });
        }
      }
    } else {
      console.log('No users found with passive wallet balances');
    }
    
    // Check all transactions to see if there are any earnings
    console.log('\n=== ALL EARNINGS TRANSACTIONS ===');
    const earningsTransactions = await Transaction.find({ 
      type: 'earnings' 
    }).sort({ createdAt: -1 }).limit(10);
    
    if (earningsTransactions.length > 0) {
      for (const tx of earningsTransactions) {
        const user = await User.findById(tx.userId);
        console.log(`${user ? user.username : 'Unknown'}: ₱${tx.amount} - ${tx.status} - ${tx.createdAt}`);
      }
    } else {
      console.log('No earnings transactions found');
    }
    
    // Check all investments
    console.log('\n=== ALL INVESTMENTS ===');
    const allInvestments = await Investment.find({}).sort({ createdAt: -1 }).limit(10);
    
    if (allInvestments.length > 0) {
      for (const investment of allInvestments) {
        const user = await User.findById(investment.userId);
        console.log(`${user ? user.username : 'Unknown'}: ₱${investment.amount} - ${investment.status} - Payouts: ${investment.payouts ? investment.payouts.length : 0}`);
      }
    } else {
      console.log('No investments found');
    }
    
    // Check if there are any Wallet model records
    console.log('\n=== WALLET MODEL RECORDS ===');
    const allWallets = await Wallet.find({}).limit(10);
    
    if (allWallets.length > 0) {
      for (const wallet of allWallets) {
        const user = await User.findById(wallet.userId);
        console.log(`${user ? user.username : 'Unknown'}: Credit: ₱${wallet.creditBalance}, Passive: ₱${wallet.passiveBalance}, Bonus: ₱${wallet.bonusBalance}`);
      }
    } else {
      console.log('No Wallet model records found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkAllUserWallets();