const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api/v1';

async function testFrontendAdminLogin() {
  try {
    console.log('=== TESTING FRONTEND ADMIN LOGIN FLOW ===');
    
    // Test the exact same login flow that frontend uses
    console.log('\n1. Testing admin login (frontend flow)...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: 'admin@1uptrade.com',
      password: 'admin123!'
    });
    
    console.log('Login response status:', loginResponse.status);
    console.log('Login response data:', JSON.stringify(loginResponse.data, null, 2));
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✅ Login successful');
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);
    
    if (user) {
      console.log('User role:', user.role);
      console.log('User email:', user.email);
      console.log('User ID:', user._id);
    }
    
    // Simulate localStorage token storage (like frontend does)
    console.log('\n2. Testing admin wallet with token...');
    
    try {
      const walletResponse = await axios.get(`${BASE_URL}/dashboard/admin/wallet`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('✅ Admin wallet API successful');
      console.log('Wallet balance:', walletResponse.data.data.balance);
      console.log('Transactions count:', walletResponse.data.data.transactions.length);
      
    } catch (walletError) {
      console.log('❌ Admin wallet API failed');
      console.log('Error status:', walletError.response?.status);
      console.log('Error message:', walletError.response?.data?.message);
      console.log('Error details:', walletError.response?.data);
    }
    
    // Test if the user role is properly set
    console.log('\n3. Checking user role authorization...');
    
    if (user && user.role !== 'admin') {
      console.log('❌ User role is not admin:', user.role);
      console.log('This explains why admin wallet access fails!');
    } else if (user && user.role === 'admin') {
      console.log('✅ User has admin role');
    } else {
      console.log('⚠️ Cannot determine user role');
    }
    
    // Test admin dashboard access
    console.log('\n4. Testing admin dashboard access...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/admin`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('✅ Admin dashboard API successful');
      
    } catch (dashboardError) {
      console.log('❌ Admin dashboard API failed');
      console.log('Dashboard error:', dashboardError.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFrontendAdminLogin();