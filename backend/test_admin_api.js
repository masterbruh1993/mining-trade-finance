const mongoose = require('mongoose');
const axios = require('axios');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Test complete admin workflow
async function testCompleteAdminWorkflow() {
  try {
    console.log('🔍 Testing Complete Admin Workflow...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('./models/User');
    const Withdrawal = require('./models/Withdrawal');
    
    // Step 1: Ensure we have an admin user with known credentials
    console.log('\n👤 Step 1: Setting up admin user...');
    
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('Creating new admin user...');
      
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@test.com',
        password: 'admin123!', // Let the pre-save middleware handle hashing
        fullName: 'Admin User',
        mobileNumber: '09123456789',
        role: 'admin',
        isVerified: true
      });
      console.log('✅ Created admin user');
    } else {
      console.log('✅ Found existing admin user:', adminUser.email);
      
      // Update password to known value (let pre-save middleware handle hashing)
      adminUser.password = 'admin123!';
      await adminUser.save();
      console.log('✅ Updated admin password to admin123!');
    }
    
    // Step 2: Login as admin
    console.log('\n🔐 Step 2: Logging in as admin...');
    
    let adminToken;
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
        emailOrUsername: adminUser.email,
        password: 'admin123!'
      });
      
      adminToken = loginResponse.data.token;
      console.log('✅ Admin login successful!');
      console.log('Token preview:', adminToken.substring(0, 50) + '...');
    } catch (loginError) {
      console.log('❌ Admin login failed:', loginError.response?.data?.message || loginError.message);
      return;
    }
    
    // Step 3: Find or create a pending withdrawal
    console.log('\n📋 Step 3: Setting up test withdrawal...');
    
    let pendingWithdrawal = await Withdrawal.findOne({ status: { $regex: /^pending$/i } });
    
    if (!pendingWithdrawal) {
      console.log('Creating test withdrawal...');
      
      // Find a regular user
      let testUser = await User.findOne({ role: 'user' });
      if (!testUser) {
        testUser = await User.create({
          username: 'testuser',
          email: 'user@test.com',
          password: 'user123!', // Let the pre-save middleware handle hashing
          fullName: 'Test User',
          mobileNumber: '09987654321',
          role: 'user',
          isVerified: true
        });
      }
      
      pendingWithdrawal = await Withdrawal.create({
        user: testUser._id,
        amount: 1000,
        walletType: 'passive',
        status: 'pending',
        paymentMethod: 'gcash',
        paymentDetails: {
          accountNumber: '09123456789',
          accountName: 'Test User'
        }
      });
      
      console.log('✅ Created test withdrawal');
    }
    
    console.log('📊 Test withdrawal details:', {
      id: pendingWithdrawal._id,
      amount: pendingWithdrawal.amount,
      status: pendingWithdrawal.status,
      user: pendingWithdrawal.user
    });
    
    // Step 4: First test if the withdrawals endpoint is accessible
    console.log('\n🔄 Step 4a: Testing withdrawals endpoint accessibility...');
    
    try {
      const testResponse = await axios.get(
        'http://localhost:5000/api/v1/withdrawals/admin',
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );
      console.log('✅ Withdrawals admin endpoint accessible');
    } catch (testError) {
      console.log('❌ Withdrawals admin endpoint failed:', testError.response?.status, testError.response?.data?.message);
    }
    
    // Step 4b: Test the Set as Paid API call
    console.log('\n🔄 Step 4b: Testing Set as Paid API call...');
    
    try {
      const response = await axios.put(
        `http://localhost:5000/api/v1/withdrawals/${pendingWithdrawal._id}/set-paid`,
        { remarks: 'Test approval from API' },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ API call successful!');
      console.log('📤 Response:', {
        success: response.data.success,
        message: response.data.message,
        status: response.data.data?.status,
        approvedBy: response.data.data?.approvedBy
      });
      
      // Step 5: Verify the database was updated
      console.log('\n📊 Step 5: Verifying database update...');
      
      const updatedWithdrawal = await Withdrawal.findById(pendingWithdrawal._id);
      console.log('✅ Database verification:', {
        id: updatedWithdrawal._id,
        status: updatedWithdrawal.status,
        approvedBy: updatedWithdrawal.approvedBy,
        approvedAt: updatedWithdrawal.approvedAt,
        remarks: updatedWithdrawal.remarks
      });
      
      if (updatedWithdrawal.status === 'COMPLETED') {
        console.log('🎉 SUCCESS: Set as Paid functionality is working correctly!');
      } else {
        console.log('❌ FAILURE: Status was not updated to COMPLETED');
      }
      
    } catch (apiError) {
      console.log('❌ API call failed:');
      console.log('Status:', apiError.response?.status);
      console.log('Message:', apiError.response?.data?.message);
      console.log('Full error:', apiError.response?.data);
      
      // Additional debugging
      if (apiError.response?.status === 401) {
        console.log('\n🔍 Debugging 401 error...');
        console.log('Token being sent:', adminToken ? 'Token exists' : 'No token');
        console.log('Admin user role:', adminUser.role);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testCompleteAdminWorkflow();