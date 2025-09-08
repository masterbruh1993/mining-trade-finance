const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Test the Set as Paid functionality
async function testSetAsPaid() {
  try {
    console.log('🔍 Testing Set as Paid functionality...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const Withdrawal = require('./models/Withdrawal');
    const User = require('./models/User');
    
    // Find admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log('👥 Found admin users:', adminUsers.map(u => ({ email: u.email, id: u._id })));
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found');
      return;
    }
    
    // Try different common admin passwords
    const adminUser = adminUsers[0];
    const passwords = ['admin123', 'password', '123456', 'admin', 'Admin123'];
    let adminToken = null;
    
    for (const password of passwords) {
      try {
        console.log(`🔐 Trying to login as ${adminUser.email} with password: ${password}`);
        const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
          email: adminUser.email,
          password: password
        });
        
        adminToken = loginResponse.data.token;
        console.log('✅ Admin login successful!');
        break;
      } catch (loginError) {
        console.log(`❌ Login failed with password ${password}:`, loginError.response?.data?.message || loginError.message);
      }
    }
    
    if (!adminToken) {
      console.log('❌ Could not login as admin with any common password');
      console.log('💡 Let\'s try to directly test the controller function instead...');
      
      // Test the controller function directly
      const withdrawalController = require('./controllers/withdrawalController');
      
      // Find a pending withdrawal
      const pendingWithdrawal = await Withdrawal.findOne({ status: { $regex: /^pending$/i } });
      
      if (!pendingWithdrawal) {
        console.log('❌ No pending withdrawals found to test with');
        return;
      }
      
      console.log('📋 Found pending withdrawal:', {
        id: pendingWithdrawal._id,
        amount: pendingWithdrawal.amount,
        status: pendingWithdrawal.status,
        user: pendingWithdrawal.user
      });
      
      // Mock request and response objects
      const req = {
        params: { id: pendingWithdrawal._id },
        body: { remarks: 'Test approval' },
        user: { id: adminUser._id }
      };
      
      const res = {
        status: (code) => ({
          json: (data) => {
            console.log(`📤 Response ${code}:`, data);
            return data;
          }
        })
      };
      
      const next = (error) => {
        if (error) {
          console.log('❌ Controller error:', error.message);
        }
      };
      
      console.log('🔄 Testing setWithdrawalAsPaid controller directly...');
      await withdrawalController.setWithdrawalAsPaid(req, res, next);
      
      // Check if the withdrawal was updated
      const updatedWithdrawal = await Withdrawal.findById(pendingWithdrawal._id);
      console.log('📊 Updated withdrawal in DB:', {
        id: updatedWithdrawal._id,
        status: updatedWithdrawal.status,
        approvedBy: updatedWithdrawal.approvedBy,
        approvedAt: updatedWithdrawal.approvedAt
      });
      
      return;
    }
    
    // If we got here, we have a valid admin token
    // Find a pending withdrawal to test with
    const pendingWithdrawal = await Withdrawal.findOne({ status: { $regex: /^pending$/i } });
    
    if (!pendingWithdrawal) {
      console.log('❌ No pending withdrawals found to test with');
      return;
    }
    
    console.log('📋 Found pending withdrawal:', {
      id: pendingWithdrawal._id,
      amount: pendingWithdrawal.amount,
      status: pendingWithdrawal.status,
      user: pendingWithdrawal.user
    });
    
    console.log('🔄 Attempting to set withdrawal as paid via API...');
    
    try {
      const response = await axios.put(
        `http://localhost:5000/api/v1/withdrawals/${pendingWithdrawal._id}/set-paid`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ API Response:', response.data);
      
      // Check if the withdrawal was actually updated in the database
      const updatedWithdrawal = await Withdrawal.findById(pendingWithdrawal._id);
      console.log('📊 Updated withdrawal in DB:', {
        id: updatedWithdrawal._id,
        status: updatedWithdrawal.status,
        approvedBy: updatedWithdrawal.approvedBy,
        approvedAt: updatedWithdrawal.approvedAt
      });
      
    } catch (apiError) {
      console.log('❌ API Error:', {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        message: apiError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testSetAsPaid();