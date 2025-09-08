const axios = require('axios');

// Test investment activation and active contracts fetching
async function testInvestmentFlow() {
  const baseURL = 'http://localhost:5000/api/v1';
  const TEST_USER_EMAIL = 'test1@gmail.com';
  const TEST_USER_PASSWORD = 'password123!';
  
  try {
    console.log('=== Step 1: Login to get JWT token ===');
    
    // Login to get JWT token
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      emailOrUsername: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n=== Step 2: Check current credit wallet balance ===');
    
    // Check current balance
    const creditResponse = await axios.get(`${baseURL}/wallet/credit`, { headers });
    console.log('Current Credit Wallet Balance:', creditResponse.data.balance);
    
    if (creditResponse.data.balance < 48000) {
      console.log('⚠️  Insufficient balance for ₱48,000 activation test');
      console.log('   Testing with available balance instead...');
    }
    
    console.log('\n=== Step 3: Test Investment Activation ===');
    
    // Test activation with ₱48,000 or available balance
    const activationAmount = Math.min(48000, creditResponse.data.balance);
    
    if (activationAmount < 1000) {
      console.log('❌ Insufficient balance for minimum activation (₱1,000)');
      return;
    }
    
    const activationResponse = await axios.post(`${baseURL}/investments/activate`, {
      amount: activationAmount
    }, { headers });
    
    console.log('Activation Response Status:', activationResponse.status);
    console.log('Activation Response:', JSON.stringify(activationResponse.data, null, 2));
    
    if (activationResponse.data.status === 'success') {
      console.log('✅ Investment activation successful');
      console.log('Investment ID:', activationResponse.data.data.investment._id);
      console.log('Amount:', activationResponse.data.data.investment.amount);
      console.log('Start Date:', activationResponse.data.data.investment.startDate);
      console.log('Maturity Date:', activationResponse.data.data.investment.maturityDate);
      console.log('Status:', activationResponse.data.data.investment.status);
      console.log('Duration:', activationResponse.data.data.investment.duration);
      console.log('Total ROI:', activationResponse.data.data.investment.totalROI);
    }
    
    console.log('\n=== Step 4: Test Active Contracts Fetch ===');
    
    // Test fetching active contracts
    const activeContractsResponse = await axios.get(`${baseURL}/investments/active`, { headers });
    
    console.log('Active Contracts Response Status:', activeContractsResponse.status);
    console.log('Active Contracts Response:', JSON.stringify(activeContractsResponse.data, null, 2));
    
    if (activeContractsResponse.data.status === 'success') {
      console.log('✅ Active contracts fetch successful');
      console.log('Number of active contracts:', activeContractsResponse.data.data.length);
      
      if (activeContractsResponse.data.data.length > 0) {
        activeContractsResponse.data.data.forEach((contract, index) => {
          console.log(`\nContract ${index + 1}:`);
          console.log('  Amount:', contract.amount);
          console.log('  Start Date:', contract.startDate);
          console.log('  Maturity Date:', contract.maturityDate);
          console.log('  Days Left:', contract.daysLeft);
          console.log('  Status:', contract.status);
          console.log('  Expected Return:', contract.expectedReturn);
          console.log('  Duration:', contract.duration);
          console.log('  Total ROI:', contract.totalROI);
        });
        
        console.log('\n✅ SUCCESS: Investment activation and retrieval working correctly!');
        console.log('   - Investment record created in database');
        console.log('   - Active contracts API returning data');
        console.log('   - Dashboard and Active Contracts page should now show contracts');
      } else {
        console.log('⚠️  No active contracts found after activation');
      }
    }
    
    console.log('\n=== Step 5: Verify Credit Wallet Deduction ===');
    
    // Check balance after activation
    const finalCreditResponse = await axios.get(`${baseURL}/wallet/credit`, { headers });
    const finalBalance = finalCreditResponse.data.balance;
    const expectedBalance = creditResponse.data.balance - activationAmount;
    
    console.log('Initial Balance:', creditResponse.data.balance);
    console.log('Activation Amount:', activationAmount);
    console.log('Final Balance:', finalBalance);
    console.log('Expected Balance:', expectedBalance);
    
    if (Math.abs(finalBalance - expectedBalance) < 0.01) {
      console.log('✅ Credit wallet deduction verified');
    } else {
      console.log('❌ Credit wallet deduction mismatch');
    }
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testInvestmentFlow();