require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function checkTestUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const testUser = await User.findOne({ email: 'test@example.com' }).select('+password');
    
    if (!testUser) {
      console.log('❌ Test user not found with email: test@example.com');
      return;
    }
    
    console.log('✅ Found test user:', testUser.username, testUser.email);
    
    // Test different passwords
    const passwords = ['password123', 'password123!', 'test123', 'test123!'];
    
    for (const password of passwords) {
      const isMatch = await bcrypt.compare(password, testUser.password);
      console.log(`Password '${password}': ${isMatch ? '✅ MATCH' : '❌ No match'}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkTestUser();