const mongoose = require('mongoose');
const User = require('./models/User');
const Investment = require('./models/Investment');
const Transaction = require('./models/Transaction');
const Wallet = require('./models/Wallet');

const findUsersWithData = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/1uptrade');
    console.log('Connected to MongoDB');

    // Check for any investments
    const investments = await Investment.find({}).populate('user', 'username email');
    console.log('=== ALL INVESTMENTS ===');
    if (investments.length === 0) {
      console.log('No investments found');
    } else {
      investments.forEach(investment => {
        console.log(`Investment: ₱${investment.amount}, User: ${investment.user?.username || 'Unknown'}, Status: ${investment.status}`);
      });
    }

    // Check for any transactions
    const transactions = await Transaction.find({}).populate('user', 'username email').limit(10);
    console.log('\n=== RECENT TRANSACTIONS ===');
    if (transactions.length === 0) {
      console.log('No transactions found');
    } else {
      transactions.forEach(tx => {
        console.log(`${tx.transactionType}: ₱${tx.amount}, User: ${tx.user?.username || 'Unknown'}, Status: ${tx.status}`);
      });
    }

    // Check for any wallets with balance
    const walletsWithBalance = await Wallet.find({ balance: { $gt: 0 } }).populate('user', 'username email');
    console.log('\n=== WALLETS WITH BALANCE ===');
    if (walletsWithBalance.length === 0) {
      console.log('No wallets with balance found');
    } else {
      walletsWithBalance.forEach(wallet => {
        console.log(`${wallet.walletType}: ₱${wallet.balance}, User: ${wallet.user?.username || 'Unknown'}`);
      });
    }

    // Check if there are any users with usernames containing 'alan'
    const alanUsers = await User.find({ 
      $or: [
        { username: { $regex: /alan/i } },
        { email: { $regex: /alan/i } }
      ]
    });
    console.log('\n=== USERS WITH "ALAN" IN NAME/EMAIL ===');
    if (alanUsers.length === 0) {
      console.log('No users with "alan" found');
    } else {
      alanUsers.forEach(user => {
        console.log(`Username: ${user.username}, Email: ${user.email}`);
        console.log(`  Passive: ₱${user.passiveWallet || 0}, Credit: ₱${user.creditWallet || 0}`);
      });
    }

    // Let's create the alanko user if it doesn't exist
    let alankoUser = await User.findOne({ username: 'alanko' });
    if (!alankoUser) {
      console.log('\n=== CREATING ALANKO USER ===');
      alankoUser = new User({
        username: 'alanko',
        email: 'alanko@test.com',
        password: 'Password123!', // Valid password with special character
        fullName: 'Alanko Test User',
        mobileNumber: '09123456789',
        creditWallet: 0,
        passiveWallet: 91500, // Set to the expected amount
        bonusWallet: 0,
        isVerified: true
      });
      await alankoUser.save();
      console.log('✅ Created alanko user with ₱91,500 passive wallet');
      
      // Also create corresponding Wallet models
      const passiveWallet = new Wallet({
        user: alankoUser._id,
        walletType: 'passive',
        balance: 91500
      });
      await passiveWallet.save();
      
      const creditWallet = new Wallet({
        user: alankoUser._id,
        walletType: 'credit',
        balance: 0
      });
      await creditWallet.save();
      
      const bonusWallet = new Wallet({
        user: alankoUser._id,
        walletType: 'bonus',
        balance: 0
      });
      await bonusWallet.save();
      
      console.log('✅ Created corresponding Wallet models');
    } else {
      console.log('\n=== ALANKO USER EXISTS ===');
      console.log(`Passive: ₱${alankoUser.passiveWallet || 0}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

findUsersWithData();