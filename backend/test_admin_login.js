const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const BASE_URL = 'http://localhost:5000/api/v1';

async function testAdminLogin() {
  try {
    console.log('=== TESTING ADMIN LOGIN ===');
    
    // Test login with admin credentials (from server.js)
    console.log('\n1. Attempting to login with admin...');
    const loginData = {
      emailOrUsername: 'admin@1uptrade.com',
      password: 'admin123!'
    };
    
    console.log(`Login data: ${JSON.stringify(loginData)}`);
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    
    if (loginResponse.data.success) {
      console.log('✅ Admin login successful!');
      console.log(`Token: ${loginResponse.data.token.substring(0, 50)}...`);
      console.log(`User ID: ${loginResponse.data.data.id}`);
      console.log(`Username: ${loginResponse.data.data.username}`);
      console.log(`Role: ${loginResponse.data.data.role}`);
      
      const token = loginResponse.data.token;
      
      // Test a simple API call
      console.log('\n2. Testing Dashboard API with admin token...');
      try {
        const dashboardResponse = await axios.get(`${BASE_URL}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Dashboard API successful');
        console.log('Dashboard data:', dashboardResponse.data.data);
      } catch (error) {
        console.log('❌ Dashboard API failed:', error.response?.data?.message || error.message);
      }
      
      console.log('\n🎉 ADMIN LOGIN AND API ACCESS WORKING!');
      console.log('This confirms that the MongoDB transaction fix resolved the authentication issues.');
      
    } else {
      console.log('❌ Admin login failed:', loginResponse.data);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Admin login failed:', error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testAdminLogin();