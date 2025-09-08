const axios = require('axios');

// Test script to verify Continue button functionality in contract activation modal
const BASE_URL = 'http://localhost:5000';

const testContinueButtonFix = async () => {
  console.log('🧪 Testing Continue Button Fix for Contract Activation Modal');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login as test user
    console.log('\n1. Logging in as test user...');
    const loginRes = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      emailOrUsername: 'test@example.com',
      password: 'password123!'
    });

    if (!loginRes.data.success) {
      throw new Error('Login failed: ' + loginRes.data.message);
    }

    const token = loginRes.data.token;
    console.log('✅ Login successful');

    // Step 2: Check initial active contracts count
    console.log('\n2. Checking initial active contracts...');
    const initialContractsRes = await axios.get(`${BASE_URL}/api/v1/investments/active`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const initialCount = initialContractsRes.data.data?.length || 0;
    console.log(`📊 Initial active contracts: ${initialCount}`);

    // Step 3: Check credit wallet balance
    console.log('\n3. Checking credit wallet balance...');
    const walletRes = await axios.get(`${BASE_URL}/api/v1/wallet/credit`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const creditBalance = walletRes.data.data?.balance || 0;
    console.log(`💰 Credit wallet balance: ₱${creditBalance.toLocaleString()}`);

    if (creditBalance < 10000) {
      console.log('⚠️  Insufficient balance for ₱10,000 contract activation');
      console.log('💡 Please ensure credit wallet has at least ₱10,000 for testing');
      return;
    }

    // Step 4: Activate a ₱10,000 contract
    console.log('\n4. Activating ₱10,000 contract...');
    const activationRes = await axios.post(`${BASE_URL}/api/v1/investments/activate`, 
      { amount: 10000 }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (activationRes.data.status !== 'success') {
      throw new Error('Activation failed: ' + activationRes.data.message);
    }

    console.log('✅ Contract activation successful');
    console.log(`📋 Investment ID: ${activationRes.data.data.investment._id}`);
    console.log(`💳 Updated balance: ₱${activationRes.data.data.updatedBalance.toLocaleString()}`);

    // Step 5: Verify active contracts increased
    console.log('\n5. Verifying active contracts list updated...');
    const finalContractsRes = await axios.get(`${BASE_URL}/api/v1/investments/active`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const finalCount = finalContractsRes.data.data?.length || 0;
    console.log(`📊 Final active contracts: ${finalCount}`);

    if (finalCount > initialCount) {
      console.log('✅ Active contracts list updated correctly');
      console.log(`📈 Contracts increased by: ${finalCount - initialCount}`);
    } else {
      console.log('❌ Active contracts list did not update');
    }

    // Step 6: Check contract summary
    console.log('\n6. Checking contract summary...');
    const summaryRes = await axios.get(`${BASE_URL}/api/v1/contracts/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (summaryRes.data.success) {
      const summary = summaryRes.data.data;
      console.log(`📊 Total Active Contracts: ${summary.totalActiveContracts}`);
      console.log(`💰 Total Investment: ₱${summary.totalInvestment?.toLocaleString()}`);
    }

    console.log('\n🎉 Continue Button Fix Test Completed!');
    console.log('\n📝 Manual Testing Steps:');
    console.log('1. Go to Dashboard and activate a ₱10,000 contract');
    console.log('2. Verify modal appears with contract details');
    console.log('3. Click Continue button');
    console.log('4. Verify modal closes with smooth animation');
    console.log('5. Verify new contract appears in Active Contracts list immediately');
    console.log('6. Check browser console for debug messages:');
    console.log('   - "Refreshing Active Contracts after modal close..."');
    console.log('   - "Fetched contracts: X contracts"');
    console.log('   - "Active Contracts refreshed successfully"');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
};

// Run the test
testContinueButtonFix();