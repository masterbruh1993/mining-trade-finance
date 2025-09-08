require('dotenv').config();
const mongoose = require('mongoose');
const PayoutService = require('./services/payoutService');
const Investment = require('./models/Investment');
const Wallet = require('./models/Wallet');
const User = require('./models/User');

async function testManualPayout() {
  try {
    console.log('=== Manual Payout Test ===');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // Find a test contract to simulate payout
    const testContract = await Investment.findOne({ 
      status: 'active',
      amount: { $gte: 10000 } // Find a contract with at least ₱10,000
    }).populate('user');
    
    if (!testContract) {
      console.log('❌ No suitable test contract found');
      return;
    }
    
    console.log(`\n=== Test Contract Details ===`);
    console.log(`Contract ID: ${testContract._id}`);
    console.log(`User: ${testContract.user.email}`);
    console.log(`Amount: ₱${testContract.amount.toLocaleString()}`);
    console.log(`Current Payouts: ${testContract.payouts.length}/5`);
    console.log(`Start Date: ${testContract.startDate}`);
    
    // Check user's passive wallet before payout
    const passiveWallet = await Wallet.findOne({ 
      user: testContract.user._id, 
      walletType: 'passive' 
    });
    
    const beforeBalance = passiveWallet?.balance || 0;
    console.log(`\n=== Before Payout ===`);
    console.log(`Passive Wallet Balance: ₱${beforeBalance.toLocaleString()}`);
    
    // Manually simulate a payout by updating the contract's start date
    // to make it eligible for a payout (3 days ago)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    await Investment.findByIdAndUpdate(testContract._id, {
      startDate: threeDaysAgo
    });
    
    console.log(`\n=== Processing Manual Payout ===`);
    console.log('Updated contract start date to 3 days ago to trigger payout...');
    
    // Process the payout
    await PayoutService.processPayouts();
    
    // Check results
    const updatedContract = await Investment.findById(testContract._id);
    const updatedWallet = await Wallet.findOne({ 
      user: testContract.user._id, 
      walletType: 'passive' 
    });
    
    const afterBalance = updatedWallet?.balance || 0;
    const expectedPayout = testContract.amount * 0.30;
    
    console.log(`\n=== After Payout ===`);
    console.log(`Contract Payouts: ${updatedContract.payouts.length}/5`);
    console.log(`Passive Wallet Balance: ₱${afterBalance.toLocaleString()}`);
    console.log(`Expected Payout: ₱${expectedPayout.toLocaleString()}`);
    console.log(`Actual Increase: ₱${(afterBalance - beforeBalance).toLocaleString()}`);
    
    if (afterBalance - beforeBalance === expectedPayout) {
      console.log('\n🎉 SUCCESS: Payout processed correctly!');
    } else {
      console.log('\n❌ FAILED: Payout amount mismatch');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

testManualPayout();