require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function updateTestUserPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const testUser = await User.findOne({ email: 'test1@gmail.com' });
    
    if (!testUser) {
      console.log('Test user not found');
      return;
    }
    
    console.log('Found test user:', testUser.username);
    
    // Hash the new password
    const newPassword = 'password123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password
    await User.findByIdAndUpdate(testUser._id, { password: hashedPassword });
    
    console.log(`✅ Test user password updated to: ${newPassword}`);
    
    // Verify the password works
    const updatedUser = await User.findById(testUser._id).select('+password');
    const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
    console.log(`Password verification: ${isMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateTestUserPassword();