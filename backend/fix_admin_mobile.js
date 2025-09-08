require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function fixAdminMobile() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Update admin mobile number to valid Philippines format
    const result = await User.findOneAndUpdate(
      { role: 'admin' },
      { mobileNumber: '09123456789' }, // Valid Philippines mobile format
      { runValidators: false, new: true }
    );

    if (result) {
      console.log('✅ Admin mobile number updated successfully!');
      console.log('New mobile number:', result.mobileNumber);
    } else {
      console.log('❌ Admin user not found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixAdminMobile();