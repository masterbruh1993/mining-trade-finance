const mongoose = require('mongoose');
require('dotenv').config();

async function testExistingUsers() {
  try {
    console.log('=== CHECKING EXISTING USERS ===');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('./models/User');
    
    // Find all users
    const users = await User.find({}).select('username email role status').limit(10);
    
    console.log('\nFound users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - Role: ${user.role}, Status: ${user.status}`);
    });
    
    // Find a regular user to test with
    const regularUser = users.find(user => user.role === 'user');
    
    if (regularUser) {
      console.log(`\n✅ Found regular user for testing: ${regularUser.username} (${regularUser.email})`);
      
      // Test login with this user (try common passwords)
      const axios = require('axios');
      const BASE_URL = 'http://localhost:5000/api/v1';
      
      const commonPasswords = ['testpass123!', 'password123!', 'user123!', 'Password123!'];
      
      for (const password of commonPasswords) {
        try {
          console.log(`\nTrying password: ${password}`);
          const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            emailOrUsername: regularUser.email,
            password: password
          });
          
          if (loginResponse.data.success) {
            console.log(`✅ Login successful with password: ${password}`);
            
            // Test dashboard
            const token = loginResponse.data.token;
            const dashboardResponse = await axios.get(`${BASE_URL}/dashboard`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('✅ Dashboard API successful');
            console.log('User dashboard data:', JSON.stringify(dashboardResponse.data.data, null, 2));
            break;
          }
        } catch (error) {
          console.log(`❌ Password ${password} failed`);
        }
      }
    } else {
      console.log('❌ No regular users found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testExistingUsers();