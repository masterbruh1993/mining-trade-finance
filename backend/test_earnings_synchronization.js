const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Wallet = require('./models/Wallet');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testEarningsSynchronization() {
  try {
    console.log('🔄 Testing Dashboard vs Transaction History Total Earnings Synchronization...');
    
    // Step 1: Create test user
    console.log('\n📋 Step 1: Creating test user...');
    const testUser = new User({
      username: `sync_test_${Date.now()}`,
      email: `synctest${Date.now()}@example.com`,
      fullName: 'Sync Test User',
      mobileNumber: '09123456789',
      password: 'Password123!',
      creditWallet: 50000,
      passiveWallet: 0,
      bonusWallet: 0
    });
    await testUser.save();
    console.log('✅ Test user created:', testUser.username);
    
    // Create wallets for the user
    const wallets = [
      { user: testUser._id, walletType: 'credit', balance: 50000 },
      { user: testUser._id, walletType: 'passive', balance: 0 },
      { user: testUser._id, walletType: 'bonus', balance: 0 }
    ];
    await Wallet.insertMany(wallets);
    console.log('✅ Wallets created for test user');
    
    // Generate JWT token
    const token = jwt.sign({ id: testUser._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Step 2: Get initial values
    console.log('\n📋 Step 2: Getting initial Dashboard and Transaction History values...');
    
    const initialDashboard = await axios.get('http://localhost:5000/api/v1/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const initialTransactionSummary = await axios.get('http://localhost:5000/api/v1/transactions/summary', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📊 Initial Values:');
    console.log(`   Dashboard Total Payouts Received: ₱${initialDashboard.data.totalPayoutsReceived}`);
    console.log(`   Transaction History Total Earnings: ₱${initialTransactionSummary.data.data.totalEarnings}`);
    console.log(`   Values Match: ${initialDashboard.data.totalPayoutsReceived === initialTransactionSummary.data.data.totalEarnings ? '✅' : '❌'}`);
    
    // Step 3: Add passive earning transaction
    console.log('\n📋 Step 3: Adding passive earning transaction (₱3,000)...');
    
    // Clear any existing transactions first
    await Transaction.deleteMany({ user: testUser._id });
    
    const passiveTransaction = new Transaction({
      user: testUser._id,
      type: 'earning',
      amount: 3000,
      netAmount: 3000,
      description: 'Passive investment earning',
      status: 'completed',
      walletType: 'passive'
    });
    await passiveTransaction.save();

    // Update user and wallet balances
    await User.findByIdAndUpdate(testUser._id, { $inc: { passiveWallet: 3000 } });
    await Wallet.findOneAndUpdate(
      { user: testUser._id, walletType: 'passive' },
      { $inc: { balance: 3000 } }
    );

    console.log('✅ Passive earning transaction added');
    
    // Step 4: Add referral commission transaction
    console.log('\n📋 Step 4: Adding referral commission transaction (₱2,500)...');
    
    const referralTransaction = new Transaction({
      user: testUser._id,
      type: 'referral',
      amount: 2500,
      netAmount: 2500,
      description: 'Level 1 referral commission',
      status: 'completed',
      walletType: 'bonus'
    });
    await referralTransaction.save();
    
    // Update user and wallet balances
    await User.findByIdAndUpdate(testUser._id, { $inc: { bonusWallet: 2500 } });
    await Wallet.findOneAndUpdate(
      { user: testUser._id, walletType: 'bonus' },
      { $inc: { balance: 2500 } }
    );
    
    console.log('✅ Referral commission transaction added');
    
    // Debug: Check what transactions were actually saved
    const savedTransactions = await Transaction.find({ user: testUser._id });
    console.log('📋 Debug - Saved transactions:');
    savedTransactions.forEach(t => {
      console.log(`   Type: ${t.type}, Amount: ₱${t.amount}, Status: ${t.status}`);
    });
    
    // Step 5: Test synchronization after earnings
    console.log('\n📋 Step 5: Testing synchronization after adding earnings...');
    
    const afterEarningsDashboard = await axios.get('http://localhost:5000/api/v1/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const afterEarningsTransactionSummary = await axios.get('http://localhost:5000/api/v1/transactions/summary', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Debug: Check what the API is returning
    console.log('📋 Debug - Transaction Summary API Response:');
    console.log('   Total Earnings:', afterEarningsTransactionSummary.data.data.totalEarnings);
    console.log('   Total Referrals:', afterEarningsTransactionSummary.data.data.totalReferrals);
    console.log('   Total Transactions:', afterEarningsTransactionSummary.data.data.totalTransactions);
    console.log('   Full API Response:', JSON.stringify(afterEarningsTransactionSummary.data.data, null, 2));
    
    // Debug: Check transactions in database directly
    const dbTransactions = await Transaction.find({ user: testUser._id, status: 'completed' });
    console.log('📋 Debug - Database transactions (completed only):');
    dbTransactions.forEach(t => {
      console.log(`   Type: ${t.type}, Amount: ₱${t.amount}, Status: ${t.status}`);
    });
    
    // Manual calculation check
    const manualEarnings = dbTransactions
      .filter(t => t.type === 'earning' || t.type === 'referral')
      .reduce((sum, t) => sum + t.amount, 0);
    console.log('📋 Debug - Manual calculation of totalEarnings:', manualEarnings);
    
    const expectedTotal = 3000 + 2500; // Passive + Referral
    
    console.log('📊 After Adding Earnings:');
    console.log(`   Dashboard Total Payouts Received: ₱${afterEarningsDashboard.data.totalPayoutsReceived}`);
    console.log(`   Transaction History Total Earnings: ₱${afterEarningsTransactionSummary.data.data.totalEarnings}`);
    console.log(`   Expected Total: ₱${expectedTotal}`);
    console.log(`   Dashboard Correct: ${afterEarningsDashboard.data.totalPayoutsReceived === expectedTotal ? '✅' : '❌'}`);
    console.log(`   Transaction History Correct: ${afterEarningsTransactionSummary.data.data.totalEarnings === expectedTotal ? '✅' : '❌'}`);
    console.log(`   Values Synchronized: ${afterEarningsDashboard.data.totalPayoutsReceived === afterEarningsTransactionSummary.data.data.totalEarnings ? '✅' : '❌'}`);
    
    // Step 6: Add withdrawal transaction (should not affect Total Earnings)
    console.log('\n📋 Step 6: Adding withdrawal transaction (₱1,000) - should not affect Total Earnings...');
    
    const withdrawalTransaction = new Transaction({
      user: testUser._id,
      type: 'withdrawal',
      amount: 1000,
      netAmount: 1000,
      description: 'Bonus wallet withdrawal',
      status: 'completed',
      walletType: 'bonus',
      payoutMethod: 'GCash',
      accountDetails: '09123456789'
    });
    await withdrawalTransaction.save();
    
    // Update user and wallet balances (decrease)
    await User.findByIdAndUpdate(testUser._id, { $inc: { bonusWallet: -1000 } });
    await Wallet.findOneAndUpdate(
      { user: testUser._id, walletType: 'bonus' },
      { $inc: { balance: -1000 } }
    );
    
    console.log('✅ Withdrawal transaction added');
    
    // Step 7: Test synchronization after withdrawal
    console.log('\n📋 Step 7: Testing synchronization after withdrawal (Total Earnings should remain unchanged)...');
    
    const afterWithdrawalDashboard = await axios.get('http://localhost:5000/api/v1/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const afterWithdrawalTransactionSummary = await axios.get('http://localhost:5000/api/v1/transactions/summary', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📊 After Withdrawal:');
    console.log(`   Dashboard Total Payouts Received: ₱${afterWithdrawalDashboard.data.totalPayoutsReceived}`);
    console.log(`   Transaction History Total Earnings: ₱${afterWithdrawalTransactionSummary.data.data.totalEarnings}`);
    console.log(`   Expected Total (unchanged): ₱${expectedTotal}`);
    console.log(`   Dashboard Correct: ${afterWithdrawalDashboard.data.totalPayoutsReceived === expectedTotal ? '✅' : '❌'}`);
    console.log(`   Transaction History Correct: ${afterWithdrawalTransactionSummary.data.data.totalEarnings === expectedTotal ? '✅' : '❌'}`);
    console.log(`   Values Synchronized: ${afterWithdrawalDashboard.data.totalPayoutsReceived === afterWithdrawalTransactionSummary.data.data.totalEarnings ? '✅' : '❌'}`);
    
    // Step 8: Final verification
    console.log('\n📋 Step 8: Final Verification Results...');
    
    const finalSyncCheck = afterWithdrawalDashboard.data.totalPayoutsReceived === afterWithdrawalTransactionSummary.data.data.totalEarnings;
    const correctCalculation = afterWithdrawalTransactionSummary.data.data.totalEarnings === expectedTotal;
    
    if (finalSyncCheck && correctCalculation) {
      console.log('🎉 SUCCESS: Dashboard and Transaction History Total Earnings are synchronized!');
      console.log('   ✅ Both show the same value');
      console.log('   ✅ Calculation includes passive earnings + referral commissions');
      console.log('   ✅ Withdrawals do not affect Total Earnings (historical total)');
    } else {
      console.log('❌ FAILED: Synchronization issues detected');
      if (!finalSyncCheck) {
        console.log('   ❌ Dashboard and Transaction History show different values');
      }
      if (!correctCalculation) {
        console.log('   ❌ Total Earnings calculation is incorrect');
      }
    }
    
    // Cleanup
    console.log('\n📋 Cleaning up test data...');
    await Transaction.deleteMany({ user: testUser._id });
    await Wallet.deleteMany({ user: testUser._id });
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  } finally {
    mongoose.connection.close();
  }
}

testEarningsSynchronization();