const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function addCreditBalance() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    // Find test user
    const testUser = await User.findOne({ email: 'test1@gmail.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('✅ Found test user:', testUser.username);
    console.log('   Current Credit Wallet Balance:', testUser.creditWallet || 0);

    // Add ₱100,000 to credit wallet for testing
    const addAmount = 100000;
    const previousBalance = testUser.creditWallet || 0;
    
    await User.findByIdAndUpdate(
      testUser._id,
      { $inc: { creditWallet: addAmount } },
      { new: true }
    );

    // Verify the update
    const updatedUser = await User.findById(testUser._id);
    console.log('✅ Credit Wallet Updated:');
    console.log('   Previous Balance: ₱' + previousBalance.toLocaleString());
    console.log('   Added Amount: ₱' + addAmount.toLocaleString());
    console.log('   New Balance: ₱' + (updatedUser.creditWallet || 0).toLocaleString());

    console.log('\n🎉 Credit balance added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the script
addCreditBalance();