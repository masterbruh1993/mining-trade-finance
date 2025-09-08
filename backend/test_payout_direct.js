const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/db');
const PayoutService = require('./services/payoutService');
const Investment = require('./models/Investment');
const User = require('./models/User');
const Payout = require('./models/Payout');

async function testPayoutDirect() {
  console.log('🚀 Testing Payout System Directly');
  
  try {
    // Connect to database
    await connectDB();
    
    // Get all active investments
    const activeInvestments = await Investment.find({ status: 'active' })
      .populate('user', 'email username wallets');
    
    console.log(`📊 Found ${activeInvestments.length} active investments`);
    
    if (activeInvestments.length > 0) {
      const investment = activeInvestments[0];
      console.log(`\n📋 Testing with investment:`);
      console.log(`   User: ${investment.user.email}`);
      console.log(`   Amount: ₱${investment.amount.toLocaleString()}`);
      console.log(`   Start Date: ${investment.startDate.toDateString()}`);
      console.log(`   Current Payouts: ${investment.payouts?.length || 0}`);
      console.log(`   User Passive Wallet: ₱${investment.user.wallets?.passive?.balance || 0}`);
    }
    
    // Get current payout count
    const payoutsBefore = await Payout.countDocuments();
    console.log(`\n💰 Payouts in database before: ${payoutsBefore}`);
    
    // Trigger payout processing
    console.log('\n🔄 Triggering payout processing...');
    await PayoutService.triggerPayouts();
    console.log('✅ Payout processing completed');
    
    // Check results
    const payoutsAfter = await Payout.countDocuments();
    console.log(`💰 Payouts in database after: ${payoutsAfter}`);
    console.log(`📈 New payouts created: ${payoutsAfter - payoutsBefore}`);
    
    // Show recent payouts
    const recentPayouts = await Payout.find({})
      .sort({ dateReleased: -1 })
      .limit(5)
      .populate('userId', 'email')
      .populate('contractId', 'amount');
    
    console.log('\n🎯 Recent payouts:');
    recentPayouts.forEach((payout, index) => {
      console.log(`  ${index + 1}. User: ${payout.userId.email}`);
      console.log(`     Amount: ₱${payout.amount.toLocaleString()}`);
      console.log(`     Cycle: ${payout.cycle}`);
      console.log(`     Date: ${payout.dateReleased.toDateString()}`);
    });
    
    // Check updated investments
    const updatedInvestments = await Investment.find({ status: 'active' })
      .populate('user', 'email wallets');
    
    console.log('\n📊 Updated investments:');
    updatedInvestments.forEach((investment, index) => {
      console.log(`  ${index + 1}. User: ${investment.user.email}`);
      console.log(`     Amount: ₱${investment.amount.toLocaleString()}`);
      console.log(`     Payouts: ${investment.payouts?.length || 0}/5`);
      console.log(`     Status: ${investment.status}`);
      console.log(`     User Passive Wallet: ₱${investment.user.wallets?.passive?.balance || 0}`);
    });
    
    console.log('\n✅ Direct payout test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

testPayoutDirect();