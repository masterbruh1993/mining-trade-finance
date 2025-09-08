const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api/v1';

// Test deposit approval workflow
const testDepositApproval = async () => {
  try {
    console.log('🧪 Testing Complete Deposit Approval Workflow...');
    console.log('================================================\n');

    // Step 1: Register a new user
    console.log('1. Registering new user...');
    const timestamp = Date.now();
    const userData = {
      username: `testuser_${timestamp}`,
      email: `testuser_${timestamp}@test.com`,
      password: 'Test123!',
      fullName: 'Test User',
      mobileNumber: '09123456789'
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, userData);
    console.log('✅ User registered successfully');
    console.log(`   Username: ${userData.username}`);
    console.log(`   Email: ${userData.email}`);

    // Step 2: Login user
    console.log('\n2. Logging in user...');
    const loginData = {
      emailOrUsername: userData.email,
      password: userData.password
    };
    console.log('   Login data:', loginData);
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    const userToken = loginResponse.data.token;
    const userId = loginResponse.data.data.id;
    console.log('✅ User logged in successfully');
    console.log(`   User ID: ${userId}`);

    // Step 3: Check initial wallet balances
    console.log('\n3. Checking initial wallet balances...');
    const walletsResponse = await axios.get(`${BASE_URL}/wallets`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    const wallets = walletsResponse.data.data;
    console.log(`✅ Found ${wallets.length} wallets`);
    
    const passiveWallet = wallets.find(w => w.walletType === 'passive');
    const bonusWallet = wallets.find(w => w.walletType === 'bonus');
    
    if (!passiveWallet || !bonusWallet) {
      throw new Error('Required wallets not found');
    }
    
    console.log(`   Passive Wallet Balance: ₱${passiveWallet.balance}`);
    console.log(`   Bonus Wallet Balance: ₱${bonusWallet.balance}`);
    
    const initialPassiveBalance = passiveWallet.balance;

    // Step 4: Create a deposit request
    console.log('\n4. Creating deposit request...');
    const depositAmount = 1000;
    
    // Use an existing image file from uploads directory
    const testImagePath = path.join(__dirname, 'uploads', 'receipt-1756859311884-492930480.jpg');
    
    const formData = new FormData();
    formData.append('amount', depositAmount.toString());
    formData.append('receipt', fs.createReadStream(testImagePath));
    
    const depositResponse = await axios.post(`${BASE_URL}/payments/deposit`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${userToken}`
      }
    });
    
    const paymentId = depositResponse.data.data._id;
    console.log('✅ Deposit request created successfully');
    console.log(`   Payment ID: ${paymentId}`);
    console.log(`   Amount: ₱${depositAmount}`);
    console.log(`   Status: ${depositResponse.data.data.status}`);

    // Step 5: Login as admin
    console.log('\n5. Logging in as admin...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      emailOrUsername: 'admin@1uptrade.com',
      password: 'admin123!'
    });
    
    const adminToken = adminLoginResponse.data.token;
    const adminId = adminLoginResponse.data.data.id;
    console.log('✅ Admin logged in successfully');

    // Step 6: Approve the deposit
    console.log('\n6. Approving deposit...');
    const approvalResponse = await axios.post(`${BASE_URL}/payments/approve`, 
      { paymentId },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    console.log('✅ Deposit approved successfully');
    console.log(`   Transaction ID: ${approvalResponse.data.data.transactionId}`);
    console.log(`   Amount: ₱${approvalResponse.data.data.amount}`);

    // Step 7: Verify wallet balance update
    console.log('\n7. Verifying wallet balance update...');
    const updatedWalletsResponse = await axios.get(`${BASE_URL}/wallets`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    const updatedWallets = updatedWalletsResponse.data.data;
    const updatedPassiveWallet = updatedWallets.find(w => w.walletType === 'passive');
    const updatedBonusWallet = updatedWallets.find(w => w.walletType === 'bonus');
    
    console.log(`   Updated Passive Wallet Balance: ₱${updatedPassiveWallet.balance}`);
    console.log(`   Updated Bonus Wallet Balance: ₱${updatedBonusWallet.balance}`);
    
    const expectedBalance = initialPassiveBalance + depositAmount;
    
    if (updatedPassiveWallet.balance === expectedBalance) {
      console.log('✅ Passive wallet balance updated correctly!');
      console.log(`   Initial: ₱${initialPassiveBalance} + Deposit: ₱${depositAmount} = Final: ₱${updatedPassiveWallet.balance}`);
    } else {
      throw new Error(`Balance mismatch! Expected: ₱${expectedBalance}, Actual: ₱${updatedPassiveWallet.balance}`);
    }
    
    // Step 8: Verify transaction record
    console.log('\n8. Verifying transaction record...');
    const transactionsResponse = await axios.get(`${BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    const transactions = transactionsResponse.data.data;
    const depositTransaction = transactions.find(t => 
      t.transactionType === 'deposit' && 
      t.amount === depositAmount &&
      t.status === 'completed'
    );
    
    if (depositTransaction) {
      console.log('✅ Transaction record found');
      console.log(`   Transaction Type: ${depositTransaction.transactionType}`);
      console.log(`   Amount: ₱${depositTransaction.amount}`);
      console.log(`   Wallet Type: ${depositTransaction.walletType}`);
      console.log(`   Status: ${depositTransaction.status}`);
      
      if (depositTransaction.walletType !== 'passive') {
        throw new Error(`Wrong wallet type in transaction! Expected: passive, Actual: ${depositTransaction.walletType}`);
      }
    } else {
      throw new Error('Deposit transaction not found or not completed');
    }

    // Cleanup
    fs.unlinkSync(testImagePath);

    console.log('\n✅ All deposit approval tests passed!');
    console.log('================================================');
    console.log('Summary:');
    console.log('- User registration and login ✅');
    console.log('- Initial wallet creation ✅');
    console.log('- Deposit request creation ✅');
    console.log('- Admin approval process ✅');
    console.log('- Passive wallet balance update ✅');
    console.log('- Transaction record creation ✅');
    console.log('- Correct wallet type usage ✅');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || error.response.data}`);
      if (error.response.data.error) {
        console.error(`   Error: ${error.response.data.error}`);
      }
    } else {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
};

testDepositApproval();