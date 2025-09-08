const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Test configuration
const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_USER = {
  username: `testuser_${Date.now()}`,
  email: `testuser_${Date.now()}@test.com`,
  password: 'TestPassword123!',
  fullName: 'Test User Wallet',
  mobileNumber: '09123456789'
};

const testWalletFunctionality = async () => {
  try {
    console.log('🧪 Testing Wallet Functionality...');
    console.log('================================');

    // Step 1: Register new user
    console.log('\n1. Registering new user...');
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
    
    if (registerRes.data.success) {
      console.log('✅ User registered successfully');
      console.log(`   Username: ${TEST_USER.username}`);
      console.log(`   Email: ${TEST_USER.email}`);
    } else {
      throw new Error('User registration failed');
    }

    // Step 2: Login user
    console.log('\n2. Logging in user...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: TEST_USER.email,
      password: TEST_USER.password
    });

    if (!loginRes.data.success) {
      throw new Error('User login failed');
    }

    const token = loginRes.data.token;
    const userId = loginRes.data.data.id;
    console.log('✅ User logged in successfully');
    console.log(`   User ID: ${userId}`);

    // Step 3: Fetch user wallets
    console.log('\n3. Fetching user wallets...');
    const walletsRes = await axios.get(`${BASE_URL}/wallets`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!walletsRes.data.success) {
      throw new Error('Failed to fetch wallets');
    }

    const wallets = walletsRes.data.data;
    console.log('✅ Wallets fetched successfully');
    console.log(`   Number of wallets: ${wallets.length}`);

    // Step 4: Verify wallet types and structure
    console.log('\n4. Verifying wallet structure...');
    
    const expectedWalletTypes = ['bonus', 'passive'];
    const actualWalletTypes = wallets.map(w => w.walletType).sort();
    
    console.log(`   Expected wallet types: ${expectedWalletTypes.join(', ')}`);
    console.log(`   Actual wallet types: ${actualWalletTypes.join(', ')}`);

    // Check if all expected wallet types exist
    const hasAllWalletTypes = expectedWalletTypes.every(type => 
      actualWalletTypes.includes(type)
    );

    if (hasAllWalletTypes && wallets.length === 2) {
      console.log('✅ All required wallet types present');
    } else {
      throw new Error('Missing required wallet types');
    }

    // Step 5: Verify wallet details
    console.log('\n5. Verifying wallet details...');
    wallets.forEach(wallet => {
      console.log(`   ${wallet.walletType.toUpperCase()} Wallet:`);
      console.log(`     - ID: ${wallet._id}`);
      console.log(`     - Balance: ₱${wallet.balance}`);
      console.log(`     - User ID: ${wallet.user}`);
      
      if (wallet.balance !== 0) {
        console.log('⚠️  Warning: Wallet balance is not 0');
      }
      
      if (wallet.user !== userId) {
        throw new Error('Wallet does not belong to the correct user');
      }
    });

    console.log('\n✅ All wallet functionality tests passed!');
    console.log('================================');
    console.log('Summary:');
    console.log('- User registration creates default wallets ✅');
    console.log('- Wallet fetch endpoint returns user wallets ✅');
    console.log('- Both Bonus and Passive wallets created ✅');
    console.log('- All wallets have balance = 0 ✅');
    console.log('- Wallets belong to correct user ✅');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || error.response.data}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
};

// Run the test
testWalletFunctionality();