require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const Withdrawal = require('./models/Withdrawal');
const User = require('./models/User');

async function cleanupTestWithdrawals() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find test user
    const testUser = await User.findOne({ username: 'testuser123' });
    if (!testUser) {
      console.log('❌ Test user not found');
      process.exit(1);
    }

    console.log(`🔍 Found test user: ${testUser._id}`);

    // Note: We only delete Withdrawal records, not Transaction records
    // Transaction records are needed for dashboard calculations (Total Earnings, Encashment Total)

    // Delete all withdrawal records for test user
    const withdrawalResult = await Withdrawal.deleteMany({
      user: testUser._id
    });

    console.log(`🗑️ Deleted ${withdrawalResult.deletedCount} withdrawal records for test user`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up test withdrawals:', error);
    process.exit(1);
  }
}

cleanupTestWithdrawals();