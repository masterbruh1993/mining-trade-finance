const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');

const testTestUserAPI = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/1uptrade');
    console.log('Connected to MongoDB');

    // First, update testuser to have some passive wallet balance
    const testUser = await User.findOne({ username: 'testuser' });
    if (testUser) {
      console.log('=== UPDATING TESTUSER PASSIVE WALLET ===');
      testUser.passiveWallet = 91500;
      await testUser.save();
      console.log('✅ Updated testuser passive wallet to ₱91,500');
    }

    await mongoose.disconnect();

    const baseURL = 'http://localhost:5000';
    
    console.log('\n=== TESTING LOGIN FOR TESTUSER ===');
    
    // Try to login with testuser credentials
    const loginData = {
      emailOrUsername: 'test@example.com',
      password: 'password123'
    };
    
    try {
      const loginResponse = await axios.post(`${baseURL}/api/v1/auth/login`, loginData);
      console.log('✅ Login successful!');
      
      const token = loginResponse.data.token;
      console.log('Token received:', token.substring(0, 50) + '...');
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('\n=== TESTING DASHBOARD API ===');
      try {
        const dashboardResponse = await axios.get(`${baseURL}/api/v1/dashboard`, { headers });
        console.log('✅ Dashboard API Response:');
        console.log(JSON.stringify(dashboardResponse.data, null, 2));
      } catch (error) {
        console.log('❌ Dashboard API Error:', error.response?.data || error.message);
      }

      console.log('\n=== TESTING WALLET BALANCES API ===');
      try {
        const walletResponse = await axios.get(`${baseURL}/api/v1/wallet/balances`, { headers });
        console.log('✅ Wallet Balances API Response:');
        console.log(JSON.stringify(walletResponse.data, null, 2));
      } catch (error) {
        console.log('❌ Wallet Balances API Error:', error.response?.data || error.message);
      }

      console.log('\n=== TESTING PASSIVE WALLET API ===');
      try {
        const passiveResponse = await axios.get(`${baseURL}/api/v1/wallet/passive`, { headers });
        console.log('✅ Passive Wallet API Response:');
        console.log(JSON.stringify(passiveResponse.data, null, 2));
      } catch (error) {
        console.log('❌ Passive Wallet API Error:', error.response?.data || error.message);
      }
      
    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.data || loginError.message);
    }

  } catch (error) {
    console.error('General Error:', error.message);
  }
};

testTestUserAPI();