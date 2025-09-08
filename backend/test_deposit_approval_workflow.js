const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:5000/api/v1';
const TEST_USER_EMAIL = 'test1@gmail.com';
const TEST_USER_PASSWORD = 'password123!';
const ADMIN_EMAIL = 'admin@1uptrade.com';
const ADMIN_PASSWORD = 'Admin123!';
const DEPOSIT_AMOUNT = 1000;

// Helper function to create a dummy receipt file
function createDummyReceipt() {
  const receiptPath = path.join(__dirname, 'test_receipt.txt');
  fs.writeFileSync(receiptPath, 'This is a test receipt file for deposit approval testing.');
  return receiptPath;
}

// Helper function to clean up test files
function cleanup(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

async function testDepositApprovalWorkflow() {
  console.log('\n🧪 TESTING DEPOSIT APPROVAL WORKFLOW');
  console.log('=====================================\n');
  
  let userToken, adminToken, paymentId;
  const receiptPath = createDummyReceipt();
  
  try {
    // Step 1: Login as test user
    console.log('1️⃣ Logging in as test user...');
    const userLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    userToken = userLoginRes.data.token;
    const userId = userLoginRes.data.data.id;
    console.log('✅ User logged in successfully');
    console.log(`   User ID: ${userId}`);
    console.log('   Login response:', JSON.stringify(userLoginRes.data, null, 2));
    
    // Get initial user wallet balance
    const initialUserRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const initialUserBalance = initialUserRes.data.data.walletBalance;
    console.log(`   Initial user wallet balance: ₱${initialUserBalance}`);
    
    // Step 2: Login as admin
    console.log('\n2️⃣ Logging in as admin...');
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    adminToken = adminLoginRes.data.token;
    console.log('✅ Admin logged in successfully');
    
    // Get initial admin wallet balance
    const initialAdminRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const initialAdminBalance = initialAdminRes.data.data.walletBalance;
    console.log(`   Initial admin wallet balance: ₱${initialAdminBalance}`);
    
    // Step 3: Submit deposit request
    console.log('\n3️⃣ Submitting deposit request...');
    const formData = new FormData();
    formData.append('amount', DEPOSIT_AMOUNT);
    formData.append('receipt', fs.createReadStream(receiptPath));
    
    const depositRes = await axios.post(`${BASE_URL}/payments/deposit`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${userToken}`
      }
    });
    
    paymentId = depositRes.data.data._id;
    console.log('✅ Deposit submitted successfully');
    console.log(`   Payment ID: ${paymentId}`);
    console.log(`   Amount: ₱${DEPOSIT_AMOUNT}`);
    console.log(`   Status: ${depositRes.data.data.status}`);
    
    // Step 4: Verify deposit is pending
    console.log('\n4️⃣ Verifying deposit status...');
    const pendingDepositsRes = await axios.get(`${BASE_URL}/payments/deposits?status=Pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const pendingDeposit = pendingDepositsRes.data.data.find(d => d._id === paymentId);
    if (!pendingDeposit) {
      throw new Error('Deposit not found in pending deposits');
    }
    console.log('✅ Deposit found in pending status');
    
    // Step 5: Approve the deposit
    console.log('\n5️⃣ Approving deposit...');
    const approvalRes = await axios.post(`${BASE_URL}/payments/approve`, {
      paymentId: paymentId
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Deposit approved successfully');
    console.log(`   Message: ${approvalRes.data.message}`);
    console.log(`   Updated user balance: ₱${approvalRes.data.data.userBalance}`);
    console.log(`   Updated admin balance: ₱${approvalRes.data.data.adminBalance}`);
    console.log(`   Transaction ID: ${approvalRes.data.data.transactionId}`);
    
    // Step 6: Verify wallet balance changes
    console.log('\n6️⃣ Verifying wallet balance changes...');
    const finalUserRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const finalUserBalance = finalUserRes.data.data.walletBalance;
    
    const finalAdminRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const finalAdminBalance = finalAdminRes.data.data.walletBalance;
    
    const userBalanceIncrease = finalUserBalance - initialUserBalance;
    const adminBalanceDecrease = initialAdminBalance - finalAdminBalance;
    
    console.log(`   User balance change: +₱${userBalanceIncrease}`);
    console.log(`   Admin balance change: -₱${adminBalanceDecrease}`);
    
    if (userBalanceIncrease === DEPOSIT_AMOUNT && adminBalanceDecrease === DEPOSIT_AMOUNT) {
      console.log('✅ Wallet balance changes are correct');
    } else {
      throw new Error('Wallet balance changes are incorrect');
    }
    
    // Step 7: Verify transaction was created
    console.log('\n7️⃣ Verifying transaction history...');
    const transactionsRes = await axios.get(`${BASE_URL}/transactions?type=deposit`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    const depositTransaction = transactionsRes.data.data.find(t => 
      t.transactionType === 'deposit' && 
      t.amount === DEPOSIT_AMOUNT && 
      t.status === 'completed'
    );
    
    if (depositTransaction) {
      console.log('✅ Transaction record created successfully');
      console.log(`   Transaction ID: ${depositTransaction._id}`);
      console.log(`   Type: ${depositTransaction.transactionType}`);
      console.log(`   Amount: ₱${depositTransaction.amount}`);
      console.log(`   Status: ${depositTransaction.status}`);
      console.log(`   Wallet Type: ${depositTransaction.walletType}`);
    } else {
      throw new Error('Transaction record not found');
    }
    
    // Step 8: Verify payment status updated
    console.log('\n8️⃣ Verifying payment status update...');
    const approvedDepositsRes = await axios.get(`${BASE_URL}/payments/deposits?status=Approved`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const approvedDeposit = approvedDepositsRes.data.data.find(d => d._id === paymentId);
    if (approvedDeposit && approvedDeposit.status === 'Approved') {
      console.log('✅ Payment status updated to Approved');
      console.log(`   Approved at: ${approvedDeposit.approvedAt}`);
    } else {
      throw new Error('Payment status not updated correctly');
    }
    
    console.log('\n🎉 DEPOSIT APPROVAL WORKFLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('All requirements verified:');
    console.log('✅ Payment status updated to "Approved"');
    console.log('✅ User wallet balance incremented correctly');
    console.log('✅ Admin wallet balance decremented correctly');
    console.log('✅ Transaction record created in Transactions collection');
    console.log('✅ Frontend can fetch deposit history from Transactions');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error('Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    // Cleanup
    cleanup(receiptPath);
    console.log('\n🧹 Test cleanup completed');
  }
}

// Run the test
testDepositApprovalWorkflow();