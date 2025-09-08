require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const debugUserUpdate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // Find alanko user
    const user = await User.findOne({ username: 'alanko' });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log(`📋 User found: ${user.username}`);
    console.log(`   Current bonusWallet: ₱${user.bonusWallet}`);
    console.log(`   User ID: ${user._id}`);
    
    // Test increment
    const testAmount = 100;
    console.log(`\n🧪 Testing increment of ₱${testAmount}...`);
    
    const updateResult = await User.findByIdAndUpdate(
      user._id,
      { $inc: { bonusWallet: testAmount } },
      { new: true }
    );
    
    console.log(`✅ Update result:`);
    console.log(`   New bonusWallet: ₱${updateResult.bonusWallet}`);
    console.log(`   Expected: ₱${user.bonusWallet + testAmount}`);
    console.log(`   Success: ${updateResult.bonusWallet === (user.bonusWallet + testAmount)}`);
    
    // Verify by fetching again
    const verifyUser = await User.findById(user._id);
    console.log(`\n🔍 Verification fetch:`);
    console.log(`   Fetched bonusWallet: ₱${verifyUser.bonusWallet}`);
    console.log(`   Matches update result: ${verifyUser.bonusWallet === updateResult.bonusWallet}`);
    
    // Revert the test change
    await User.findByIdAndUpdate(
      user._id,
      { $inc: { bonusWallet: -testAmount } }
    );
    
    console.log(`\n✅ Test completed and reverted`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

debugUserUpdate();