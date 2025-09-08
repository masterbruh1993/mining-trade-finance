const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

async function checkAlankoCredentials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== CHECKING ALANKO CREDENTIALS ===');
    
    // Find alanko user
    const alanko = await User.findOne({ username: 'alanko' }).select('+password');
    
    if (!alanko) {
      console.log('❌ alanko user not found');
      return;
    }
    
    console.log('✅ alanko user found:');
    console.log(`   ID: ${alanko._id}`);
    console.log(`   Username: ${alanko.username}`);
    console.log(`   Email: ${alanko.email}`);
    console.log(`   Full Name: ${alanko.fullName}`);
    console.log(`   Mobile: ${alanko.mobileNumber}`);
    console.log(`   Role: ${alanko.role}`);
    console.log(`   Status: ${alanko.status}`);
    console.log(`   Password Hash: ${alanko.password}`);
    
    // Test different possible passwords
    const possiblePasswords = [
      'Password123!',
      'password123',
      'alanko123',
      'alanko',
      'Password123',
      'Test123!',
      'testpassword',
      'alan123',
      'ko123'
    ];
    
    console.log('\n=== TESTING POSSIBLE PASSWORDS ===');
    
    for (const password of possiblePasswords) {
      try {
        const isMatch = await bcrypt.compare(password, alanko.password);
        console.log(`Password "${password}": ${isMatch ? '✅ MATCH' : '❌ No match'}`);
        
        if (isMatch) {
          console.log(`\n🎉 FOUND CORRECT PASSWORD: "${password}"`);
          
          // Test the matchPassword method as well
          const methodMatch = await alanko.matchPassword(password);
          console.log(`matchPassword method result: ${methodMatch ? '✅ MATCH' : '❌ No match'}`);
          
          // Test if we can find the user by email too
          const userByEmail = await User.findOne({ email: alanko.email }).select('+password');
          if (userByEmail) {
            const emailMatch = await userByEmail.matchPassword(password);
            console.log(`Email lookup + matchPassword: ${emailMatch ? '✅ MATCH' : '❌ No match'}`);
          }
          
          break;
        }
      } catch (error) {
        console.log(`Password "${password}": ❌ Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkAlankoCredentials();