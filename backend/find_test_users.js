const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');

const findTestUsers = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/1uptrade');
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({}).select('username email passiveWallet creditWallet bonusWallet');
    
    console.log('=== ALL USERS ===');
    if (users.length === 0) {
      console.log('No users found');
    } else {
      users.forEach(user => {
        console.log(`Username: ${user.username}, Email: ${user.email}`);
        console.log(`  Passive: ₱${user.passiveWallet || 0}, Credit: ₱${user.creditWallet || 0}, Bonus: ₱${user.bonusWallet || 0}`);
      });
    }

    // Find users with non-zero passive wallet
    const usersWithPassive = await User.find({ passiveWallet: { $gt: 0 } });
    
    console.log('\n=== USERS WITH PASSIVE WALLET > 0 ===');
    if (usersWithPassive.length === 0) {
      console.log('No users with passive wallet balance found');
    } else {
      for (const user of usersWithPassive) {
        console.log(`\n--- ${user.username} (${user.email}) ---`);
        console.log('User Model:');
        console.log(`  Passive: ₱${user.passiveWallet || 0}`);
        console.log(`  Credit: ₱${user.creditWallet || 0}`);
        console.log(`  Bonus: ₱${user.bonusWallet || 0}`);
        
        // Check corresponding Wallet models
        const wallets = await Wallet.find({ user: user._id });
        console.log('Wallet Models:');
        if (wallets.length === 0) {
          console.log('  No Wallet models found');
        } else {
          wallets.forEach(wallet => {
            console.log(`  ${wallet.walletType}: ₱${wallet.balance || 0}`);
          });
        }
        
        // Check sync status
        const passiveWallet = wallets.find(w => w.walletType === 'passive');
        if (passiveWallet) {
          const userPassive = user.passiveWallet || 0;
          const walletPassive = passiveWallet.balance || 0;
          if (userPassive !== walletPassive) {
            console.log(`  ❌ SYNC ISSUE: User(₱${userPassive}) vs Wallet(₱${walletPassive})`);
          } else {
            console.log(`  ✅ Synchronized: ₱${userPassive}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

findTestUsers();