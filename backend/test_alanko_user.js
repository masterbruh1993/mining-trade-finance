const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api/v1';

async function testAlankoUser() {
  try {
    console.log('=== TESTING ALANKO USER ===');
    
    // Try to login with alanko (from previous test files)
    console.log('\n1. Attempting to login as alanko...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: 'alanko',
      password: 'Password123!'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Alanko login successful');
      const token = loginResponse.data.token;
      console.log('User role:', loginResponse.data.data.role);
      
      // Test user dashboard
      console.log('\n2. Testing user dashboard...');
      const dashboardResponse = await axios.get(`${BASE_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ User dashboard API successful');
      console.log('Dashboard data:', JSON.stringify(dashboardResponse.data.data, null, 2));
      
      // Test wallet balances
      console.log('\n3. Testing wallet balances...');
      const walletResponse = await axios.get(`${BASE_URL}/wallets/balances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Wallet balances API successful');
      console.log('Wallet data:', JSON.stringify(walletResponse.data, null, 2));
      
    } else {
      console.log('❌ Alanko login failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Full error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAlankoUser();