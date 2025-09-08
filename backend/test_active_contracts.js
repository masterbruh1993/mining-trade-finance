const axios = require('axios');

// Test the active contracts endpoint
const testActiveContracts = async () => {
  try {
    // You'll need to replace this with a valid JWT token from a logged-in user
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjdhNzU0MjU5MzAwYjg3ZDY3MTM5NiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU2OTEwMzI4LCJleHAiOjE3NTY5OTY3Mjh9.o1RItZUs3H4rA5bwF18OPShXW7zbyDN1cNj1xwIqtI4';
    
    console.log('Testing active contracts endpoint...');
    
    const response = await axios.get('http://localhost:5000/api/v1/investments/active', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.status === 'success') {
      console.log('✅ Active contracts endpoint working correctly!');
      console.log(`Found ${response.data.data.length} active contracts`);
      
      response.data.data.forEach((contract, index) => {
        console.log(`\nContract ${index + 1}:`);
        console.log(`  Amount: ₱${contract.amount.toLocaleString()}`);
        console.log(`  Status: ${contract.status}`);
        console.log(`  Days Left: ${contract.daysLeft}`);
        console.log(`  Expected Return: ₱${contract.expectedReturn.toLocaleString()}`);
        console.log(`  Start Date: ${new Date(contract.startDate).toLocaleDateString()}`);
        console.log(`  Maturity Date: ${new Date(contract.maturityDate).toLocaleDateString()}`);
      });
    } else {
      console.log('❌ Unexpected response format');
    }
    
  } catch (error) {
    console.error('❌ Error testing active contracts endpoint:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

testActiveContracts();