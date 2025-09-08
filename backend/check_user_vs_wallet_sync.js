const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');

const checkUserWalletSync = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/1uptrade');
    console.log('Connected to MongoDB');

    // Find alanko user
    const user = await User.findOne({ username: 'alanko' });
    if (!user) {
      console.log('User alanko not found');
      return;
    }

    console.log('=== USER MODEL DATA ===');
    console.log('Username:', user.username);
    console.log('Credit Wallet:', user.creditWallet || 0);
    console.log('Passive Wallet:', user.passiveWallet || 0);
    console.log('Bonus Wallet:', user.bonusWallet || 0);

    // Find corresponding Wallet models
    const wallets = await Wallet.find({ user: user._id });
    
    console.log('\n=== WALLET MODEL DATA ===');
    if (wallets.length === 0) {
      console.log('No Wallet models found for this user');
    } else {
      wallets.forEach(wallet => {
        console.log(`${wallet.walletType} Wallet:`, wallet.balance || 0);
      });
    }

    // Check for sync issues
    const passiveWallet = wallets.find(w => w.walletType === 'passive');
    const bonusWallet = wallets.find(w => w.walletType === 'bonus');
    const creditWallet = wallets.find(w => w.walletType === 'credit');

    console.log('\n=== SYNCHRONIZATION CHECK ===');
    
    if (passiveWallet) {
      const userPassive = user.passiveWallet || 0;
      const walletPassive = passiveWallet.balance || 0;
      console.log(`Passive Wallet - User Model: ₱${userPassive}, Wallet Model: ₱${walletPassive}`);
      if (userPassive !== walletPassive) {
        console.log('❌ SYNC ISSUE: Passive wallet values don\'t match!');
      } else {
        console.log('✅ Passive wallet values are synchronized');
      }
    } else {
      console.log('⚠️  No passive Wallet model found');
    }

    if (bonusWallet) {
      const userBonus = user.bonusWallet || 0;
      const walletBonus = bonusWallet.balance || 0;
      console.log(`Bonus Wallet - User Model: ₱${userBonus}, Wallet Model: ₱${walletBonus}`);
      if (userBonus !== walletBonus) {
        console.log('❌ SYNC ISSUE: Bonus wallet values don\'t match!');
      } else {
        console.log('✅ Bonus wallet values are synchronized');
      }
    } else {
      console.log('⚠️  No bonus Wallet model found');
    }

    if (creditWallet) {
      const userCredit = user.creditWallet || 0;
      const walletCredit = creditWallet.balance || 0;
      console.log(`Credit Wallet - User Model: ₱${userCredit}, Wallet Model: ₱${walletCredit}`);
      if (userCredit !== walletCredit) {
        console.log('❌ SYNC ISSUE: Credit wallet values don\'t match!');
      } else {
        console.log('✅ Credit wallet values are synchronized');
      }
    } else {
      console.log('⚠️  No credit Wallet model found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkUserWalletSync();