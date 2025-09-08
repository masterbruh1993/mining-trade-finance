const axios = require('axios');

const testLoginAndAPI = async () => {
  try {
    const baseURL = 'http://localhost:5000';
    
    console.log('=== TESTING LOGIN FOR ALANKO ===');
    
    // First, try to login with alanko credentials
    const loginData = {
      emailOrUsername: 'alanko@test.com',
      password: 'Password123!'
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

      console.log('\n=== TESTING DASHBOARD API WITH VALID TOKEN ===');
      try {
        const dashboardResponse = await axios.get(`${baseURL}/api/v1/dashboard`, { headers });
        console.log('✅ Dashboard API Response:');
        console.log(JSON.stringify(dashboardResponse.data, null, 2));
      } catch (error) {
        console.log('❌ Dashboard API Error:', error.response?.data || error.message);
      }

      console.log('\n=== TESTING WALLET BALANCES API WITH VALID TOKEN ===');
      try {
        const walletResponse = await axios.get(`${baseURL}/api/v1/wallet/balances`, { headers });
        console.log('✅ Wallet Balances API Response:');
        console.log(JSON.stringify(walletResponse.data, null, 2));
      } catch (error) {
        console.log('❌ Wallet Balances API Error:', error.response?.data || error.message);
      }

      console.log('\n=== TESTING PASSIVE WALLET API WITH VALID TOKEN ===');
      try {
        const passiveResponse = await axios.get(`${baseURL}/api/v1/wallet/passive`, { headers });
        console.log('✅ Passive Wallet API Response:');
        console.log(JSON.stringify(passiveResponse.data, null, 2));
      } catch (error) {
        console.log('❌ Passive Wallet API Error:', error.response?.data || error.message);
      }
      
    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.data || loginError.message);
      
      // If login fails, let's check if the user exists and has the right password
      console.log('\n=== CHECKING USER IN DATABASE ===');
      const mongoose = require('mongoose');
      const User = require('./models/User');
      const bcrypt = require('bcryptjs');
      
      await mongoose.connect('mongodb://localhost:27017/1uptrade');
      const user = await User.findOne({ email: 'alanko@test.com' }).select('+password');
      
      if (user) {
        console.log('✅ User found in database');
        console.log('Username:', user.username);
        console.log('Email:', user.email);
        console.log('Password hash:', user.password);
        
        // Check if password matches
        const isMatch = await bcrypt.compare('Password123!', user.password);
        console.log('Password match:', isMatch);
        
        if (!isMatch) {
          console.log('❌ Password does not match. Let\'s update it.');
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('Password123!', salt);
          user.password = hashedPassword;
          await user.save();
          console.log('✅ Password updated. Try login again.');
        }
      } else {
        console.log('❌ User not found in database');
      }
      
      await mongoose.disconnect();
    }

  } catch (error) {
    console.error('General Error:', error.message);
  }
};

testLoginAndAPI();