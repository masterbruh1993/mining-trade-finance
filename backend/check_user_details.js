require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUserDetails() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Find the test user
    const testUser = await User.findOne({ email: 'test1@gmail.com' });
    
    if (testUser) {
      console.log('=== TEST USER DETAILS ===');
      console.log('ID:', testUser._id);
      console.log('Username:', testUser.username);
      console.log('Email:', testUser.email);
      console.log('Full Name:', testUser.fullName);
      console.log('Mobile Number:', testUser.mobileNumber);
      console.log('Role:', testUser.role);
      console.log('Wallet Balance:', testUser.walletBalance);
      console.log('Created:', testUser.createdAt);
    } else {
      console.log('Test user not found');
    }

    // Also check admin user
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (adminUser) {
      console.log('\n=== ADMIN USER DETAILS ===');
      console.log('ID:', adminUser._id);
      console.log('Username:', adminUser.username);
      console.log('Email:', adminUser.email);
      console.log('Full Name:', adminUser.fullName);
      console.log('Mobile Number:', adminUser.mobileNumber);
      console.log('Role:', adminUser.role);
      console.log('Wallet Balance:', adminUser.walletBalance);
      console.log('Created:', adminUser.createdAt);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkUserDetails();