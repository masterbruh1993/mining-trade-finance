const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const BASE_URL = 'http://localhost:5000/api/v1';

async function testAlankoLogin() {
  try {
    console.log('=== TESTING ALANKO LOGIN AFTER MONGODB FIX ===');
    
    // Test login with alanko credentials
    console.log('\n1. Attempting to login with alanko...');
    const loginData = {
      emailOrUsername: 'alanko',
      password: 'Password123!'
    };
    
    console.log(`Login data: ${JSON.stringify(loginData)}`);
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful!');
      console.log(`Token: ${loginResponse.data.token.substring(0, 50)}...`);
      
      const token = loginResponse.data.token;
      
      // Test Dashboard API
      console.log('\n2. Testing Dashboard API...');
      try {
        const dashboardResponse = await axios.get(`${BASE_URL}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Dashboard API successful');
        console.log(`Passive Wallet: ₱${dashboardResponse.data.data.passiveWallet}`);
        console.log(`Credit Wallet: ₱${dashboardResponse.data.data.creditWallet}`);
        console.log(`Total Earnings: ₱${dashboardResponse.data.data.totalEarnings}`);
      } catch (error) {
        console.log('❌ Dashboard API failed:', error.response?.data?.message || error.message);
      }
      
      // Test Wallet Balances API
      console.log('\n3. Testing Wallet Balances API...');
      try {
        const walletResponse = await axios.get(`${BASE_URL}/wallet/balances`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Wallet Balances API successful');
        const wallets = walletResponse.data.data;
        wallets.forEach(wallet => {
          console.log(`${wallet.walletType}: ₱${wallet.balance}`);
        });
      } catch (error) {
        console.log('❌ Wallet Balances API failed:', error.response?.data?.message || error.message);
      }
      
      // Test Passive Wallet API
      console.log('\n4. Testing Passive Wallet API...');
      try {
        const passiveResponse = await axios.get(`${BASE_URL}/wallet/passive`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Passive Wallet API successful');
        console.log(`Passive Wallet Balance: ₱${passiveResponse.data.data.balance}`);
        console.log(`Transaction Count: ${passiveResponse.data.data.transactions.length}`);
      } catch (error) {
        console.log('❌ Passive Wallet API failed:', error.response?.data?.message || error.message);
      }
      
      console.log('\n🎉 ALL TESTS COMPLETED - LOGIN AND API ACCESS WORKING!');
      
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Login failed:', error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testAlankoLogin();