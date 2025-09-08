const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Withdrawal = require('./models/Withdrawal');
const Transaction = require('./models/Transaction');
const { requestWithdrawal, processWithdrawal, setWithdrawalAsPaid, cancelWithdrawal } = require('./controllers/withdrawalController');

const BASE_URL = 'http://localhost:5000/api/v1';

// Test user credentials
const testUser = {
  email: 'withdrawaltest@example.com',
  password: 'testpass123!'
};

const testUsername = 'withdrawaltest' + Date.now();

const adminUser = {
  email: 'admin@1uptrade.com',
  password: 'admin123!'
};

let userToken = '';
let adminToken = '';
let testUserId = '';
let withdrawalId = '';

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function setupTestUser() {
  try {
    // Find or create test user
    let user = await User.findOne({ email: testUser.email });
    if (!user) {
      user = await User.create({
        username: testUsername,
        email: testUser.email,
        password: testUser.password,
        fullName: 'Test User',
        mobileNumber: '09123456789',
        role: 'user'
      });
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user found');
    }
    
    testUserId = user._id;

    // Ensure user has wallets with sufficient balance
    let passiveWallet = await Wallet.findOne({ user: user._id, walletType: 'passive' });
    if (!passiveWallet) {
      passiveWallet = await Wallet.create({
        user: user._id,
        walletType: 'passive',
        balance: 151500
      });
    } else {
      passiveWallet.balance = 151500;
      await passiveWallet.save();
    }

    let bonusWallet = await Wallet.findOne({ user: user._id, walletType: 'bonus' });
    if (!bonusWallet) {
      bonusWallet = await Wallet.create({
        user: user._id,
        walletType: 'bonus',
        balance: 10000
      });
    } else {
      bonusWallet.balance = 10000;
      await bonusWallet.save();
    }

    console.log('✅ Test wallets setup - Passive: ₱151,500, Bonus: ₱10,000');
  } catch (error) {
    console.error('❌ Setup test user failed:', error.message);
    throw error;
  }
}

async function loginUser() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: testUser.email,
      password: testUser.password
    });
    userToken = response.data.token;
    console.log('✅ User logged in successfully');
  } catch (error) {
    console.error('❌ User login failed:', error.response?.data?.error || error.message);
    throw error;
  }
}

async function loginAdmin() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: adminUser.email,
      password: adminUser.password
    });
    adminToken = response.data.token;
    console.log('✅ Admin logged in successfully');
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data?.error || error.message);
    throw error;
  }
}

async function checkWalletBalance(walletType, expectedBalance) {
  try {
    const response = await axios.get(`${BASE_URL}/wallet/balances`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    const balances = response.data.data;
    const walletBalance = walletType === 'passive' ? balances.passiveWallet : 
                         walletType === 'bonus' ? balances.bonusWallet :
                         walletType === 'credit' ? balances.creditWallet : 0;
    const wallet = { balance: walletBalance };
    if (wallet) {
      console.log(`💰 ${walletType.toUpperCase()} Wallet Balance: ₱${wallet.balance.toLocaleString()}`);
      if (expectedBalance !== undefined) {
        const isCorrect = Math.abs(wallet.balance - expectedBalance) < 0.01;
        console.log(isCorrect ? '✅ Balance is correct' : `❌ Expected ₱${expectedBalance.toLocaleString()}, got ₱${wallet.balance.toLocaleString()}`);
        return isCorrect;
      }
      return wallet.balance;
    } else {
      console.error(`❌ ${walletType} wallet not found`);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to check wallet balance:', error.response?.data?.error || error.message);
    return false;
  }
}

async function submitWithdrawal(amount, walletType) {
  try {
    console.log(`\n🔄 Submitting withdrawal: ₱${amount.toLocaleString()} from ${walletType} wallet`);
    
    const response = await axios.post(`${BASE_URL}/withdrawals`, {
      amount: amount,
      walletType: walletType,
      payoutMethod: 'GCash',
      accountDetails: '09123456789'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    withdrawalId = response.data.data._id;
    console.log('✅ Withdrawal request submitted successfully');
    console.log(`📋 Withdrawal ID: ${withdrawalId}`);
    console.log(`📊 Status: ${response.data.data.status}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Withdrawal submission failed:', error.response?.data?.error || error.message);
    throw error;
  }
}

async function checkWithdrawalStatus() {
  try {
    const response = await axios.get(`${BASE_URL}/withdrawals`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    const withdrawal = response.data.data.find(w => w._id === withdrawalId);
    if (withdrawal) {
      console.log(`📊 Withdrawal Status: ${withdrawal.status}`);
      console.log(`💵 Amount: ₱${withdrawal.amount.toLocaleString()}`);
      console.log(`🏦 Wallet Type: ${withdrawal.walletType}`);
      return withdrawal;
    } else {
      console.error('❌ Withdrawal not found in history');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to check withdrawal status:', error.response?.data?.error || error.message);
    return null;
  }
}

async function adminApproveWithdrawal() {
  try {
    console.log(`\n👨‍💼 Admin approving withdrawal: ${withdrawalId}`);
    
    const response = await axios.put(`${BASE_URL}/withdrawals/${withdrawalId}/set-paid`, {
      remarks: 'Approved by admin - Test'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Withdrawal approved successfully');
    console.log(`📊 New Status: ${response.data.data.status}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Admin approval failed:', error.response?.data?.error || error.message);
    throw error;
  }
}

async function adminCancelWithdrawal() {
  try {
    console.log(`\n👨‍💼 Admin cancelling withdrawal: ${withdrawalId}`);
    
    const response = await axios.put(`${BASE_URL}/withdrawals/${withdrawalId}/cancel`, {
      remarks: 'Cancelled by admin - Test'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Withdrawal cancelled successfully');
    console.log(`📊 New Status: ${response.data.data.status}`);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Admin cancellation failed:', error.response?.data?.error || error.message);
    throw error;
  }
}

async function testApprovalFlow() {
  console.log('\n🧪 TESTING APPROVAL FLOW');
  console.log('=' .repeat(50));
  
  // Check initial balance
  console.log('\n📊 Initial Balance Check:');
  await checkWalletBalance('passive', 151500);
  
  // Submit withdrawal
  await submitWithdrawal(5000, 'passive');
  
  // Check balance after withdrawal (should be deducted immediately)
  console.log('\n📊 Balance After Withdrawal Request:');
  await checkWalletBalance('passive', 146500);
  
  // Check withdrawal status (should be PENDING)
  console.log('\n📋 Withdrawal Status Check:');
  await checkWithdrawalStatus();
  
  // Admin approves
  await adminApproveWithdrawal();
  
  // Check final balance (should remain the same)
  console.log('\n📊 Final Balance After Approval:');
  await checkWalletBalance('passive', 146500);
  
  // Check final withdrawal status (should be COMPLETED)
  console.log('\n📋 Final Withdrawal Status:');
  const finalWithdrawal = await checkWithdrawalStatus();
  
  if (finalWithdrawal && finalWithdrawal.status === 'COMPLETED') {
    console.log('✅ APPROVAL FLOW TEST PASSED');
  } else {
    console.log('❌ APPROVAL FLOW TEST FAILED');
  }
}

async function testCancellationFlow() {
  console.log('\n🧪 TESTING CANCELLATION FLOW');
  console.log('=' .repeat(50));
  
  // Check initial balance
  console.log('\n📊 Initial Balance Check:');
  await checkWalletBalance('bonus', 10000);
  
  // Submit withdrawal
  await submitWithdrawal(2000, 'bonus');
  
  // Check balance after withdrawal (should be deducted immediately)
  console.log('\n📊 Balance After Withdrawal Request:');
  await checkWalletBalance('bonus', 8000);
  
  // Check withdrawal status (should be PENDING)
  console.log('\n📋 Withdrawal Status Check:');
  await checkWithdrawalStatus();
  
  // Admin cancels
  await adminCancelWithdrawal();
  
  // Check final balance (should be refunded)
  console.log('\n📊 Final Balance After Cancellation:');
  await checkWalletBalance('bonus', 10000);
  
  // Check final withdrawal status (should be CANCELLED)
  console.log('\n📋 Final Withdrawal Status:');
  const finalWithdrawal = await checkWithdrawalStatus();
  
  if (finalWithdrawal && finalWithdrawal.status === 'CANCELLED') {
    console.log('✅ CANCELLATION FLOW TEST PASSED');
  } else {
    console.log('❌ CANCELLATION FLOW TEST FAILED');
  }
}

async function runTests() {
  try {
    await connectDB();
    await setupTestUser();
    await loginUser();
    await loginAdmin();
    
    // Test approval flow
    await testApprovalFlow();
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test cancellation flow
    await testCancellationFlow();
    
    console.log('\n🎉 ALL TESTS COMPLETED');
    
  } catch (error) {
    console.error('\n💥 TEST FAILED:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the tests
runTests();