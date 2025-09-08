require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function checkTestUserPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const testUser = await User.findOne({ email: 'test1@gmail.com' }).select('+password');
    
    if (!testUser) {
      console.log('Test user not found');
      return;
    }
    
    console.log('Test user found:', testUser.username);
    console.log('Hashed password:', testUser.password);
    
    // Test common passwords
    const testPasswords = ['password123', 'test123!', 'Test123!', 'password123!', 'test1234!'];
    
    for (const password of testPasswords) {
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

checkTestUserPassword();