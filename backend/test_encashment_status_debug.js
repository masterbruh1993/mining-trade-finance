const axios = require('axios');
const jwt = require('jsonwebtoken');

// Test the encashment status endpoint
async function testEncashmentStatus() {
    try {
        console.log('Testing encashment status endpoint...');
        
        // First, let's try to login to get a valid token
        const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
            emailOrUsername: 'test1',
            password: 'password123!'
        });
        
        console.log('Login successful:', loginResponse.data.success);
        const token = loginResponse.data.token;
        
        // Now test the encashment status endpoint
        const encashmentResponse = await axios.get('http://localhost:5000/api/v1/encashment-status', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('\n=== ENCASHMENT STATUS RESPONSE ===');
        console.log('Status Code:', encashmentResponse.status);
        console.log('Headers:', encashmentResponse.headers);
        console.log('Full Response Data:');
        console.log(JSON.stringify(encashmentResponse.data, null, 2));
        
        // Check if the response has the expected structure
        if (encashmentResponse.data.data && encashmentResponse.data.data.passiveWallet) {
            console.log('✅ Response has correct nested structure');
        } else {
            console.log('❌ Response does NOT have expected nested structure');
            console.log('Expected: data.passiveWallet and data.directBonusWallet');
            console.log('Actual keys in data:', Object.keys(encashmentResponse.data.data || {}));
        }
        
        // Also test the admin encashment settings endpoint
        const settingsResponse = await axios.get('http://localhost:5000/api/v1/admin/encashment-settings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('\n=== ADMIN ENCASHMENT SETTINGS ===');
        console.log(JSON.stringify(settingsResponse.data, null, 2));
        
    } catch (error) {
        console.error('Error testing encashment status:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testEncashmentStatus();