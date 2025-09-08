const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Test configuration
const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_USER = {
  emailOrUsername: 'test@example.com',
  password: 'password123!'
};

let authToken = '';

async function login() {
  try {
    console.log('\n=== LOGGING IN ===');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testTransactionFiltering() {
  try {
    console.log('\n=== TESTING TRANSACTION FILTERING ===');
    
    const filters = ['all', 'deposit', 'activation', 'earning', 'referral', 'withdrawal'];
    
    for (const filter of filters) {
      const url = filter === 'all' 
        ? `${BASE_URL}/transactions`
        : `${BASE_URL}/transactions?type=${filter}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.data.success) {
        const transactions = response.data.data;
        console.log(`✅ ${filter.toUpperCase()} filter: ${transactions.length} transactions`);
        
        // Verify filtering works correctly
        if (filter !== 'all') {
          const wrongTypeTransactions = transactions.filter(t => t.type !== filter);
          if (wrongTypeTransactions.length > 0) {
            console.log(`❌ Filter error: Found ${wrongTypeTransactions.length} transactions with wrong type`);
          } else {
            console.log(`✅ Filter working correctly for ${filter}`);
          }
        }
      } else {
        console.log(`❌ Failed to fetch ${filter} transactions:`, response.data.message);
      }
    }
  } catch (error) {
    console.log('❌ Transaction filtering test error:', error.response?.data?.message || error.message);
  }
}

async function testTransactionSummary() {
  try {
    console.log('\n=== TESTING TRANSACTION SUMMARY ===');
    
    const response = await axios.get(`${BASE_URL}/transactions/summary`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      const summary = response.data.data;
      console.log('✅ Transaction Summary:');
      console.log(`   Total Transactions: ${summary.totalTransactions}`);
      console.log(`   Total Deposits: ₱${summary.totalDeposits.toLocaleString()}`);
      console.log(`   Total Withdrawals: ₱${summary.totalWithdrawals.toLocaleString()}`);
      console.log(`   Total Activations: ${summary.totalActivations}`);
      console.log(`   Total Earnings: ₱${summary.totalEarnings.toLocaleString()}`);
      console.log(`   Total Referrals: ₱${summary.totalReferrals.toLocaleString()}`);
      
      // Verify summary calculations by fetching all transactions (without pagination limit)
      const allTransactionsResponse = await axios.get(`${BASE_URL}/transactions?limit=1000`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (allTransactionsResponse.data.success) {
        const allTransactions = allTransactionsResponse.data.data;
        const completedTransactions = allTransactions.filter(t => t.status === 'completed');
        
        // Manual calculations (matching API logic: total count = all transactions, amounts = completed only)
        const manualSummary = {
          totalTransactions: allTransactions.length,
          totalDeposits: completedTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
          totalWithdrawals: completedTransactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0),
          totalActivations: completedTransactions.filter(t => t.type === 'activation').length,
          totalEarnings: completedTransactions.filter(t => t.type === 'earning').reduce((sum, t) => sum + t.amount, 0),
          totalReferrals: completedTransactions.filter(t => t.type === 'referral').reduce((sum, t) => sum + t.amount, 0)
        };
        
        // Compare API summary with manual calculations
        const summaryMatches = 
          summary.totalTransactions === manualSummary.totalTransactions &&
          summary.totalDeposits === manualSummary.totalDeposits &&
          summary.totalWithdrawals === manualSummary.totalWithdrawals &&
          summary.totalActivations === manualSummary.totalActivations &&
          summary.totalEarnings === manualSummary.totalEarnings &&
          summary.totalReferrals === manualSummary.totalReferrals;
        
        if (summaryMatches) {
          console.log('✅ Summary calculations match transaction logs');
        } else {
          console.log('❌ Summary calculations do not match:');
          console.log('   API Summary:', summary);
          console.log('   Manual Summary:', manualSummary);
        }
      }
    } else {
      console.log('❌ Failed to fetch transaction summary:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Transaction summary test error:', error.response?.data?.message || error.message);
  }
}

async function testDashboardSummary() {
  try {
    console.log('\n=== TESTING DASHBOARD SUMMARY ===');
    
    const response = await axios.get(`${BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.status === 'success') {
      const data = response.data;
      console.log('✅ Dashboard Summary:');
      console.log(`   Credit Wallet: ₱${data.balance.toLocaleString()}`);
      console.log(`   Passive Wallet: ₱${data.passiveWallet.toLocaleString()}`);
      console.log(`   Bonus Wallet: ₱${data.bonusWallet.toLocaleString()}`);
      console.log(`   Total Payouts Received: ₱${data.totalPayoutsReceived.toLocaleString()}`);
      console.log(`   Encashment Total: ₱${data.encashmentTotal.toLocaleString()}`);
      console.log(`   Active Contracts: ${data.contracts.length}`);
      
      // Verify Total Payouts Received calculation
      const transactionResponse = await axios.get(`${BASE_URL}/transactions?type=earning`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const referralResponse = await axios.get(`${BASE_URL}/transactions?type=referral`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (transactionResponse.data.success && referralResponse.data.success) {
        const earnings = transactionResponse.data.data.filter(t => t.status === 'completed');
        const referrals = referralResponse.data.data.filter(t => t.status === 'completed');
        
        const manualTotalPayouts = 
          earnings.reduce((sum, t) => sum + t.amount, 0) +
          referrals.reduce((sum, t) => sum + t.amount, 0);
        
        if (data.totalPayoutsReceived === manualTotalPayouts) {
          console.log('✅ Total Payouts Received calculation is correct');
        } else {
          console.log(`❌ Total Payouts Received mismatch: API=${data.totalPayoutsReceived}, Manual=${manualTotalPayouts}`);
        }
      }
    } else {
      console.log('❌ Failed to fetch dashboard summary:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Dashboard summary test error:', error.response?.data?.message || error.message);
  }
}

async function testDaysLeftCounter() {
  try {
    console.log('\n=== TESTING DAYS LEFT COUNTER ===');
    
    const response = await axios.get(`${BASE_URL}/contracts/active`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      const contracts = response.data.data;
      console.log(`✅ Found ${contracts.length} active contracts`);
      
      contracts.forEach((contract, index) => {
        const startDate = new Date(contract.startDate);
        const maturityDate = new Date(contract.maturityDate);
        const now = new Date();
        
        // Manual calculation of days left
        const timeLeft = maturityDate.getTime() - now.getTime();
        const manualDaysLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
        
        console.log(`   Contract ${index + 1}:`);
        console.log(`     Amount: ₱${contract.amount.toLocaleString()}`);
        console.log(`     Start Date: ${startDate.toLocaleDateString()}`);
        console.log(`     Maturity Date: ${maturityDate.toLocaleDateString()}`);
        console.log(`     API Days Left: ${contract.daysLeft}`);
        console.log(`     Manual Days Left: ${manualDaysLeft}`);
        
        if (contract.daysLeft === manualDaysLeft) {
          console.log(`     ✅ Days Left calculation is correct`);
        } else {
          console.log(`     ❌ Days Left calculation mismatch`);
        }
      });
    } else {
      console.log('❌ Failed to fetch active contracts:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Days Left counter test error:', error.response?.data?.message || error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting PHASE 2 Functionality Tests');
  console.log('=====================================');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without login');
    return;
  }
  
  // Run all tests
  await testTransactionFiltering();
  await testTransactionSummary();
  await testDashboardSummary();
  await testDaysLeftCounter();
  
  console.log('\n🎉 PHASE 2 Functionality Tests Completed');
  console.log('========================================');
}

// Run the tests
runAllTests().catch(console.error);