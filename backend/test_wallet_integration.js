const mongoose = require('mongoose');
const User = require('./models/User');
const Investment = require('./models/Investment');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const EarningsService = require('./services/earningsService');
require('dotenv').config();

async function testWalletIntegration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create a test user
    let testUser = await User.findOne({ email: 'test@wallet.com' });
    if (!testUser) {
      testUser = await User.create({
        username: 'wallettest',
        fullName: 'Wallet Test User',
        email: 'test@wallet.com',
        password: 'TestPass123!',
        mobileNumber: '09123456789',
        role: 'user',
        isActive: true,
        creditWallet: 50000,
        passiveWallet: 0,
        bonusWallet: 0
      });
      console.log('✅ Created test user');
    } else {
      // Reset user wallets
      await User.findByIdAndUpdate(testUser._id, {
        creditWallet: 50000,
        passiveWallet: 0,
        bonusWallet: 0
      });
      console.log('✅ Reset test user wallets');
    }

    // Initialize wallets in Wallet model
    await Wallet.deleteMany({ user: testUser._id });
    const walletTypes = ['bonus', 'passive', 'credit'];
    for (const type of walletTypes) {
      await Wallet.create({
        user: testUser._id,
        walletType: type,
        balance: type === 'credit' ? 50000 : 0,
        totalIn: type === 'credit' ? 50000 : 0,
        totalOut: 0
      });
    }
    console.log('✅ Initialized Wallet documents');

    // Clean up existing investments and transactions
    await Investment.deleteMany({ user: testUser._id });
    await Transaction.deleteMany({ user: testUser._id });
    console.log('✅ Cleaned up existing data');

    // Create a ₱50,000 investment
    const startDate = new Date();
    const maturityDate = new Date(startDate.getTime() + (60 * 24 * 60 * 60 * 1000)); // 60 days later
    
    const investment = await Investment.create({
      user: testUser._id,
      amount: 50000,
      startDate: startDate,
      maturityDate: maturityDate,
      status: 'active',
      payoutInterval: 60,
      payoutPercent: 100,
      totalCycles: 1,
      totalROI: 400,
      duration: 60,
      payoutSchedule: [
        { payoutDate: maturityDate, payoutAmount: 200000, status: 'pending' }
      ],
      payouts: [],
      totalPayouts: 0,
      remainingPayouts: 1
    });
    console.log('✅ Created ₱50,000 investment contract');

    // Test maturity payout (simulate 60 days passed)
    console.log(`\n🔄 Testing maturity payout (Day 60)...`);
    
    // Update maturity date to be in the past (trigger payout)
    const pastDate = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 1 day ago
    
    await Investment.findByIdAndUpdate(investment._id, {
      maturityDate: pastDate,
      'payoutSchedule.0.payoutDate': pastDate
    });
    
    // Process payouts
    await EarningsService.processPendingPayouts();
    
    // Check User model balances
    const updatedUser = await User.findById(testUser._id);
    const userPassive = updatedUser.passiveWallet || 0;
    const userBonus = updatedUser.bonusWallet || 0;
    console.log(`   User Model - Passive: ₱${userPassive.toLocaleString()}, Bonus: ₱${userBonus.toLocaleString()}`);
    
    // Check Wallet model balances
    const passiveWallet = await Wallet.findOne({ user: testUser._id, walletType: 'passive' });
    const bonusWallet = await Wallet.findOne({ user: testUser._id, walletType: 'bonus' });
    console.log(`   Wallet Model - Passive: ₱${passiveWallet.balance.toLocaleString()}, Bonus: ₱${bonusWallet.balance.toLocaleString()}`);
    
    // Check transactions
    const transactions = await Transaction.find({ user: testUser._id, walletType: 'passive' }).sort({ createdAt: -1 });
    console.log(`   Transactions: ${transactions.length} payout transactions logged`);
    
    // Calculate expected values
    const expectedPassive = 200000; // 400% of 50000
    const totalEarnings = userPassive + userBonus;
    
    console.log(`   Expected Passive: ₱${expectedPassive.toLocaleString()}`);
    console.log(`   Total Earnings: ₱${totalEarnings.toLocaleString()}`);
    
    // Verify consistency between User and Wallet models
    const userPassiveMatch = userPassive === passiveWallet.balance;
    const userBonusMatch = userBonus === bonusWallet.balance;
    
    console.log(`   User ↔ Wallet Sync: Passive ${userPassiveMatch ? '✅' : '❌'}, Bonus ${userBonusMatch ? '✅' : '❌'}`);
    
    if (!userPassiveMatch || !userBonusMatch) {
      console.log(`   ⚠️  SYNC ISSUE: User(${userPassive}, ${userBonus}) vs Wallet(${passiveWallet.balance}, ${bonusWallet.balance})`);
    }

    // Final verification
    console.log('\n📊 Final Verification:');
    const finalUser = await User.findById(testUser._id);
    const finalPassiveWallet = await Wallet.findOne({ user: testUser._id, walletType: 'passive' });
    const finalBonusWallet = await Wallet.findOne({ user: testUser._id, walletType: 'bonus' });
    const finalInvestment = await Investment.findById(investment._id);
    const allTransactions = await Transaction.find({ user: testUser._id, walletType: 'passive' });
    
    const finalUserPassive = finalUser.passiveWallet || 0;
    const finalUserBonus = finalUser.bonusWallet || 0;
    
    console.log(`Final User Model - Passive: ₱${finalUserPassive.toLocaleString()}, Bonus: ₱${finalUserBonus.toLocaleString()}`);
    console.log(`Final Wallet Model - Passive: ₱${finalPassiveWallet.balance.toLocaleString()}, Bonus: ₱${finalBonusWallet.balance.toLocaleString()}`);
    console.log(`Total Earnings: ₱${(finalUserPassive + finalUserBonus).toLocaleString()}`);
    console.log(`Investment Status: ${finalInvestment.status}`);
    console.log(`Total Transactions: ${allTransactions.length}`);
    
    // Expected final state
    const expectedFinalPassive = 200000; // 400% ROI on ₱50,000
    const passiveMatch = finalUserPassive === expectedFinalPassive;
    const walletSync = finalUserPassive === finalPassiveWallet.balance;
    const contractComplete = finalInvestment.status === 'completed';
    
    console.log(`\n✅ Test Results:`);
    console.log(`   Passive Wallet Amount: ${passiveMatch ? '✅' : '❌'} (Expected: ₱200,000, Got: ₱${finalUserPassive.toLocaleString()})`);
    console.log(`   User ↔ Wallet Sync: ${walletSync ? '✅' : '❌'}`);
    console.log(`   Contract Completion: ${contractComplete ? '✅' : '❌'}`);
    console.log(`   Transaction Logging: ${allTransactions.length === 1 ? '✅' : '❌'} (${allTransactions.length}/1 transactions)`);
    
    if (passiveMatch && walletSync && contractComplete && allTransactions.length === 1) {
      console.log('\n🎉 ALL TESTS PASSED! Wallet integration is working correctly.');
    } else {
      console.log('\n❌ Some tests failed. Please review the issues above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testWalletIntegration();