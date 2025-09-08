const mongoose = require('mongoose');
const axios = require('axios');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const Withdrawal = require('./models/Withdrawal');

// Test dashboard persistence after reset
async function testDashboardPersistence() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/1uptradev3', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    console.log('✅ Test user found:', testUser.fullName);
    console.log('   User ID:', testUser._id.toString());

    // Login as test user to get token
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      emailOrUsername: 'test@example.com',
      password: 'password123!'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Failed to login as test user');
      return;
    }
    
    const userToken = loginResponse.data.token;
    console.log('✅ Logged in as test user');

    // Get dashboard data before reset
    const dashboardResponse = await axios.get(
      'http://localhost:5000/api/v1/dashboard/',
      {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      }
    );

    const beforeReset = dashboardResponse.data;
    console.log('📊 Dashboard data BEFORE reset:');
    console.log('- Passive Wallet:', beforeReset.passiveWallet);
    console.log('- Bonus Wallet:', beforeReset.bonusWallet);
    console.log('- Credit Wallet:', beforeReset.creditWallet);
    console.log('- Total Earnings:', beforeReset.totalPayoutsReceived);
    console.log('- Encashment Total:', beforeReset.encashmentTotal);
    console.log('- Active Contracts:', beforeReset.activeContracts?.length || 0);

    // Count withdrawal records before reset
    const withdrawalsBefore = await Withdrawal.countDocuments({ userId: testUser._id });
    console.log('- Withdrawal Records:', withdrawalsBefore);

    // Login as admin to get admin token
    const adminLoginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      emailOrUsername: 'admin@1uptrade.com',
      password: 'admin123!'
    });
    
    if (!adminLoginResponse.data.success) {
      console.log('❌ Failed to login as admin');
      return;
    }
    
    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Logged in as admin');

    // Perform reset via admin API
    console.log('\n🔄 Performing reset...');
    const resetResponse = await axios.post(
      'http://localhost:5000/api/v1/admin/reset-user-requests',
      {
        userId: testUser._id,
        scope: 'all'
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      }
    );

    if (resetResponse.data.success) {
      console.log('✅ Reset successful:', resetResponse.data.message);
      console.log('- Deleted records:', resetResponse.data.deletedCount);
    } else {
      console.log('❌ Reset failed');
      return;
    }

    // Get dashboard data after reset
    const afterResetResponse = await axios.get(
      'http://localhost:5000/api/v1/dashboard/',
      {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      }
    );

    const afterReset = afterResetResponse.data;
    console.log('\n📊 Dashboard data AFTER reset:');
    console.log('- Passive Wallet:', afterReset.passiveWallet);
    console.log('- Bonus Wallet:', afterReset.bonusWallet);
    console.log('- Credit Wallet:', afterReset.creditWallet);
    console.log('- Total Earnings:', afterReset.totalPayoutsReceived);
    console.log('- Encashment Total:', afterReset.encashmentTotal);
    console.log('- Active Contracts:', afterReset.activeContracts?.length || 0);

    // Count withdrawal records after reset
    const withdrawalsAfter = await Withdrawal.countDocuments({ userId: testUser._id });
    console.log('- Withdrawal Records:', withdrawalsAfter);

    // Verify persistence
    console.log('\n🔍 VERIFICATION:');
    
    const walletsPersisted = (
      beforeReset.passiveWallet === afterReset.passiveWallet &&
      beforeReset.bonusWallet === afterReset.bonusWallet &&
      beforeReset.creditWallet === afterReset.creditWallet
    );
    
    const earningsPersisted = (
      beforeReset.totalPayoutsReceived === afterReset.totalPayoutsReceived
    );
    
    const contractsPersisted = (
      (beforeReset.activeContracts?.length || 0) === (afterReset.activeContracts?.length || 0)
    );
    
    const withdrawalsCleared = withdrawalsAfter === 0;
    
    console.log('✅ Wallet balances persisted:', walletsPersisted);
    console.log('✅ Total earnings persisted:', earningsPersisted);
    console.log('✅ Active contracts persisted:', contractsPersisted);
    console.log('✅ Withdrawal records cleared:', withdrawalsCleared);
    
    if (walletsPersisted && earningsPersisted && contractsPersisted && withdrawalsCleared) {
      console.log('\n🎉 TEST PASSED: Dashboard persistence verified!');
    } else {
      console.log('\n❌ TEST FAILED: Dashboard data was affected by reset');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDashboardPersistence();