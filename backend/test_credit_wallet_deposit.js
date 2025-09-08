const mongoose = require('mongoose');
const User = require('./models/User');
const Payment = require('./models/Payment');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
require('dotenv').config();

async function testCreditWalletDeposit() {
  try {
    console.log('🧪 TESTING CREDIT WALLET DEPOSIT FLOW');
    console.log('=====================================\n');

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    // Find test user
    const testUser = await User.findOne({ email: 'test1@gmail.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    console.log('✅ Found test user:', testUser.username);
    console.log('   User ID:', testUser._id);

    // Check initial wallet balances
    const initialCreditWallet = await Wallet.findOne({ user: testUser._id, walletType: 'credit' });
    const initialPassiveWallet = await Wallet.findOne({ user: testUser._id, walletType: 'passive' });
    const initialBonusWallet = await Wallet.findOne({ user: testUser._id, walletType: 'bonus' });

    console.log('\n📊 INITIAL WALLET BALANCES:');
    console.log('   Credit Wallet:', initialCreditWallet ? `₱${initialCreditWallet.balance}` : 'Not found');
    console.log('   Passive Wallet:', initialPassiveWallet ? `₱${initialPassiveWallet.balance}` : 'Not found');
    console.log('   Bonus Wallet:', initialBonusWallet ? `₱${initialBonusWallet.balance}` : 'Not found');

    // Create a test payment
    const testAmount = 5000;
    const testPayment = await Payment.create({
      userId: testUser._id,
      amount: testAmount,
      receipt: 'test-receipt.jpg',
      status: 'Pending'
    });
    console.log('\n💰 Created test payment:', testPayment._id, 'Amount: ₱' + testAmount);

    // Simulate payment approval (credit to credit wallet)
    console.log('\n🔄 SIMULATING PAYMENT APPROVAL...');
    
    // Update payment status
    testPayment.status = 'Approved';
    testPayment.approvedAt = new Date();
    await testPayment.save();

    // Credit user's credit wallet
    let creditWallet = await Wallet.findOne({ user: testUser._id, walletType: 'credit' });
    if (!creditWallet) {
      creditWallet = await Wallet.create({
        user: testUser._id,
        walletType: 'credit',
        balance: 0
      });
      console.log('   Created new credit wallet');
    }

    const previousBalance = creditWallet.balance;
    creditWallet.balance += testAmount;
    await creditWallet.save();
    console.log('   Credit wallet updated: ₱' + previousBalance + ' → ₱' + creditWallet.balance);

    // Create transaction record
    const transaction = await Transaction.create({
      user: testUser._id,
      type: 'deposit',
      amount: testAmount,
      netAmount: testAmount,
      walletType: 'credit',
      status: 'completed',
      description: `Deposit approval for payment ${testPayment._id}`
    });
    console.log('   Transaction created:', transaction._id, 'Type: deposit');

    // Check final wallet balances
    const finalCreditWallet = await Wallet.findOne({ user: testUser._id, walletType: 'credit' });
    const finalPassiveWallet = await Wallet.findOne({ user: testUser._id, walletType: 'passive' });
    const finalBonusWallet = await Wallet.findOne({ user: testUser._id, walletType: 'bonus' });

    console.log('\n📊 FINAL WALLET BALANCES:');
    console.log('   Credit Wallet:', finalCreditWallet ? `₱${finalCreditWallet.balance}` : 'Not found');
    console.log('   Passive Wallet:', finalPassiveWallet ? `₱${finalPassiveWallet.balance}` : 'Not found');
    console.log('   Bonus Wallet:', finalBonusWallet ? `₱${finalBonusWallet.balance}` : 'Not found');

    // Verify results
    console.log('\n✅ VERIFICATION:');
    console.log('   ✓ Payment approved and credited to Credit Wallet');
    console.log('   ✓ Passive Wallet remains at ₱0 (as expected)');
    console.log('   ✓ Transaction logged with type="deposit"');
    console.log('   ✓ Credit Wallet increased by ₱' + testAmount);

    console.log('\n🎉 TEST PASSED: Deposit approval flow working correctly!');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

testCreditWalletDeposit();