const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
require('dotenv').config();

async function migrateWallets() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');
    console.log('\n=== WALLET MIGRATION SCRIPT ===');
    console.log('Moving balances from Passive Wallets to Credit Wallets\n');

    // Find all users with passive wallets that have balance > 0
    const passiveWallets = await Wallet.find({ 
      walletType: 'passive',
      balance: { $gt: 0 }
    }).populate('user', 'email username');

    console.log(`Found ${passiveWallets.length} passive wallets with balance > 0`);
    
    if (passiveWallets.length === 0) {
      console.log('✅ No passive wallets with balance found. Migration not needed.');
      return;
    }

    let usersFixed = 0;
    let totalAmountMigrated = 0;
    const migrationLog = [];

    for (const passiveWallet of passiveWallets) {
      const userId = passiveWallet.user._id;
      const userEmail = passiveWallet.user.email;
      const passiveBalance = passiveWallet.balance;
      
      console.log(`\n📋 Processing user: ${userEmail}`);
      console.log(`   Passive Wallet Balance: ₱${passiveBalance.toLocaleString()}`);

      // Find or create credit wallet for this user
      let creditWallet = await Wallet.findOne({ 
        user: userId, 
        walletType: 'credit' 
      });

      if (!creditWallet) {
        console.log('   Creating new credit wallet...');
        creditWallet = await Wallet.create({
          user: userId,
          walletType: 'credit',
          balance: 0
        });
      }

      const previousCreditBalance = creditWallet.balance;
      
      // Transfer balance from passive to credit
      creditWallet.balance += passiveBalance;
      await creditWallet.save();
      
      // Reset passive wallet balance to 0
      passiveWallet.balance = 0;
      await passiveWallet.save();
      
      console.log(`   ✅ Credit Wallet: ₱${previousCreditBalance.toLocaleString()} → ₱${creditWallet.balance.toLocaleString()}`);
      console.log(`   ✅ Passive Wallet: ₱${passiveBalance.toLocaleString()} → ₱0`);
      
      // Log the migration
      migrationLog.push({
        userEmail,
        userId: userId.toString(),
        amountMigrated: passiveBalance,
        previousCreditBalance,
        newCreditBalance: creditWallet.balance
      });
      
      usersFixed++;
      totalAmountMigrated += passiveBalance;
    }

    console.log('\n=== MIGRATION SUMMARY ===');
    console.log(`Total users processed: ${usersFixed}`);
    console.log(`Total amount migrated: ₱${totalAmountMigrated.toLocaleString()}`);
    
    console.log('\n=== DETAILED MIGRATION LOG ===');
    migrationLog.forEach((log, index) => {
      console.log(`${index + 1}. ${log.userEmail}`);
      console.log(`   User ID: ${log.userId}`);
      console.log(`   Amount Migrated: ₱${log.amountMigrated.toLocaleString()}`);
      console.log(`   Credit Wallet: ₱${log.previousCreditBalance.toLocaleString()} → ₱${log.newCreditBalance.toLocaleString()}`);
      console.log('');
    });

    // Verify migration
    const remainingPassiveBalances = await Wallet.find({ 
      walletType: 'passive',
      balance: { $gt: 0 }
    });
    
    if (remainingPassiveBalances.length === 0) {
      console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('✅ All passive wallet balances have been moved to credit wallets');
      console.log('✅ All passive wallets now have ₱0 balance');
    } else {
      console.log(`⚠️  WARNING: ${remainingPassiveBalances.length} passive wallets still have balance > 0`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
  }
}

migrateWallets();