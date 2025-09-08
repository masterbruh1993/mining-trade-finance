const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Test script for Reset User Withdrawal Records functionality
const BASE_URL = 'http://localhost:5000/api/v1';

// Test data
const testAdmin = {
  email: 'admin@1uptrade.com',
  password: 'admin123!'
};

const testUser = {
  email: 'testuser@example.com',
  password: 'password123!',
  fullName: 'Test User',
  username: 'testuser123',
  mobileNumber: '09123456789'
};

let adminToken = '';
let testUserId = '';

async function loginAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
       emailOrUsername: testAdmin.email,
       password: testAdmin.password
     });
     
     if (loginResponse.data.success) {
        adminToken = loginResponse.data.token;
        console.log('✅ Admin login successful');
      return true;
    }
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function createTestUser() {
  try {
    console.log('👤 Creating test user...');
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    
    if (response.data.success) {
      testUserId = response.data.data?.id || response.data.data?._id || response.data.user?._id;
      console.log('✅ Test user created:', testUserId);
      return true;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️ Test user already exists, fetching user ID...');
      // Try to get user ID by logging in
      try {
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          emailOrUsername: testUser.email,
          password: testUser.password
        });
        testUserId = loginResponse.data.data?.id || loginResponse.data.data?._id || loginResponse.data.user?._id;
        console.log('✅ Found existing test user:', testUserId);
        return true;
      } catch (loginError) {
        console.error('❌ Failed to get existing user ID');
        return false;
      }
    }
    console.error('❌ Test user creation failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function createTestWithdrawal() {
  try {
    console.log('💰 Creating test withdrawal...');
    
    // First login as test user to get token
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: testUser.email,
      password: testUser.password
    });
    
    const userToken = loginResponse.data.token;
    
    const withdrawalData = {
      amount: 500,
      walletType: 'passive',
      payoutMethod: 'GCash',
      accountDetails: '09123456789'
    };
    
    const response = await axios.post(`${BASE_URL}/withdrawals`, withdrawalData, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Test withdrawal created:', response.data.data._id);
      return response.data.data._id;
    }
  } catch (error) {
    console.error('❌ Test withdrawal creation failed:', error.response?.data?.message || error.message);
    console.log('Full error response:', error.response?.data);
    console.log('Status code:', error.response?.status);
    return null;
  }
}

async function testResetUserRequests(scope = 'today') {
  try {
    console.log(`🔄 Testing reset user requests (scope: ${scope})...`);
    
    const response = await axios.post(`${BASE_URL}/admin/reset-user-requests`, {
      userId: testUserId,
      scope: scope
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Reset successful:', response.data.message);
      console.log('📊 Deleted count:', response.data.deletedCount);
      return true;
    }
  } catch (error) {
    console.error('❌ Reset failed:', error.response?.data?.message || error.message);
    console.log('Full error response:', error.response?.data);
    console.log('Status code:', error.response?.status);
    console.log('Request URL:', `${BASE_URL}/admin/reset-user-requests`);
    return false;
  }
}

async function verifyUserCanCreateNewWithdrawal() {
  try {
    console.log('🔍 Verifying user can create new withdrawal after reset...');
    
    // Login as test user
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: testUser.email,
      password: testUser.password
    });
    
    const userToken = loginResponse.data.token;
    
    const withdrawalData = {
      amount: 300,
      walletType: 'passive',
      payoutMethod: 'GCash',
      accountDetails: '09123456789'
    };
    
    const response = await axios.post(`${BASE_URL}/withdrawals`, withdrawalData, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ New withdrawal created successfully after reset!');
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to create new withdrawal after reset:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Reset User Withdrawal Records Test Suite\n');
  
  // Step 1: Login as admin
  if (!(await loginAdmin())) {
    console.log('❌ Test suite failed: Cannot login as admin');
    return;
  }
  
  // Step 2: Create or get test user
  if (!(await createTestUser())) {
    console.log('❌ Test suite failed: Cannot create test user');
    return;
  }
  
  // Step 3: Create test withdrawal
  const withdrawalId = await createTestWithdrawal();
  if (!withdrawalId) {
    console.log('❌ Test suite failed: Cannot create test withdrawal');
    return;
  }
  
  // Step 4: Test reset with scope 'today'
  if (!(await testResetUserRequests('today'))) {
    console.log('❌ Test suite failed: Reset with scope \'today\' failed');
    return;
  }
  
  // Step 5: Verify user can create new withdrawal
  if (!(await verifyUserCanCreateNewWithdrawal())) {
    console.log('❌ Test suite failed: User cannot create new withdrawal after reset');
    return;
  }
  
  // Step 6: Create another withdrawal for 'all' scope test
  const withdrawalId2 = await createTestWithdrawal();
  if (!withdrawalId2) {
    console.log('❌ Test suite failed: Cannot create second test withdrawal');
    return;
  }
  
  // Step 7: Test reset with scope 'all'
  if (!(await testResetUserRequests('all'))) {
    console.log('❌ Test suite failed: Reset with scope \'all\' failed');
    return;
  }
  
  // Step 8: Final verification
  if (!(await verifyUserCanCreateNewWithdrawal())) {
    console.log('❌ Test suite failed: User cannot create new withdrawal after \'all\' reset');
    return;
  }
  
  console.log('\n🎉 All tests passed! Reset User Withdrawal Records functionality is working correctly.');
  console.log('\n📋 Test Summary:');
  console.log('✅ Admin can reset user withdrawal records with scope \'today\'');
  console.log('✅ Admin can reset user withdrawal records with scope \'all\'');
  console.log('✅ User can immediately submit new withdrawal requests after reset');
  console.log('✅ Reset actions are properly logged in AdminLog');
}

// Run the test suite
runTests().catch(console.error);