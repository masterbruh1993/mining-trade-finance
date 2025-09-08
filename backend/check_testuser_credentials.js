const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

async function checkTestUserCredentials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== CHECKING TESTUSER CREDENTIALS ===');
    
    // Find testuser
    const testUser = await User.findOne({ username: 'testuser' }).select('+password');
    
    if (!testUser) {
      console.log('❌ testuser not found');
      return;
    }
    
    console.log('✅ testuser found:');
    console.log(`   ID: ${testUser._id}`);
    console.log(`   Username: ${testUser.username}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Full Name: ${testUser.fullName}`);
    console.log(`   Mobile: ${testUser.mobileNumber}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Status: ${testUser.status}`);
    console.log(`   Password Hash: ${testUser.password}`);
    
    // Test different possible passwords
    const possiblePasswords = [
      'password123',
      'testpassword',
      'test123',
      'password',
      'testuser123',
      'Test123!',
      'testuser'
    ];
    
    console.log('\n=== TESTING POSSIBLE PASSWORDS ===');
    
    for (const password of possiblePasswords) {
      try {
        const isMatch = await bcrypt.compare(password, testUser.password);
        console.log(`Password "${password}": ${isMatch ? '✅ MATCH' : '❌ No match'}`);
        
        if (isMatch) {
          console.log(`\n🎉 FOUND CORRECT PASSWORD: "${password}"`);
          
          // Test the matchPassword method as well
          const methodMatch = await testUser.matchPassword(password);
          console.log(`matchPassword method result: ${methodMatch ? '✅ MATCH' : '❌ No match'}`);
          break;
        }
      } catch (error) {
        console.log(`Password "${password}": ❌ Error - ${error.message}`);
      }
    }
    
    // Also check if we can find any users with known passwords
    console.log('\n=== CHECKING ALL USERS ===');
    const allUsers = await User.find({}).select('username email fullName');
    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - ${user.fullName}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkTestUserCredentials();