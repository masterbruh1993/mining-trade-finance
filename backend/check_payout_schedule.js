const mongoose = require('mongoose');
require('dotenv').config();

const Investment = require('./models/Investment');

async function checkPayoutSchedule() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const investment = await Investment.findOne({status: 'active'});
    if (!investment) {
      console.log('No active investment found');
      return;
    }
    
    console.log(`\nContract ID: ${investment._id}`);
    console.log(`Amount: ₱${investment.amount.toLocaleString()}`);
    console.log(`Total Payouts: ${investment.totalPayouts}`);
    console.log(`Remaining Payouts: ${investment.remainingPayouts}`);
    console.log(`\nPayout Schedule:`);
    
    investment.payoutSchedule.forEach((payout, index) => {
      console.log(`  Payout ${index + 1}:`);
      console.log(`    Amount: ₱${payout.payoutAmount.toLocaleString()}`);
      console.log(`    Date: ${payout.payoutDate}`);
      console.log(`    Status: ${payout.status}`);
      console.log(`    Completed At: ${payout.completedAt || 'N/A'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPayoutSchedule();