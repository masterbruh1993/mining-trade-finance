const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api/v1';

async function testAdminWalletDebug() {
  try {
    console.log('=== DEBUGGING ADMIN WALLET ISSUE ===');
    
    // Login first
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: 'admin@1uptrade.com',
      password: 'admin123!'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ Login successful');
    console.log('Full login response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (user) {
      console.log('User role:', user.role);
      console.log('User ID:', user._id);
    } else {
      console.log('⚠️ User data not found in response');
    }
    
    if (token) {
      console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️ Token not found in response');
      return;
    }
    
    // Test admin wallet endpoint with detailed error handling
    console.log('\n2. Testing admin wallet endpoint...');
    try {
      const walletResponse = await axios.get(`${BASE_URL}/dashboard/admin/wallet`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Admin wallet API successful');
      console.log('Response status:', walletResponse.status);
      console.log('Response data:', JSON.stringify(walletResponse.data, null, 2));
      
    } catch (walletError) {
      console.log('❌ Admin wallet API failed');
      console.log('Error status:', walletError.response?.status);
      console.log('Error message:', walletError.response?.data?.message);
      console.log('Full error response:', JSON.stringify(walletError.response?.data, null, 2));
      
      // Check if it's an auth issue
      if (walletError.response?.status === 401) {
        console.log('🔍 Authentication issue detected');
      } else if (walletError.response?.status === 403) {
        console.log('🔍 Authorization issue detected - user may not have admin role');
      } else if (walletError.response?.status === 500) {
        console.log('🔍 Server error - check backend logs');
      }
    }
    
    // Test if user has proper admin access
    console.log('\n3. Testing admin dashboard access...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Admin dashboard API successful');
      console.log('Dashboard response status:', dashboardResponse.status);
      
    } catch (dashboardError) {
      console.log('❌ Admin dashboard API failed');
      console.log('Dashboard error status:', dashboardError.response?.status);
      console.log('Dashboard error message:', dashboardError.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    if (error.response?.data) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAdminWalletDebug();