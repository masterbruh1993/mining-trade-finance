const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const testAlankoAPI = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/1uptrade');
    console.log('Connected to MongoDB');

    // Find alanko user
    const user = await User.findOne({ username: 'alanko' });
    if (!user) {
      console.log('❌ User alanko not found');
      return;
    }

    console.log('✅ Found alanko user');
    console.log('User ID:', user._id);
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Passive Wallet:', user.passiveWallet || 0);
    console.log('Credit Wallet:', user.creditWallet || 0);
    console.log('Bonus Wallet:', user.bonusWallet || 0);

    // Generate a JWT token for testing API calls
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'fallback_secret_key_for_testing',
      { expiresIn: '1h' }
    );

    console.log('\n=== GENERATED TEST TOKEN ===');
    console.log('Token:', token);
    console.log('\nYou can use this token to test API calls:');
    console.log('Authorization: Bearer', token);

    // Test the dashboard data structure
    const contracts = [];
    const totalEarnings = (user.passiveWallet || 0) + (user.bonusWallet || 0);
    
    console.log('\n=== SIMULATED DASHBOARD API RESPONSE ===');
    const dashboardResponse = {
      status: "success",
      balance: user.creditWallet || 0,
      passiveWallet: user.passiveWallet || 0,
      bonusWallet: user.bonusWallet || 0,
      totalEarnings: totalEarnings,
      contracts
    };
    console.log(JSON.stringify(dashboardResponse, null, 2));

    console.log('\n=== SIMULATED WALLET BALANCES API RESPONSE ===');
    const walletResponse = {
      success: true,
      data: {
        creditWallet: user.creditWallet || 0,
        passiveWallet: user.passiveWallet || 0,
        bonusWallet: user.bonusWallet || 0,
        walletBalance: user.walletBalance || 0
      }
    };
    console.log(JSON.stringify(walletResponse, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

testAlankoAPI();