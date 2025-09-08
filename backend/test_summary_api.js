require('dotenv').config();
const axios = require('axios');

async function testSummaryAPI() {
  try {
    console.log('=== Testing Summary API ===\n');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      emailOrUsername: 'test1',
      password: 'password123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test summary endpoint
    const summaryResponse = await axios.get('http://localhost:5000/api/v1/contracts/summary', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Summary API Response:');
    console.log(JSON.stringify(summaryResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSummaryAPI();