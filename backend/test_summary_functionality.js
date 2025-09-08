const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';
const TEST_USER_EMAIL = 'test1@gmail.com';
const TEST_USER_PASSWORD = 'password123!';

async function testSummaryFunctionality() {
  try {
    console.log('=== Testing Summary Cards Functionality ===\n');

    // Step 1: Login
    console.log('=== Step 1: Login ===');
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      emailOrUsername: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Check initial summary
    console.log('\n=== Step 2: Check Initial Summary ===');
    const initialSummaryResponse = await axios.get(`${BASE_URL}/api/v1/investments/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const initialSummary = initialSummaryResponse.data.data;
    console.log('Initial Summary:');
    console.log('  Total Active Contracts:', initialSummary.totalActiveContracts);
    console.log('  Total Investment: ₱' + initialSummary.totalInvestment.toLocaleString());
    console.log('  Completed Contracts:', initialSummary.completedContracts);
    console.log('  Total Payouts Received: ₱' + initialSummary.totalPayoutsReceived.toLocaleString());

    // Step 3: Activate ₱20,000 contract
    console.log('\n=== Step 3: Activate ₱20,000 Contract ===');
    const activation1Response = await axios.post(`${BASE_URL}/api/v1/investments/activate`, {
      amount: 20000
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (activation1Response.data.status === 'success') {
      console.log('✅ ₱20,000 contract activated successfully');
      console.log('  Investment ID:', activation1Response.data.data.investment._id);
    }

    // Step 4: Activate ₱50,000 contract
    console.log('\n=== Step 4: Activate ₱50,000 Contract ===');
    const activation2Response = await axios.post(`${BASE_URL}/api/v1/investments/activate`, {
      amount: 50000
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (activation2Response.data.status === 'success') {
      console.log('✅ ₱50,000 contract activated successfully');
      console.log('  Investment ID:', activation2Response.data.data.investment._id);
    }

    // Step 5: Check updated summary
    console.log('\n=== Step 5: Check Updated Summary ===');
    const updatedSummaryResponse = await axios.get(`${BASE_URL}/api/v1/investments/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const updatedSummary = updatedSummaryResponse.data.data;
    console.log('Updated Summary:');
    console.log('  Total Active Contracts:', updatedSummary.totalActiveContracts);
    console.log('  Total Investment: ₱' + updatedSummary.totalInvestment.toLocaleString());
    console.log('  Completed Contracts:', updatedSummary.completedContracts);
    console.log('  Total Payouts Received: ₱' + updatedSummary.totalPayoutsReceived.toLocaleString());

    // Step 6: Verify calculations
    console.log('\n=== Step 6: Verify Expected Results ===');
    const expectedActiveContracts = initialSummary.totalActiveContracts + 2;
    const expectedTotalInvestment = initialSummary.totalInvestment + 70000;
    
    console.log('Expected vs Actual:');
    console.log('  Active Contracts - Expected:', expectedActiveContracts, 'Actual:', updatedSummary.totalActiveContracts);
    console.log('  Total Investment - Expected: ₱' + expectedTotalInvestment.toLocaleString(), 'Actual: ₱' + updatedSummary.totalInvestment.toLocaleString());
    
    if (updatedSummary.totalActiveContracts === expectedActiveContracts && 
        updatedSummary.totalInvestment === expectedTotalInvestment) {
      console.log('\n🎉 SUCCESS: Summary cards are working correctly!');
      console.log('   - Active contracts count updated properly');
      console.log('   - Total investment amount calculated correctly');
      console.log('   - Frontend should now display real-time data');
    } else {
      console.log('\n❌ MISMATCH: Summary calculations are incorrect');
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run the test
testSummaryFunctionality();