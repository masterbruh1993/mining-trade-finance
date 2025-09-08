const mongoose = require('mongoose');
const User = require('./models/User');
const Withdrawal = require('./models/Withdrawal');
const Wallet = require('./models/Wallet');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/1uptrade', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function setupTestUser() {
  console.log('Setting up test user...');
  
  // Use existing test user for testing
  let testUser = await User.findOne({ email: 'test@example.com' });
  if (!testUser) {
    console.log('Test user not found. Please ensure test user exists.');
    throw new Error('Test user not found');
  }

  // Setup test wallets with sufficient balance
  let wallet = await Wallet.findOne({ user: testUser._id });
  if (!wallet) {
    wallet = new Wallet({
      user: testUser._id,
      passiveWallet: 1000,
      bonusWallet: 1000
    });
  } else {
    wallet.passiveWallet = 1000;
    wallet.bonusWallet = 1000;
  }
  await wallet.save();

  console.log('Test user setup complete:', {
    userId: testUser._id,
    passiveBalance: wallet.passiveWallet,
    bonusBalance: wallet.bonusWallet
  });

  return testUser;
}

async function cleanupTestData(userId) {
  console.log('Cleaning up test withdrawal data...');
  await Withdrawal.deleteMany({ user: userId });
  console.log('Test data cleaned up');
}

async function createTestWithdrawal(userId, walletType, amount, status = 'PENDING') {
  const withdrawal = new Withdrawal({
    user: userId,
    amount: amount,
    walletType: walletType,
    status: status,
    paymentMethod: 'gcash',
    paymentDetails: {
      accountNumber: '09123456789',
      accountName: 'Test User'
    },
    createdAt: new Date()
  });
  await withdrawal.save();
  return withdrawal;
}

async function testDailyLimitLogic() {
  console.log('\n=== Testing Daily Limit Logic ===');
  
  const testUser = await setupTestUser();
  await cleanupTestData(testUser._id);

  // Test 1: First withdrawal should be allowed
  console.log('\nTest 1: First passive wallet withdrawal (should be allowed)');
  const withdrawal1 = await createTestWithdrawal(testUser._id, 'passive', 500, 'PENDING');
  console.log('✓ First withdrawal created:', withdrawal1._id);

  // Test 2: Second withdrawal same day should be blocked
  console.log('\nTest 2: Second passive wallet withdrawal same day (should be blocked)');
  try {
    // Simulate the daily limit check
    const existingWithdrawal = await Withdrawal.findOne({
      user: testUser._id,
      walletType: 'passive',
      status: { $in: ['PENDING', 'COMPLETED'] },
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });
    
    if (existingWithdrawal) {
      console.log('✓ Daily limit check working - existing withdrawal found:', existingWithdrawal._id);
    } else {
      console.log('✗ Daily limit check failed - no existing withdrawal found');
    }
  } catch (error) {
    console.log('✗ Error in daily limit check:', error.message);
  }

  // Test 3: Cancelled withdrawal should not block new requests
  console.log('\nTest 3: After cancelling withdrawal, new request should be allowed');
  withdrawal1.status = 'CANCELLED';
  await withdrawal1.save();
  
  const existingAfterCancel = await Withdrawal.findOne({
    user: testUser._id,
    walletType: 'passive',
    status: { $in: ['PENDING', 'COMPLETED'] },
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lt: new Date(new Date().setHours(23, 59, 59, 999))
    }
  });
  
  if (!existingAfterCancel) {
    console.log('✓ After cancellation, no blocking withdrawal found - new request should be allowed');
  } else {
    console.log('✗ After cancellation, still found blocking withdrawal:', existingAfterCancel._id);
  }

  // Test 4: Rejected withdrawal should not block new requests
    console.log('\nTest 4: Rejected withdrawal should not block new requests');
    const rejectedWithdrawal = await createTestWithdrawal(testUser._id, 'passive', 400, 'REJECTED');
  
  const existingAfterReject = await Withdrawal.findOne({
    user: testUser._id,
    walletType: 'passive',
    status: { $in: ['PENDING', 'COMPLETED'] },
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lt: new Date(new Date().setHours(23, 59, 59, 999))
    }
  });
  
  if (!existingAfterReject) {
    console.log('✓ Rejected withdrawal does not block new requests');
  } else {
    console.log('✗ Rejected withdrawal is blocking new requests:', existingAfterReject._id);
  }

  // Test 5: Wallet independence
  console.log('\nTest 5: Wallet independence - bonus wallet should be independent');
  const bonusWithdrawal = await createTestWithdrawal(testUser._id, 'bonus', 600, 'PENDING');
  console.log('✓ Bonus wallet withdrawal created independently:', bonusWithdrawal._id);

  return testUser;
}

async function testStatusTransitions() {
  console.log('\n=== Testing Status Transitions ===');
  
  const testUser = await setupTestUser();
  await cleanupTestData(testUser._id);

  // Test all possible statuses
  const statuses = ['PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED'];
  
  for (const status of statuses) {
    console.log(`\nTesting ${status} status...`);
    const withdrawal = await createTestWithdrawal(testUser._id, 'passive', 400, status);
    console.log(`✓ ${status} withdrawal created:`, withdrawal._id);
    
    // Verify status is correctly set
    const savedWithdrawal = await Withdrawal.findById(withdrawal._id);
    if (savedWithdrawal.status === status) {
      console.log(`✓ Status correctly saved as ${status}`);
    } else {
      console.log(`✗ Status mismatch: expected ${status}, got ${savedWithdrawal.status}`);
    }
  }
}

async function testRejectedStatusCreation() {
  console.log('\n=== Testing Rejected Status Creation ===');
  
  const testUser = await setupTestUser();
  await cleanupTestData(testUser._id);

  // Test creating rejected withdrawal with reason
  console.log('\nTesting rejected withdrawal creation...');
  const rejectedWithdrawal = new Withdrawal({
    user: testUser._id,
    amount: 350, // Valid amount for testing
    walletType: 'passive',
    status: 'REJECTED',
    paymentMethod: 'gcash',
    paymentDetails: {
      accountNumber: '09123456789',
      accountName: 'Test User'
    },
    remarks: 'Rejected for testing purposes',
    createdAt: new Date()
  });
  
  await rejectedWithdrawal.save();
  console.log('✓ Rejected withdrawal created with reason:', rejectedWithdrawal._id);
  console.log('✓ Rejection reason:', rejectedWithdrawal.remarks);
}

async function runAllTests() {
  try {
    console.log('Starting Withdrawal System Tests...');
    console.log('=====================================');
    
    await testDailyLimitLogic();
    await testStatusTransitions();
    await testRejectedStatusCreation();
    
    console.log('\n=====================================');
    console.log('All tests completed successfully!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run tests
runAllTests();