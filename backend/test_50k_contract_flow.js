require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Investment = require('./models/Investment');
const Transaction = require('./models/Transaction');
const EarningsService = require('./services/earningsService');

async function test50kContractFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find test user
    const testUser = await User.findOne({ email: 'test1@gmail.com' });
    if (!testUser) {
      console.log('Test user not found');
      return;
    }

    console.log('='.repeat(80));
    console.log('TESTING ₱50,000 CONTRACT WITH SINGLE ₱200,000 PAYOUT AT 60 DAYS');
    console.log('='.repeat(80));

    // Record initial state
    const initialPassiveWallet = testUser.passiveWallet;
    console.log(`\nInitial Passive Wallet: ₱${initialPassiveWallet.toLocaleString()}`);

    // Create a new ₱50,000 investment
    const startDate = new Date();
    const maturityDate = new Date(startDate.getTime() + 60*24*60*60*1000); // 60 days from start
    
    const investment = new Investment({
      user: testUser._id,
      amount: 50000,
      startDate: startDate,
      maturityDate: maturityDate,
      duration: 60,
      totalROI: 400, // 300% profit + 100% capital return = 400% total
      payoutPercent: 100, // 100% capital return at maturity
      payoutInterval: 60, // Single payout at end
      totalCycles: 1, // Single payout cycle
      status: 'active'
    });

    // Calculate expected payout (400% of investment)
    const expectedPayout = 50000 * 4; // ₱200,000 total

    await investment.save();
    console.log(`\nCreated ₱50,000 investment with ID: ${investment._id}`);
    console.log(`Expected single payout at maturity: ₱${expectedPayout.toLocaleString()}`);
    console.log(`Maturity date: ${maturityDate.toLocaleDateString()}`);
    console.log(`Duration: 60 days`);
    console.log(`Total ROI: 400% (300% profit + 100% capital return)`);

    // Function to simulate time passage and check maturity
    async function simulateMaturityCheck(days, description) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`${description} (Day ${days})`);
      console.log('='.repeat(60));

      // Simulate time passage by updating the investment's maturity date
       const updatedInvestment = await Investment.findById(investment._id);
       const simulatedMaturityDate = new Date();
       simulatedMaturityDate.setDate(simulatedMaturityDate.getDate() - (days - 60)); // Set maturity in past if days >= 60
       updatedInvestment.maturityDate = simulatedMaturityDate;
       await updatedInvestment.save();
      
      // Process earnings using EarningsService
      await EarningsService.processPendingPayouts();
      
      // Check results
      const processedInvestment = await Investment.findById(investment._id);
      const updatedUser = await User.findById(testUser._id);
      
      console.log(`\nInvestment Status:`);
      console.log(`- Status: ${processedInvestment.status}`);
      console.log(`- Days since start: ${days}`);
      console.log(`- Maturity reached: ${days >= 60 ? 'YES' : 'NO'}`);
      
      console.log(`\nWallet Status:`);
      console.log(`- Passive Wallet: ₱${updatedUser.passiveWallet.toLocaleString()}`);
      console.log(`- Total Earned: ₱${(updatedUser.passiveWallet - initialPassiveWallet).toLocaleString()}`);
      
      // Show recent transactions
      const recentTransactions = await Transaction.find({ 
        user: testUser._id,
        type: 'earning'
      }).sort({ createdAt: -1 }).limit(3);
      
      console.log(`\nRecent Payout Transactions:`);
      if (recentTransactions.length > 0) {
        recentTransactions.forEach((tx, index) => {
          console.log(`${index + 1}. ₱${tx.amount.toLocaleString()} - ${tx.description}`);
        });
      } else {
        console.log('No payout transactions yet (payout only occurs at 60-day maturity)');
      }
    }

    // Test sequence
    await simulateMaturityCheck(30, 'After 30 days - Halfway to maturity');
    await simulateMaturityCheck(59, 'After 59 days - One day before maturity');
    await simulateMaturityCheck(60, 'After 60 days - Maturity reached');
    await simulateMaturityCheck(61, 'After 61 days - Post maturity verification');

    // Final verification
    console.log(`\n${'='.repeat(80)}`);
    console.log('FINAL VERIFICATION');
    console.log('='.repeat(80));
    
    const finalInvestment = await Investment.findById(investment._id);
    const finalUser = await User.findById(testUser._id);
    const totalEarned = finalUser.passiveWallet - initialPassiveWallet;
    
    console.log(`\nContract Summary:`);
    console.log(`- Investment Amount: ₱${finalInvestment.amount.toLocaleString()}`);
    console.log(`- Contract Status: ${finalInvestment.status}`);
    console.log(`- Total Earned: ₱${totalEarned.toLocaleString()}`);
    console.log(`- Expected Total: ₱${expectedPayout.toLocaleString()}`);
    console.log(`- Match Expected: ${totalEarned === expectedPayout ? '✅ YES' : '❌ NO'}`);
    
    if (finalInvestment.status === 'completed' && totalEarned === expectedPayout) {
      console.log(`\n🎉 SUCCESS: ₱50,000 contract completed successfully with 400% ROI!`);
    } else {
      console.log(`\n⚠️  WARNING: Contract not fully completed as expected`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

test50kContractFlow();