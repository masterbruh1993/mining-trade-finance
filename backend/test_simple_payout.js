const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const PayoutService = require('./services/payoutService');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testPayoutSystem() {
  console.log('🚀 Testing Payout System');
  
  try {
    // Connect to database
    await connectDB();
    
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: 'admin@1uptrade.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Check summary before
    const summaryBefore = await axios.get(`${BASE_URL}/investments/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('📊 Summary Before:', summaryBefore.data.data);
    
    // Check active contracts
    const contractsResponse = await axios.get(`${BASE_URL}/investments/active`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('📋 Active Contracts:', contractsResponse.data.data.length);
    
    // Trigger manual payout processing
    console.log('🔄 Triggering payout processing...');
    await PayoutService.triggerPayouts();
    console.log('✅ Payout processing completed');
    
    // Check summary after
    const summaryAfter = await axios.get(`${BASE_URL}/investments/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('📊 Summary After:', summaryAfter.data.data);
    
    // Check contracts with updated progress
    const updatedContracts = await axios.get(`${BASE_URL}/investments/active`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 Updated Contracts:');
    updatedContracts.data.data.forEach((contract, index) => {
      console.log(`  Contract ${index + 1}: ₱${contract.amount.toLocaleString()}, Progress: ${contract.progress.completed}/${contract.progress.total}`);
    });
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  } finally {
    await mongoose.connection.close();
  }
}

testPayoutSystem();