const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api/v1';

// Test user credentials
const testUser = {
  emailOrUsername: 'withdrawaltest@example.com',
  password: 'testpass123!'
};

// Admin credentials
const adminUser = {
  emailOrUsername: 'admin@1uptrade.com',
  password: 'admin123!'
};

let userToken = '';
let adminToken = '';
let withdrawalId = '';

async function loginUser() {
  try {
    console.log('\n🔐 Logging in test user...');
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
    userToken = response.data.token;
    console.log('✅ User login successful');
    return response.data.user;
  } catch (error) {
    console.error('❌ User login failed:', error.response?.data?.error || error.message);
    throw error;
  }
}

async function loginAdmin() {
  try {
    console.log('\n🔐 Logging in admin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, adminUser);
    adminToken = response.data.token;
    console.log('✅ Admin login successful');
    return response.data.user;
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data?.error || error.message);
    throw error;
  }
}

async function submitWithdrawalRequest() {
  try {
    console.log('\n💰 Submitting withdrawal request...');
    console.log('📋 Request Details:');
    console.log('   Amount: ₱8,500');
    console.log('   Method: PayMaya');
    console.log('   Account: 09123456789');
    
    const response = await axios.post(`${BASE_URL}/withdrawals`, {
      walletType: 'passive',
      amount: 8500,
      payoutMethod: 'Maya',
      accountDetails: '09123456789'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    withdrawalId = response.data.data._id;
    console.log('✅ Withdrawal request submitted successfully');
    console.log(`📝 Withdrawal ID: ${withdrawalId}`);
    return response.data.data;
  } catch (error) {
    console.error('❌ Withdrawal request failed:', error.response?.data?.error || error.message);
    throw error;
  }
}

async function checkAdminPanel() {
  try {
    console.log('\n👨‍💼 Checking admin panel for withdrawal details...');
    const response = await axios.get(`${BASE_URL}/withdrawals/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const withdrawal = response.data.data.find(w => w._id === withdrawalId);
    if (!withdrawal) {
      throw new Error('Withdrawal not found in admin panel');
    }
    
    console.log('✅ Withdrawal found in admin panel:');
    console.log(`   User: ${withdrawal.user?.fullName || withdrawal.user?.email}`);
    console.log(`   Amount: ₱${withdrawal.amount.toLocaleString()}`);
    console.log(`   Method of Payment: ${withdrawal.paymentMethod}`);
    console.log(`   Account Details: ${withdrawal.paymentDetails?.accountNumber}`);
    console.log(`   Status: ${withdrawal.status}`);
    
    // Verify required fields are present
    if (!withdrawal.paymentMethod) {
      throw new Error('❌ Payment method missing in admin panel');
    }
    
    if (!withdrawal.paymentDetails?.accountNumber) {
      throw new Error('❌ Account details missing in admin panel');
    }
    
    console.log('✅ All required payout information is visible to admin');
    return withdrawal;
  } catch (error) {
    console.error('❌ Admin panel check failed:', error.response?.data?.error || error.message);
    throw error;
  }
}

async function approveWithdrawal() {
  try {
    console.log('\n✅ Admin approving withdrawal...');
    const response = await axios.put(`${BASE_URL}/withdrawals/${withdrawalId}/set-paid`, {
      remarks: 'Payment sent via PayMaya to 09123456789'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Withdrawal approved and marked as paid');
    console.log(`📝 Status: ${response.data.data.status}`);
    return response.data.data;
  } catch (error) {
    console.error('❌ Withdrawal approval failed:', error.response?.data?.error || error.message);
    throw error;
  }
}

async function testCancellationFlow() {
  try {
    console.log('\n🔄 Testing cancellation flow with new withdrawal...');
    
    // Submit another withdrawal for cancellation test
    const cancelResponse = await axios.post(`${BASE_URL}/withdrawals`, {
      walletType: 'bonus',
      amount: 5000,
      payoutMethod: 'GCash',
      accountDetails: '09987654321'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    const cancelWithdrawalId = cancelResponse.data.data._id;
    console.log(`📝 New withdrawal for cancellation: ${cancelWithdrawalId}`);
    
    // Check admin panel shows the new withdrawal
    const adminResponse = await axios.get(`${BASE_URL}/withdrawals/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const cancelWithdrawal = adminResponse.data.data.find(w => w._id === cancelWithdrawalId);
    console.log('✅ Cancellation test withdrawal visible in admin panel:');
    console.log(`   Method: ${cancelWithdrawal.paymentMethod}`);
    console.log(`   Account: ${cancelWithdrawal.paymentDetails?.accountNumber}`);
    
    // Cancel the withdrawal
    await axios.put(`${BASE_URL}/withdrawals/${cancelWithdrawalId}/cancel`, {
      remarks: 'Cancelled by admin for testing'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Withdrawal cancelled successfully');
  } catch (error) {
    console.error('❌ Cancellation test failed:', error.response?.data?.error || error.message);
    throw error;
  }
}

async function runTest() {
  try {
    console.log('🚀 Starting Payout Method & Account Details Test');
    console.log('=' .repeat(60));
    
    // Login users
    await loginUser();
    await loginAdmin();
    
    // Submit withdrawal request
    await submitWithdrawalRequest();
    
    // Check admin panel visibility
    await checkAdminPanel();
    
    // Approve withdrawal
    await approveWithdrawal();
    
    // Test cancellation flow
    await testCancellationFlow();
    
    console.log('\n🎉 All tests passed!');
    console.log('✅ Admin can see payout method and account details');
    console.log('✅ Data flows correctly from User → DB → Admin Panel');
    console.log('✅ Approval and cancellation work correctly');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Connect to MongoDB and run test
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('📊 Connected to MongoDB');
    return runTest();
  })
  .then(() => {
    console.log('\n🏁 Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  });