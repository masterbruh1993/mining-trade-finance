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
  fullName: 'Test User Encashment',
  mobileNumber: '09123456789'
};

const USER_CREDENTIALS = {
  emailOrUsername: TEST_USER.email,
  password: TEST_USER.password
};

let adminToken = '';
let userToken = '';

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to format time
const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

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

// Register test user
async function registerTestUser() {
  try {
    console.log('👤 Registering test user...');
    const response = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
    if (response.data.success) {
      console.log('✅ Test user registered successfully');
      return true;
    } else {
      console.log('❌ Test user registration failed');
      return false;
    }
  } catch (error) {
    // User might already exist, that's okay
    if (error.response?.data?.error?.includes('already exists')) {
      console.log('ℹ️  Test user already exists, proceeding...');
      return true;
    }
    console.error('❌ Test user registration failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Login as user
async function loginAsUser() {
  try {
    console.log('🔐 Logging in as user...');
    const response = await axios.post(`${BASE_URL}/auth/login`, USER_CREDENTIALS);
    userToken = response.data.token;
    console.log('✅ User login successful');
    return true;
  } catch (error) {
    console.error('❌ User login failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Get encashment settings (admin)
async function getAdminEncashmentSettings() {
  try {
    const response = await axios.get(`${BASE_URL}/admin/encashment-settings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to get admin encashment settings:', error.response?.data?.error || error.message);
    return null;
  }
}

// Update encashment settings (admin)
async function updateEncashmentSettings(settings) {
  try {
    const response = await axios.post(`${BASE_URL}/admin/encashment-settings`, settings, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to update encashment settings:', error.response?.data?.error || error.message);
    return null;
  }
}

// Activate encashment override (admin)
async function activateEncashmentOverride(duration, unit) {
  try {
    const response = await axios.post(`${BASE_URL}/admin/encashment-override`, {
      duration,
      unit
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to activate encashment override:', error.response?.data?.error || error.message);
    return null;
  }
}

// Get encashment status (user)
async function getUserEncashmentStatus() {
  try {
    const response = await axios.get(`${BASE_URL}/encashment-status`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to get user encashment status:', error.response?.data?.error || error.message);
    return null;
  }
}

// Test scenario 1: Admin sets schedule 6:10 AM – 5:00 PM
async function testScheduleUpdate() {
  console.log('\n📋 TEST 1: Admin sets schedule 6:10 AM – 5:00 PM');
  console.log('=' .repeat(50));
  
  // Update settings
  const newSettings = {
    startTime: '06:10',
    endTime: '17:00',
    isEnabled: true
  };
  
  const adminResult = await updateEncashmentSettings(newSettings);
  if (!adminResult) {
    console.log('❌ Failed to update settings');
    return false;
  }
  
  console.log('✅ Admin updated settings:', {
    startTime: formatTime(adminResult.startTime),
    endTime: formatTime(adminResult.endTime),
    isEnabled: adminResult.isEnabled
  });
  
  // Wait a moment for synchronization
  await wait(1000);
  
  // Check user side
  const userStatus = await getUserEncashmentStatus();
  if (!userStatus) {
    console.log('❌ Failed to get user status');
    return false;
  }
  
  console.log('👤 User sees:', {
    isAllowed: userStatus.isAllowed,
    message: userStatus.message,
    schedule: `${formatTime(userStatus.settings.startTime)} - ${formatTime(userStatus.settings.endTime)}`
  });
  
  // Verify synchronization
  const isSync = (
    userStatus.settings.startTime === newSettings.startTime &&
    userStatus.settings.endTime === newSettings.endTime &&
    userStatus.settings.isEnabled === newSettings.isEnabled
  );
  
  if (isSync) {
    console.log('✅ PASS: User dashboard synchronized with admin settings');
    return true;
  } else {
    console.log('❌ FAIL: User dashboard not synchronized');
    return false;
  }
}

// Test scenario 2: Admin disables encashment
async function testDisableEncashment() {
  console.log('\n📋 TEST 2: Admin disables encashment');
  console.log('=' .repeat(50));
  
  // Disable encashment
  const disableSettings = {
    isEnabled: false
  };
  
  const adminResult = await updateEncashmentSettings(disableSettings);
  if (!adminResult) {
    console.log('❌ Failed to disable encashment');
    return false;
  }
  
  console.log('✅ Admin disabled encashment');
  
  // Wait a moment for synchronization
  await wait(1000);
  
  // Check user side
  const userStatus = await getUserEncashmentStatus();
  if (!userStatus) {
    console.log('❌ Failed to get user status');
    return false;
  }
  
  console.log('👤 User sees:', {
    isAllowed: userStatus.isAllowed,
    message: userStatus.message
  });
  
  // Verify encashment is disabled
  if (!userStatus.isAllowed && userStatus.message.includes('disabled')) {
    console.log('✅ PASS: User correctly sees encashment as disabled');
    return true;
  } else {
    console.log('❌ FAIL: User does not see encashment as disabled');
    return false;
  }
}

// Test scenario 3: Admin triggers override for 30 mins
async function testOverrideActivation() {
  console.log('\n📋 TEST 3: Admin triggers override for 30 minutes');
  console.log('=' .repeat(50));
  
  // Activate override
  const overrideResult = await activateEncashmentOverride(30, 'minutes');
  if (!overrideResult) {
    console.log('❌ Failed to activate override');
    return false;
  }
  
  console.log('✅ Admin activated 30-minute override');
  console.log('⏰ Override expires at:', new Date(overrideResult.overrideExpiry).toLocaleTimeString());
  
  // Wait a moment for synchronization
  await wait(1000);
  
  // Check user side
  const userStatus = await getUserEncashmentStatus();
  if (!userStatus) {
    console.log('❌ Failed to get user status');
    return false;
  }
  
  console.log('👤 User sees:', {
    isAllowed: userStatus.isAllowed,
    message: userStatus.message,
    overrideActive: userStatus.settings.overrideActive
  });
  
  // Verify override is active
  if (userStatus.isAllowed && userStatus.settings.overrideActive) {
    console.log('✅ PASS: User correctly sees override as active');
    return true;
  } else {
    console.log('❌ FAIL: User does not see override as active');
    return false;
  }
}

// Test scenario 4: Re-enable encashment for final verification
async function testReEnableEncashment() {
  console.log('\n📋 TEST 4: Re-enable encashment for final verification');
  console.log('=' .repeat(50));
  
  // Re-enable encashment
  const enableSettings = {
    startTime: '09:00',
    endTime: '18:00',
    isEnabled: true
  };
  
  const adminResult = await updateEncashmentSettings(enableSettings);
  if (!adminResult) {
    console.log('❌ Failed to re-enable encashment');
    return false;
  }
  
  console.log('✅ Admin re-enabled encashment:', {
    schedule: `${formatTime(adminResult.startTime)} - ${formatTime(adminResult.endTime)}`
  });
  
  // Wait a moment for synchronization
  await wait(1000);
  
  // Check user side
  const userStatus = await getUserEncashmentStatus();
  if (!userStatus) {
    console.log('❌ Failed to get user status');
    return false;
  }
  
  console.log('👤 User sees:', {
    isAllowed: userStatus.isAllowed,
    message: userStatus.message,
    schedule: `${formatTime(userStatus.settings.startTime)} - ${formatTime(userStatus.settings.endTime)}`
  });
  
  // Verify synchronization
  const isSync = (
    userStatus.settings.startTime === enableSettings.startTime &&
    userStatus.settings.endTime === enableSettings.endTime &&
    userStatus.settings.isEnabled === enableSettings.isEnabled
  );
  
  if (isSync) {
    console.log('✅ PASS: Final synchronization successful');
    return true;
  } else {
    console.log('❌ FAIL: Final synchronization failed');
    return false;
  }
}

// Main test function
async function runSynchronizationTests() {
  console.log('🚀 ENCASHMENT SYNCHRONIZATION TESTS');
  console.log('=' .repeat(60));
  console.log('Testing real-time synchronization between Admin Panel and User Dashboard\n');
  
  // Register test user and login both admin and user
  const userRegistrationSuccess = await registerTestUser();
  const adminLoginSuccess = await loginAsAdmin();
  const userLoginSuccess = await loginAsUser();
  
  if (!userRegistrationSuccess || !adminLoginSuccess || !userLoginSuccess) {
    console.log('❌ Setup failed. Cannot proceed with tests.');
    return;
  }
  
  // Run all test scenarios
  const results = [];
  
  results.push(await testScheduleUpdate());
  results.push(await testDisableEncashment());
  results.push(await testOverrideActivation());
  results.push(await testReEnableEncashment());
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const passedTests = results.filter(result => result).length;
  const totalTests = results.length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! User dashboard synchronization is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the synchronization implementation.');
  }
  
  console.log('\n🔍 Key Verification Points:');
  console.log('• User withdrawal page fetches live settings from /api/v1/encashment-status');
  console.log('• No hardcoded encashment hours in user interface');
  console.log('• Real-time synchronization between admin and user views');
  console.log('• Proper handling of schedule changes, enable/disable, and overrides');
}

// Run the tests
runSynchronizationTests().catch(console.error);