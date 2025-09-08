const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const fixAlankoPassword = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/1uptrade');
    console.log('Connected to MongoDB');

    // Find alanko user
    const user = await User.findOne({ username: 'alanko' }).select('+password');
    if (!user) {
      console.log('❌ User alanko not found');
      return;
    }

    console.log('=== CURRENT USER DATA ===');
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Current password hash:', user.password);

    // Test current password
    const currentMatch = await bcrypt.compare('Password123!', user.password);
    console.log('Current password matches:', currentMatch);

    if (!currentMatch) {
      console.log('\n=== FIXING PASSWORD ===');
      
      // Manually hash the password and update directly
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Password123!', salt);
      
      // Update without triggering pre-save hooks
      await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log('✅ Password updated directly in database');
      
      // Verify the fix
      const updatedUser = await User.findById(user._id).select('+password');
      const newMatch = await bcrypt.compare('Password123!', updatedUser.password);
      console.log('New password matches:', newMatch);
      
      if (newMatch) {
        console.log('✅ Password fix successful!');
      } else {
        console.log('❌ Password fix failed');
      }
    } else {
      console.log('✅ Password is already correct');
    }

    // Test the matchPassword method
    console.log('\n=== TESTING MATCHPASSWORD METHOD ===');
    const methodMatch = await user.matchPassword('Password123!');
    console.log('matchPassword method result:', methodMatch);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

fixAlankoPassword();