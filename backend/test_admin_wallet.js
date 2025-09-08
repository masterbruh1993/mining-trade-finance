const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api/v1';

async function testAdminWallet() {
  try {
    console.log('=== TESTING ADMIN WALLET API ===');
    
    // Login first
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: 'admin@1uptrade.com',
      password: 'admin123!'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test admin wallet endpoint
    console.log('\n2. Testing admin wallet endpoint...');
    const walletResponse = await axios.get(`${BASE_URL}/dashboard/admin/wallet`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Admin wallet API successful');
    console.log('Wallet data:', JSON.stringify(walletResponse.data, null, 2));
    
    // Test admin dashboard endpoint
    console.log('\n3. Testing admin dashboard endpoint...');
    const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/admin`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Admin dashboard API successful');
    console.log('Dashboard data keys:', Object.keys(dashboardResponse.data.data || {}));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Full error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAdminWallet();