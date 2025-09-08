const mongoose = require('mongoose');
const User = require('./models/User');
const Investment = require('./models/Investment');
const Transaction = require('./models/Transaction');
const Wallet = require('./models/Wallet');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testRobustActivation() {
  try {
    console.log('=== Testing Robust Activation with ₱50,000 ===');
    
    const userId = '68b7a754259300b87d671396';
    const activationAmount = 50000;
    
    // Get user before activation
    const userBefore = await User.findById(userId);
    if (!userBefore) {
      console.log('User not found!');
      return;
    }
    
    console.log('User object fields:', Object.keys(userBefore.toObject()));
    console.log('creditWallet field:', userBefore.creditWallet);
    console.log('credit_wallet field:', userBefore.credit_wallet);
    console.log('balance field:', userBefore.balance);
    console.log('walletBalance field:', userBefore.walletBalance);
    
    // Determine the correct balance field
    let currentBalance;
    let balanceField;
    
    if (userBefore.creditWallet !== undefined) {
      currentBalance = userBefore.creditWallet;
      balanceField = 'creditWallet';
    } else if (userBefore.credit_wallet !== undefined) {
      currentBalance = userBefore.credit_wallet;
      balanceField = 'credit_wallet';
    } else if (userBefore.balance !== undefined) {
      currentBalance = userBefore.balance;
      balanceField = 'balance';
    } else if (userBefore.walletBalance !== undefined) {
      currentBalance = userBefore.walletBalance;
      balanceField = 'walletBalance';
    } else {
      console.log('No valid balance field found!');
      return;
    }
    
    console.log(`Using balance field: ${balanceField}, current value: ${currentBalance}`);
    
    // Check if user has enough balance
    if (currentBalance < activationAmount) {
      console.log('Insufficient balance for activation');
      console.log(`Current: ${currentBalance}, Required: ${activationAmount}`);
      return;
    }
    
    console.log(`Before deduction: ${balanceField} = ${userBefore[balanceField]}`);
    
    // Simulate the robust activation deduction
    userBefore[balanceField] -= activationAmount;
    console.log(`After deduction, before save: ${balanceField} = ${userBefore[balanceField]}`);
    
    // Save the user
    await userBefore.save({ validateBeforeSave: false });
    console.log(`After save operation: ${balanceField} = ${userBefore[balanceField]}`);
    
    // Verify by refetching
    const userAfter = await User.findById(userId);
    const finalBalance = userAfter[balanceField];
    console.log(`Refetched user balance: ${balanceField} = ${finalBalance}`);
    console.log(`Expected balance: ${currentBalance - activationAmount}, Actual balance: ${finalBalance}`);
    
    // Verify the deduction was successful
    if (finalBalance !== (currentBalance - activationAmount)) {
      console.error('❌ WARNING: Balance deduction failed!');
      console.error(`Expected: ${currentBalance - activationAmount}, Got: ${finalBalance}`);
    } else {
      console.log('✅ Balance deduction successful and verified');
    }
    
    // Create investment record
    const investment = await Investment.create({
      user: userId,
      amount: activationAmount,
      startDate: new Date(),
      maturityDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'active'
    });
    
    console.log('Investment created:', investment._id);
    
    // Create transaction record
    const transaction = await Transaction.create({
      user: userId,
      type: 'activation',
      amount: activationAmount,
      fee: 0,
      netAmount: activationAmount,
      walletType: 'credit',
      status: 'completed',
      description: `Investment activation - ₱${activationAmount}`
    });
    
    console.log('Transaction created:', transaction._id);
    
    // Final verification
    const finalUser = await User.findById(userId);
    const finalUserBalance = finalUser[balanceField];
    console.log('\n=== FINAL VERIFICATION ===');
    console.log('Original balance:', currentBalance);
    console.log('Activation amount:', activationAmount);
    console.log('Expected final balance:', currentBalance - activationAmount);
    console.log('Actual final balance:', finalUserBalance);
    console.log('Test result:', finalUserBalance === (currentBalance - activationAmount) ? '✅ SUCCESS' : '❌ FAILED');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testRobustActivation();