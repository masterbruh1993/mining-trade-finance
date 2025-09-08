const axios = require('axios');

const testAPIEndpoints = async () => {
  try {
    const baseURL = 'http://localhost:5000';
    
    // Test token from previous script
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjhlYTAwMzlmNWQzM2Y0MzllZmRhYyIsImlhdCI6MTc1Njk0OTAxOSwiZXhwIjoxNzU2OTUyNjE5fQ.jUT2Ydea2vzDifU_dxUpbj1qjsdC2CxQ4_YS1VJ5LhE';
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('=== TESTING DASHBOARD API ===');
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

    console.log('\n=== TESTING WITHDRAWAL WALLETS API ===');
    try {
      const withdrawalResponse = await axios.get(`${baseURL}/api/v1/wallet/withdrawal-wallets`, { headers });
      console.log('✅ Withdrawal Wallets API Response:');
      console.log(JSON.stringify(withdrawalResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Withdrawal Wallets API Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('General Error:', error.message);
  }
};

testAPIEndpoints();