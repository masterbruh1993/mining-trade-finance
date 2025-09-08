const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/1uptrade')
  .then(() => {
    console.log('Connected to MongoDB');
    checkUsers();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import User model
const User = require('./models/User');

async function checkUsers() {
  try {
    console.log('\n=== CHECKING USERS ===');
    
    // Get all users
    const allUsers = await User.find().select('username email role createdAt');
    console.log(`Total users in database: ${allUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log('\nUser details:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user._id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('---');
      });
    } else {
      console.log('No users found.');
    }
    
    // Get admin users specifically
    const adminUsers = await User.find({ role: 'admin' }).select('username email role');
    console.log(`\nAdmin users: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log('\nAdmin user details:');
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log('---');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
}