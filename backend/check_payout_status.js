require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Investment = require('./models/Investment');
const User = require('./models/User');
const EarningsService = require('./services/earningsService');

async function checkPayoutStatus() {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    // Find the test user first
    const testUser = await User.findOne({ email: 'test1@gmail.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    // Find all active investments for the test user
    const investments = await Investment.find({ 
      status: 'active',
      user: testUser._id
    }).populate('user');
    
    if (investments.length === 0) {
      console.log('❌ No active investments found for test user');
      return;
    }

    console.log(`\n📊 Found ${investments.length} active investments for test user`);
    
    investments.forEach((investment, index) => {
      console.log(`\n📊 Investment ${index + 1} Details:`);
      console.log(`ID: ${investment._id}`);
      console.log(`Amount: ₱${investment.amount.toLocaleString()}`);
      console.log(`Status: ${investment.status}`);
      console.log(`Total Payouts: ${investment.totalPayouts}`);
      console.log(`Remaining Payouts: ${investment.remainingPayouts}`);
      
      console.log(`\n📅 Payout Schedule:`);
      investment.payoutSchedule.forEach((payout, payoutIndex) => {
        console.log(`  Payout ${payoutIndex + 1}:`);
        console.log(`    Status: ${payout.status}`);
        console.log(`    Amount: ₱${payout.payoutAmount.toLocaleString()}`);
        console.log(`    Date: ${payout.payoutDate.toLocaleDateString()}`);
        console.log(`    Completed At: ${payout.completedAt ? payout.completedAt.toLocaleString() : 'N/A'}`);
      });

      // Test progress calculation
      const progress = EarningsService.getInvestmentProgress(investment);
      console.log(`\n📈 Progress Calculation:`);
      console.log(`  Completed: ${progress.completed}`);
      console.log(`  Total: ${progress.total}`);
      console.log(`  Percentage: ${progress.percentage}%`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Disconnected from database');
  }
}

checkPayoutStatus();