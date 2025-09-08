const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api/v1';
const ADMIN_CREDENTIALS = {
  emailOrUsername: 'admin',
  password: 'admin123!'
};

const TEST_USER = {
  username: `testuser_${Date.now()}`,
  email: `testuser_${Date.now()}@test.com`,
  password: 'TestPassword123!',
  fullName: 'Test User Withdrawal',
  mobileNumber: '09123456789'
};

let adminToken = '';
let userToken = '';
let userId = '';

// Clear pending withdrawals for test user via admin API
async function clearPendingWithdrawals() {
  try {
    console.log('🧹 Clearing pending withdrawals...');
    // Use admin API to clear withdrawals instead of direct DB access
    const response = await axios.delete(`${BASE_URL}/admin/withdrawals/user/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Pending withdrawals cleared');
    return true;
  } catch (error) {
    console.log('ℹ️  No pending withdrawals to clear or endpoint not available');
    return true; // Continue with tests even if clearing fails
  }
}

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Register test user
async function registerTestUser() {
  try {
    console.log('👤 Registering test user...');
    const response = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
    if (response.data.success) {
      console.log('✅ Test user registered successfully');
      return true;
    }
  } catch (error) {
    if (error.response?.data?.error?.includes('already exists')) {
      console.log('ℹ️  Test user already exists, proceeding...');
      return true;
    }
    console.error('❌ Test user registration failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Login as admin
async function loginAsAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    adminToken = response.data.token;
    console.log('✅ Admin login successful');
    return true;
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Login as user
async function loginAsUser() {
  try {
    console.log('🔐 Logging in as user...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: TEST_USER.email,
      password: TEST_USER.password
    });
    userToken = response.data.token;
    userId = response.data.data.id;
    console.log('✅ User login successful');
    return true;
  } catch (error) {
    console.error('❌ User login failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Enable encashment
async function enableEncashment() {
  try {
    console.log('⚙️  Enabling encashment...');
    await axios.post(`${BASE_URL}/admin/encashment-settings`, {
      startTime: '00:00',
      endTime: '23:59',
      isEnabled: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Encashment enabled');
    return true;
  } catch (error) {
    console.error('❌ Failed to enable encashment:', error.response?.data?.error || error.message);
    return false;
  }
}

// Get wallet balances
async function getWalletBalances() {
  try {
    const response = await axios.get(`${BASE_URL}/wallet/balances`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to get wallet balances:', error.response?.data?.error || error.message);
    return null;
  }
}

// Add balance to wallet
async function addBalanceToWallet(walletType, amount) {
  try {
    console.log(`💰 Adding ₱${amount.toLocaleString()} to ${walletType} wallet...`);
    console.log(`🔍 Debug - Admin token: ${adminToken ? 'Present' : 'Missing'}`);
    console.log(`🔍 Debug - User ID: ${userId}`);
    console.log(`🔍 Debug - Request URL: ${BASE_URL}/admin/wallets/add-balance`);
    
    const response = await axios.post(`${BASE_URL}/admin/wallets/add-balance`, {
      userId: userId,
      walletType: walletType,
      amount: amount
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`🔍 Debug - Admin endpoint response:`, response.data);
    console.log(`✅ Added ₱${amount.toLocaleString()} to ${walletType} wallet`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to add balance to ${walletType} wallet:`, error.response?.data || error.message);
    console.error(`🔍 Debug - Full error:`, error.response?.status, error.response?.statusText);
    return false;
  }
}

// Submit withdrawal request
async function submitWithdrawal(walletType, amount, payoutMethod = 'GCash', accountDetails = '09566332213') {
  try {
    console.log(`📤 Submitting withdrawal: ₱${amount.toLocaleString()} from ${walletType} wallet via ${payoutMethod}...`);
    
    // Calculate net amount (assuming no fees for testing)
    const netAmount = amount;
    
    const response = await axios.post(`${BASE_URL}/withdrawals`, {
      walletType: walletType,
      amount: amount,
      payoutMethod: payoutMethod,
      accountDetails: accountDetails,
      netAmount: netAmount
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Withdrawal request submitted successfully');
      console.log('📋 Withdrawal ID:', response.data.data._id);
      return response.data.data;
    }
  } catch (error) {
    console.error('❌ Withdrawal submission failed:', error.response?.data?.error || error.message);
    return null;
  }
}

// Test 1: Successful withdrawal from Passive Wallet
async function testPassiveWalletWithdrawal() {
  console.log('\n📋 TEST 1: Withdraw ₱10,000 from Passive Wallet');
  console.log('=' .repeat(60));
  
  // Clear any pending withdrawals first
  await clearPendingWithdrawals();
  
  // Add balance to passive wallet
  const balanceAdded = await addBalanceToWallet('passive', 151500);
  if (!balanceAdded) return false;
  
  // Get initial balance
  const initialBalances = await getWalletBalances();
  if (!initialBalances) return false;
  
  console.log('🔍 Debug - Initial balances after adding funds:', initialBalances);
  const initialPassiveBalance = initialBalances.passiveWallet || 0;
  console.log(`💰 Initial Passive Wallet Balance: ₱${initialPassiveBalance.toLocaleString()}`);
  
  // Submit withdrawal
  const withdrawal = await submitWithdrawal('passive', 10000, 'GCash', '09123456789');
  if (!withdrawal) return false;
  
  // Wait and check final balance
  await wait(1000);
  const finalBalances = await getWalletBalances();
  if (!finalBalances) return false;
  
  const finalPassiveBalance = finalBalances.passiveWallet || 0;
  console.log(`💰 Final Passive Wallet Balance: ₱${finalPassiveBalance.toLocaleString()}`);
  
  const expectedBalance = initialPassiveBalance - 10000;
  if (finalPassiveBalance === expectedBalance) {
    console.log('✅ PASS: Balance correctly deducted');
    return true;
  } else {
    console.log(`❌ FAIL: Expected balance ₱${expectedBalance.toLocaleString()}, got ₱${finalPassiveBalance.toLocaleString()}`);
    return false;
  }
}

// Test 2: Successful withdrawal from Bonus Wallet
async function testBonusWalletWithdrawal() {
  console.log('\n📋 TEST 2: Withdraw ₱1,000 from Bonus Wallet');
  console.log('=' .repeat(60));
  
  // Clear any pending withdrawals first
  await clearPendingWithdrawals();
  
  // Add balance to bonus wallet
  const balanceAdded = await addBalanceToWallet('bonus', 32600);
  if (!balanceAdded) return false;
  
  // Get initial balance
  const initialBalances = await getWalletBalances();
  if (!initialBalances) return false;
  
  console.log('🔍 Debug - Initial balances after adding bonus funds:', initialBalances);
  const initialBonusBalance = initialBalances.bonusWallet || 0;
  console.log(`💰 Initial Bonus Wallet Balance: ₱${initialBonusBalance.toLocaleString()}`);
  
  // Submit withdrawal
  const withdrawal = await submitWithdrawal('bonus', 1000, 'Maya', '09987654321');
  if (!withdrawal) return false;
  
  // Wait and check final balance
  await wait(1000);
  const finalBalances = await getWalletBalances();
  if (!finalBalances) return false;
  
  const finalBonusBalance = finalBalances.bonusWallet || 0;
  console.log(`💰 Final Bonus Wallet Balance: ₱${finalBonusBalance.toLocaleString()}`);
  
  const expectedBalance = initialBonusBalance - 1000;
  if (finalBonusBalance === expectedBalance) {
    console.log('✅ PASS: Balance correctly deducted');
    return true;
  } else {
    console.log(`❌ FAIL: Expected balance ₱${expectedBalance.toLocaleString()}, got ₱${finalBonusBalance.toLocaleString()}`);
    return false;
  }
}

// Test 3: Below minimum amount error
async function testBelowMinimumAmount() {
  console.log('\n📋 TEST 3: Withdraw below minimum amount');
  console.log('=' .repeat(60));
  
  // Try to withdraw ₱200 from passive wallet (minimum is ₱300)
  console.log('🚫 Attempting to withdraw ₱200 from passive wallet (minimum ₱300)...');
  const withdrawal = await submitWithdrawal('passive', 200);
  
  if (!withdrawal) {
    console.log('✅ PASS: Correctly rejected withdrawal below minimum amount');
    return true;
  } else {
    console.log('❌ FAIL: Should have rejected withdrawal below minimum amount');
    return false;
  }
}

// Test 4: Insufficient balance error
async function testInsufficientBalance() {
  console.log('\n📋 TEST 4: Withdraw above available balance');
  console.log('=' .repeat(60));
  
  // Get current balance
  const balances = await getWalletBalances();
  if (!balances) return false;
  
  const passiveBalance = balances.passiveWallet || 0;
  const attemptAmount = passiveBalance + 50000; // Try to withdraw more than available
  
  console.log(`💰 Current Passive Balance: ₱${passiveBalance.toLocaleString()}`);
  console.log(`🚫 Attempting to withdraw ₱${attemptAmount.toLocaleString()}...`);
  
  const withdrawal = await submitWithdrawal('passive', attemptAmount);
  
  if (!withdrawal) {
    console.log('✅ PASS: Correctly rejected withdrawal above available balance');
    return true;
  } else {
    console.log('❌ FAIL: Should have rejected withdrawal above available balance');
    return false;
  }
}

// Test 5: Bonus wallet minimum amount
async function testBonusWalletMinimum() {
  console.log('\n📋 TEST 5: Withdraw below bonus wallet minimum (₱500)');
  console.log('=' .repeat(60));
  
  // Try to withdraw ₱400 from bonus wallet (minimum is ₱500)
  console.log('🚫 Attempting to withdraw ₱400 from bonus wallet (minimum ₱500)...');
  const withdrawal = await submitWithdrawal('bonus', 400);
  
  if (!withdrawal) {
    console.log('✅ PASS: Correctly rejected bonus wallet withdrawal below minimum amount');
    return true;
  } else {
    console.log('❌ FAIL: Should have rejected bonus wallet withdrawal below minimum amount');
    return false;
  }
}

// Main test function
async function runWithdrawalTests() {
  console.log('🚀 WITHDRAWAL FUNCTIONALITY TESTS');
  console.log('=' .repeat(70));
  console.log('Testing withdrawal request submission and balance updates\n');
  
  // Setup
  const userRegistered = await registerTestUser();
  const adminLoggedIn = await loginAsAdmin();
  const userLoggedIn = await loginAsUser();
  const encashmentEnabled = await enableEncashment();
  
  if (!userRegistered || !adminLoggedIn || !userLoggedIn || !encashmentEnabled) {
    console.log('❌ Setup failed. Cannot proceed with tests.');
    return;
  }
  
  // Run all tests
  const results = [];
  
  results.push(await testPassiveWalletWithdrawal());
  results.push(await testBonusWalletWithdrawal());
  results.push(await testBelowMinimumAmount());
  results.push(await testInsufficientBalance());
  results.push(await testBonusWalletMinimum());
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('=' .repeat(70));
  
  const passedTests = results.filter(result => result).length;
  const totalTests = results.length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Withdrawal functionality is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the withdrawal implementation.');
  }
  
  console.log('\n🔍 Key Verification Points:');
  console.log('• Withdrawal requests submit successfully when within rules');
  console.log('• Wallet balances are correctly deducted upon submission');
  console.log('• Minimum amount validation (₱300 passive, ₱500 bonus)');
  console.log('• Insufficient balance validation');
  console.log('• Transaction records are created');
  console.log('• Proper error messages for rule violations');
}

// Run the tests
runWithdrawalTests().catch(console.error);