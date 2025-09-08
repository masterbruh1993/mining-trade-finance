const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Payment = require('./models/Payment');
const axios = require('axios');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const API_BASE = 'http://localhost:5000/api/v1';

async function testTransactionFixes() {
  try {
    console.log('🧪 Testing Transaction Fixes...');
    
    // Find test user
    const testUser = await User.findOne({ email: 'test1@gmail.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('👤 Test User:', testUser.email);
    console.log('💰 Initial Balances:');
    console.log('  Credit Wallet:', testUser.creditWallet || 0);
    console.log('  Passive Wallet:', testUser.passiveWallet || 0);
    console.log('  Bonus Wallet:', testUser.bonusWallet || 0);
    
    // Test 1: Create a deposit transaction
    console.log('\n📥 Test 1: Creating Deposit Transaction...');
    const depositTransaction = new Transaction({
      user: testUser._id,
      type: 'deposit',
      amount: 5000,
      netAmount: 5000,
      walletType: 'credit',
      status: 'completed',
      description: 'Test Deposit - ₱5,000'
    });
    await depositTransaction.save();
    console.log('✅ Deposit transaction created:', depositTransaction._id);
    
    // Test 2: Create an earning transaction
    console.log('\n💎 Test 2: Creating Earning Transaction...');
    const earningTransaction = new Transaction({
      user: testUser._id,
      type: 'earning',
      amount: 1500,
      netAmount: 1500,
      walletType: 'passive',
      status: 'completed',
      description: 'Test Payout - ₱1,500'
    });
    await earningTransaction.save();
    console.log('✅ Earning transaction created:', earningTransaction._id);
    
    // Test 3: Create a referral transaction
    console.log('\n🔄 Test 3: Creating Referral Transaction...');
    const referralTransaction = new Transaction({
      user: testUser._id,
      type: 'referral',
      amount: 500,
      netAmount: 500,
      walletType: 'bonus',
      status: 'completed',
      description: 'Test Referral Bonus - ₱500'
    });
    await referralTransaction.save();
    console.log('✅ Referral transaction created:', referralTransaction._id);
    
    // Test 4: Create a withdrawal transaction
    console.log('\n💸 Test 4: Creating Withdrawal Transaction...');
    const withdrawalTransaction = new Transaction({
      user: testUser._id,
      type: 'withdrawal',
      amount: 2000,
      netAmount: 2000,
      walletType: 'passive',
      status: 'completed',
      description: 'Test Withdrawal - ₱2,000',
      payoutMethod: 'GCash',
      accountDetails: '09123456789'
    });
    await withdrawalTransaction.save();
    console.log('✅ Withdrawal transaction created:', withdrawalTransaction._id);
    
    // Test 5: Create an activation transaction
    console.log('\n📈 Test 5: Creating Activation Transaction...');
    const activationTransaction = new Transaction({
      user: testUser._id,
      type: 'activation',
      amount: 10000,
      netAmount: 10000,
      walletType: 'credit',
      status: 'completed',
      description: 'Test Contract Activation - ₱10,000'
    });
    await activationTransaction.save();
    console.log('✅ Activation transaction created:', activationTransaction._id);
    
    // Test Dashboard API
    console.log('\n🏠 Testing Dashboard API...');
    try {
      // Login to get token
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: 'test1@gmail.com',
        password: 'password123'
      });
      
      const token = loginRes.data.token;
      
      // Get dashboard data
      const dashboardRes = await axios.get(`${API_BASE}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📊 Dashboard Response:');
      console.log('  Total Payouts Received:', dashboardRes.data.totalPayoutsReceived);
      console.log('  Encashment Total:', dashboardRes.data.encashmentTotal);
      console.log('  Credit Wallet:', dashboardRes.data.balance);
      console.log('  Passive Wallet:', dashboardRes.data.passiveWallet);
      console.log('  Bonus Wallet:', dashboardRes.data.bonusWallet);
      
      // Verify calculations
      const expectedPayouts = 1500 + 500; // earning + referral
      const expectedEncashment = 2000; // withdrawal
      
      console.log('\n🔍 Verification:');
      console.log('  Expected Total Payouts Received:', expectedPayouts);
      console.log('  Actual Total Payouts Received:', dashboardRes.data.totalPayoutsReceived);
      console.log('  ✅ Payouts Match:', dashboardRes.data.totalPayoutsReceived >= expectedPayouts ? 'YES' : 'NO');
      
      console.log('  Expected Encashment Total:', expectedEncashment);
      console.log('  Actual Encashment Total:', dashboardRes.data.encashmentTotal);
      console.log('  ✅ Encashment Match:', dashboardRes.data.encashmentTotal >= expectedEncashment ? 'YES' : 'NO');
      
    } catch (apiError) {
      console.log('❌ API Test failed:', apiError.response?.data?.message || apiError.message);
    }
    
    // Test Transaction Summary API
    console.log('\n📋 Testing Transaction Summary API...');
    try {
      const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: 'test1@gmail.com',
        password: 'password123'
      });
      
      const token = loginRes.data.token;
      
      const summaryRes = await axios.get(`${API_BASE}/transactions/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📈 Transaction Summary:');
      console.log('  Total Transactions:', summaryRes.data.data.totalTransactions);
      console.log('  Total Deposits:', summaryRes.data.data.totalDeposits);
      console.log('  Total Withdrawals:', summaryRes.data.data.totalWithdrawals);
      console.log('  Total Earnings:', summaryRes.data.data.totalEarnings);
      console.log('  Total Referrals:', summaryRes.data.data.totalReferrals);
      console.log('  Total Activations:', summaryRes.data.data.totalActivations);
      
    } catch (apiError) {
      console.log('❌ Transaction Summary API failed:', apiError.response?.data?.message || apiError.message);
    }
    
    console.log('\n🎉 Transaction fixes test completed!');
    console.log('\n📝 Manual Testing Required:');
    console.log('1. Check frontend transaction history for correct signs and colors:');
    console.log('   - Deposits: +₱5,000 (GREEN)');
    console.log('   - Earnings: +₱1,500 (GREEN)');
    console.log('   - Referrals: +₱500 (GREEN)');
    console.log('   - Withdrawals: -₱2,000 (RED)');
    console.log('   - Activations: -₱10,000 (RED)');
    console.log('2. Verify dashboard summary cards show correct totals');
    console.log('3. Check that colors match: Green #00C853, Red #D50000');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testTransactionFixes();