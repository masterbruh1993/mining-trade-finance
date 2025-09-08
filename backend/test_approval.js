const http = require('http');
require('dotenv').config();

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test payment approval API
async function testPaymentApproval() {
  try {
    console.log('🧪 Testing payment approval API...');
    
    // First, login as admin to get token
    console.log('1. Logging in as admin...');
    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = {
      emailOrUsername: 'admin',
      password: 'admin123!'
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.data)}`);
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful, token received');
    
    // Test payment approval
    console.log('2. Testing payment approval...');
    const paymentId = '68b7a2cdbbab4931eeabaf02'; // Latest test payment ID
    
    const approvalOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/payments/approve',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const approvalData = { paymentId };
    
    const approvalResponse = await makeRequest(approvalOptions, approvalData);
    
    console.log('✅ Payment approval response received!');
    console.log('Status:', approvalResponse.status);
    console.log('Response:', approvalResponse.data);
    
  } catch (error) {
    console.error('❌ Test failed!');
    console.error('Error:', error.message);
  }
}

// Run the test
testPaymentApproval();