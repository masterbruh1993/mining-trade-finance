const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const Investment = require('./models/Investment');
const User = require('./models/User');
const EarningsService = require('./services/earningsService');

async function testPayoutDebug() {
  try {
    await connectDB();
    console.log('🚀 Starting Payout Debug Test');
    
    // Find a test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('✅ Found test user:', testUser.username);
    console.log('💰 Current passive wallet:', testUser.passiveWallet);
    
    // Find active investments for this user
    const activeInvestments = await Investment.find({
      user: testUser._id,
      status: 'active'
    });
    
    console.log(`📊 Found ${activeInvestments.length} active investments`);
    
    if (activeInvestments.length === 0) {
      console.log('❌ No active investments found');
      return;
    }
    
    // Check the first investment's payout schedule
    const investment = activeInvestments[0];
    console.log('\n📋 Investment Details:');
    console.log('   ID:', investment._id);
    console.log('   Amount:', investment.amount);
    console.log('   Start Date:', investment.startDate);
    console.log('   Status:', investment.status);
    console.log('   Total Payouts:', investment.totalPayouts);
    console.log('   Remaining Payouts:', investment.remainingPayouts);
    
    console.log('\n📅 Payout Schedule:');
    investment.payoutSchedule.forEach((payout, index) => {
      console.log(`   Payout ${index + 1}:`);
      console.log(`     Date: ${payout.payoutDate}`);
      console.log(`     Amount: ₱${payout.payoutAmount}`);
      console.log(`     Status: ${payout.status}`);
      console.log(`     Due: ${new Date() >= payout.payoutDate ? 'YES' : 'NO'}`);
    });
    
    // Manually update the first payout to be due now
    console.log('\n🔧 Making first payout due now...');
    const now = new Date();
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
    
    await Investment.updateOne(
      { _id: investment._id },
      { 
        $set: {
          'payoutSchedule.0.payoutDate': pastDate,
          'payoutSchedule.0.status': 'pending'
        }
      }
    );
    
    console.log('✅ Updated first payout to be due');
    
    // Check the updated investment
    const updatedInvestment = await Investment.findById(investment._id);
    console.log('\n📅 Updated Payout Schedule:');
    updatedInvestment.payoutSchedule.forEach((payout, index) => {
      console.log(`   Payout ${index + 1}:`);
      console.log(`     Date: ${payout.payoutDate}`);
      console.log(`     Amount: ₱${payout.payoutAmount}`);
      console.log(`     Status: ${payout.status}`);
      console.log(`     Due: ${new Date() >= payout.payoutDate ? 'YES' : 'NO'}`);
    });
    
    // Now try to process payouts
    console.log('\n🔄 Processing payouts...');
    await EarningsService.processPendingPayouts();
    
    // Check the results
    const finalUser = await User.findById(testUser._id);
    const finalInvestment = await Investment.findById(investment._id);
    
    console.log('\n📊 Final Results:');
    console.log('   User passive wallet:', finalUser.passiveWallet);
    console.log('   Investment total payouts:', finalInvestment.totalPayouts);
    console.log('   Investment remaining payouts:', finalInvestment.remainingPayouts);
    
    console.log('\n📅 Final Payout Schedule:');
    finalInvestment.payoutSchedule.forEach((payout, index) => {
      console.log(`   Payout ${index + 1}: ${payout.status} - ₱${payout.payoutAmount}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testPayoutDebug();