const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api/v1';

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: 'admin@1uptrade.com',
      password: 'admin123!'
    });
    
    console.log('Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Full error:', error.response?.data);
  }
}

testAdminLogin();