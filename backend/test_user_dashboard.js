const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api/v1';

// Test user credentials
const testUser = {
  emailOrUsername: 'testuser@example.com',
  password: 'testpass123!'
};

async function testUserDashboard() {
  try {
    console.log('=== TESTING USER DASHBOARD ===');
    
    // Try to login with existing test user
    console.log('\n1. Attempting to login as test user...');
    let userToken;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
      userToken = loginResponse.data.token;
      console.log('✅ Test user login successful');
    } catch (loginError) {
      console.log('❌ Test user login failed, creating new user...');
      
      // Create a new test user
      try {
        const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
          username: 'testuser',
          email: 'testuser@example.com',
          password: 'testpass123!',
          fullName: 'Test User',
          mobileNumber: '09123456789'
        });
        
        userToken = registerResponse.data.token;
        console.log('✅ Test user created and logged in');
      } catch (registerError) {
        console.error('❌ Failed to create test user:', registerError.response?.data?.message || registerError.message);
        return;
      }
    }
    
    // Test user dashboard endpoint
    console.log('\n2. Testing user dashboard endpoint...');
    const dashboardResponse = await axios.get(`${BASE_URL}/dashboard`, {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    });
    
    console.log('✅ User dashboard API successful');
    console.log('Dashboard data:', JSON.stringify(dashboardResponse.data, null, 2));
    
    // Test wallet balances endpoint
    console.log('\n3. Testing wallet balances endpoint...');
    const walletResponse = await axios.get(`${BASE_URL}/wallets/balances`, {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    });
    
    console.log('✅ Wallet balances API successful');
    console.log('Wallet balances:', JSON.stringify(walletResponse.data, null, 2));
    
    // Test investments endpoint
    console.log('\n4. Testing investments endpoint...');
    const investmentsResponse = await axios.get(`${BASE_URL}/investments`, {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    });
    
    console.log('✅ Investments API successful');
    console.log('Investments count:', investmentsResponse.data.count || 0);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Full error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testUserDashboard();