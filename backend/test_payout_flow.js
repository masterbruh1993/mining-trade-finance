const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models and services
const connectDB = require('./config/db');
const User = require('./models/User');
const Investment = require('./models/Investment');
const Payout = require('./models/Payout');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const PayoutService = require('./services/payoutService');
const EarningsService = require('./services/earningsService');

const BASE_URL = 'http://localhost:5000/api/v1';

class PayoutFlowTester {
  constructor() {
    this.token = null;
    this.userId = null;
    this.testContracts = [];
  }

  async login() {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        emailOrUsername: 'test1@gmail.com',
        password: 'password123!'
      });
      
      this.token = response.data.token;
      this.userId = response.data.data.id;
      console.log('✅ Login successful');
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data?.message || error.message);
      return false;
    }
  }

  async createTestContract(amount) {
    try {
      const response = await axios.post(
        `${BASE_URL}/investments/activate`,
        { amount },
        { headers: { Authorization: `Bearer ${this.token}` } }
      );
      
      const contract = response.data.data;
      this.testContracts.push(contract.investment);
      console.log(`✅ Created test contract: ₱${amount.toLocaleString()} (ID: ${contract.investment._id})`);
      return contract.investment;
    } catch (error) {
      console.error(`❌ Failed to create contract:`, error.response?.data?.message || error.message);
      return null;
    }
  }

  async simulateTimePassage(contractId, totalDays) {
    try {
      // Get the current contract
      const contract = await Investment.findById(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Calculate how many payouts should be due based on total days passed
      const now = new Date();
      const payoutsDue = Math.floor(totalDays / 3);
      
      // Update each payout date
      contract.payoutSchedule.forEach((payout, index) => {
        if (index < payoutsDue) {
          // Make due payouts overdue by setting them to the past
          payout.payoutDate = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 1 day ago
        } else {
          // Set future payouts to their correct future dates
          const daysUntilPayout = (index + 1) * 3 - totalDays;
          payout.payoutDate = new Date(now.getTime() + (daysUntilPayout * 24 * 60 * 60 * 1000));
        }
      });
       
       await contract.save();
      
      console.log(`✅ Simulated ${totalDays} days passage for contract ${contractId} (${payoutsDue} payouts due)`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to simulate time passage:`, error.message);
      return false;
    }
  }

  async triggerPayouts() {
    try {
      console.log('🔄 Triggering manual payout processing...');
      await EarningsService.processPendingPayouts();
      console.log('✅ Payout processing completed');
      return true;
    } catch (error) {
      console.error('❌ Payout processing failed:', error.message);
      return false;
    }
  }

  async checkContractProgress(contractId) {
    try {
      const contract = await Investment.findById(contractId);
      if (!contract) {
        console.log(`\n📊 Contract Progress (${contractId}): Contract not found`);
        return null;
      }
      
      const payouts = await Payout.find({ contractId });
      
      console.log(`\n📊 Contract Progress (${contractId}):`);
      console.log(`   Amount: ₱${contract.amount.toLocaleString()}`);
      console.log(`   Status: ${contract.status}`);
      console.log(`   Completed Payouts: ${contract.payouts.length}/5`);
      console.log(`   Payout Records: ${payouts.length}`);
      
      payouts.forEach((payout, index) => {
        console.log(`   Payout ${index + 1}: Cycle ${payout.cycle}, ₱${payout.amount.toLocaleString()}, ${payout.dateReleased.toLocaleDateString()}`);
      });
      
      return { contract, payouts };
    } catch (error) {
      console.error(`❌ Failed to check contract progress:`, error.message);
      return null;
    }
  }

  async checkWalletBalance() {
    try {
      const user = await User.findById(this.userId);
      
      const transactions = await Transaction.find({
        user: this.userId,
        type: 'Earnings'
      }).sort({ createdAt: -1 });
      
      console.log(`\n💰 Wallet Status:`);
      console.log(`   Passive Wallet Balance: ₱${user?.passiveWallet?.toLocaleString() || '0'}`);
      console.log(`   Payout Transactions: ${transactions.length}`);
      
      transactions.slice(0, 5).forEach((tx, index) => {
        console.log(`   Transaction ${index + 1}: ₱${tx.amount.toLocaleString()} - ${tx.description}`);
      });
      
      return { passiveWallet: user?.passiveWallet, transactions };
    } catch (error) {
      console.error(`❌ Failed to check wallet balance:`, error.message);
      return null;
    }
  }

  async checkSummaryEndpoint() {
    try {
      const response = await axios.get(
        `${BASE_URL}/investments/summary`,
        { headers: { Authorization: `Bearer ${this.token}` } }
      );
      
      const summary = response.data.data;
      console.log(`\n📈 Investment Summary:`);
      console.log(`   Total Active Contracts: ${summary.totalActiveContracts}`);
      console.log(`   Total Investment: ₱${summary.totalInvestment.toLocaleString()}`);
      console.log(`   Completed Contracts: ${summary.completedContracts}`);
      console.log(`   Total Payouts Received: ₱${summary.totalPayoutsReceived.toLocaleString()}`);
      
      return summary;
    } catch (error) {
      console.error(`❌ Failed to fetch summary:`, error.response?.data?.message || error.message);
      return null;
    }
  }

  async checkActiveContractsEndpoint() {
    try {
      const response = await axios.get(
        `${BASE_URL}/investments/active`,
        { headers: { Authorization: `Bearer ${this.token}` } }
      );
      
      const contracts = response.data.data;
      console.log(`\n📋 Active Contracts API Response:`);
      console.log(`   Total Contracts: ${contracts.length}`);
      
      contracts.forEach((contract, index) => {
        console.log(`   Contract ${index + 1}:`);
        console.log(`     Amount: ₱${contract.amount.toLocaleString()}`);
        console.log(`     Progress: ${contract.progress.completed}/${contract.progress.total} (${contract.progress.percentage}%)`);
        console.log(`     Days Left: ${contract.daysLeft}`);
        console.log(`     Next Payout: ${contract.nextPayout ? `₱${contract.nextPayout.payoutAmount.toLocaleString()} in ${contract.nextPayout.daysLeft} days` : 'None'}`);
      });
      
      return contracts;
    } catch (error) {
      console.error(`❌ Failed to fetch active contracts:`, error.response?.data?.message || error.message);
      return null;
    }
  }

  async runCompleteTest() {
    console.log('🚀 Starting Complete Payout Flow Test\n');
    
    // Connect to database
    await connectDB();
    
    // Step 1: Login
    const loginSuccess = await this.login();
    if (!loginSuccess) return;
    
    // Step 2: Create test contracts
    console.log('\n📝 Creating test contracts...');
    await this.createTestContract(30000);
    await this.createTestContract(50000);
    
    if (this.testContracts.length === 0) {
      console.log('❌ No contracts created, stopping test');
      return;
    }
    
    // Step 3: Check initial state
    console.log('\n🔍 Checking initial state...');
    await this.checkSummaryEndpoint();
    await this.checkActiveContractsEndpoint();
    
    // Step 4: Simulate 3 days passage and trigger first payout
    console.log('\n⏰ Simulating 3 days passage...');
    for (const contract of this.testContracts) {
      await this.simulateTimePassage(contract._id, 3);
    }
    
    await this.triggerPayouts();
    
    // Step 5: Check after first payout
    console.log('\n🔍 Checking state after first payout...');
    for (const contract of this.testContracts) {
      await this.checkContractProgress(contract._id);
    }
    await this.checkWalletBalance();
    await this.checkSummaryEndpoint();
    await this.checkActiveContractsEndpoint();
    
    // Step 6: Simulate more time and trigger more payouts
    console.log('\n⏰ Simulating total 6 days (2 payouts due)...');
    for (const contract of this.testContracts) {
      await this.simulateTimePassage(contract._id, 6);
    }
    
    await this.triggerPayouts();
    
    // Step 7: Final state check
    console.log('\n🔍 Final state check...');
    for (const contract of this.testContracts) {
      await this.checkContractProgress(contract._id);
    }
    await this.checkWalletBalance();
    await this.checkSummaryEndpoint();
    await this.checkActiveContractsEndpoint();
    
    console.log('\n✅ Complete Payout Flow Test Finished!');
    
    // Close database connection
    await mongoose.connection.close();
  }
}

// Run the test
const tester = new PayoutFlowTester();
tester.runCompleteTest().catch(console.error);