const axios = require('axios');

// Test encashment API endpoints
async function testEncashmentAPI() {
  try {
    console.log('Testing Encashment API...');
    
    // Step 1: Login as admin to get token
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      emailOrUsername: 'admin@1uptrade.com',
      password: 'admin123!' // Default admin password
    });
    
    const adminToken = loginResponse.data.token;
    console.log('Admin login successful, token obtained');
    
    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Test GET encashment settings
    console.log('\n2. Testing GET /api/v1/admin/encashment-settings...');
    const getResponse = await axios.get('http://localhost:5000/api/v1/admin/encashment-settings', { headers });
    console.log('GET Response:', JSON.stringify(getResponse.data, null, 2));
    
    // Step 3: Test POST encashment settings update
    console.log('\n3. Testing POST /api/v1/admin/encashment-settings...');
    const updateData = {
      startTime: '09:00',
      endTime: '17:00',
      isEnabled: true
    };
    
    const postResponse = await axios.post('http://localhost:5000/api/v1/admin/encashment-settings', updateData, { headers });
    console.log('POST Response:', JSON.stringify(postResponse.data, null, 2));
    
    // Step 4: Test encashment override
    console.log('\n4. Testing POST /api/v1/admin/encashment-override...');
    const overrideData = {
      duration: 30,
      unit: 'minutes'
    };
    
    const overrideResponse = await axios.post('http://localhost:5000/api/v1/admin/encashment-override', overrideData, { headers });
    console.log('Override Response:', JSON.stringify(overrideResponse.data, null, 2));
    
    console.log('\n✅ All encashment API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing encashment API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testEncashmentAPI();