const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/1uptrade', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugDatabaseState() {
  try {
    console.log('🔍 Debugging Database State...');
    console.log('================================\n');
    
    // Check all users
    const users = await User.find({});
    console.log(`Total users in database: ${users.length}`);
    
    for (const user of users) {
      console.log(`\nUser: ${user.username} (${user.email})`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Role: ${user.role}`);
      
      // Check wallets for this user
      const userWallets = await Wallet.find({ user: user._id });
      console.log(`  Wallets: ${userWallets.length}`);
      
      userWallets.forEach(wallet => {
        console.log(`    - ${wallet.walletType}: ₱${wallet.balance}`);
      });
    }
    
    // Check all wallets
    console.log('\n================================');
    const allWallets = await Wallet.find({});
    console.log(`\nTotal wallets in database: ${allWallets.length}`);
    
    // Group by wallet type
    const walletsByType = {};
    allWallets.forEach(wallet => {
      if (!walletsByType[wallet.walletType]) {
        walletsByType[wallet.walletType] = 0;
      }
      walletsByType[wallet.walletType]++;
    });
    
    console.log('\nWallets by type:');
    Object.entries(walletsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    // Check for orphaned wallets (wallets without users)
    console.log('\n================================');
    console.log('\nChecking for orphaned wallets...');
    
    for (const wallet of allWallets) {
      const userExists = await User.findById(wallet.user);
      if (!userExists) {
        console.log(`⚠️  Orphaned wallet found: ${wallet._id} (${wallet.walletType})`);
      }
    }
    
    console.log('\n✅ Database state analysis complete!');
    
  } catch (error) {
    console.error('❌ Error during database analysis:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugDatabaseState();