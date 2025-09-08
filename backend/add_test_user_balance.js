const mongoose = require('mongoose');
const User = require('./models/User');
const Wallet = require('./models/Wallet');
require('dotenv').config();

async function addTestUserBalance() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find test user
    const testUser = await User.findOne({ email: 'testuser@example.com' });
    
    if (!testUser) {
      console.log('Test user not found');
      await mongoose.disconnect();
      return;
    }
    
    console.log('Found test user:', testUser.username);
    
    // Find or create passive wallet
    let passiveWallet = await Wallet.findOne({ 
      user: testUser._id, 
      walletType: 'passive' 
    });
    
    if (!passiveWallet) {
      console.log('Creating passive wallet for test user...');
      passiveWallet = await Wallet.create({
        user: testUser._id,
        walletType: 'passive',
        balance: 1000
      });
      console.log('Passive wallet created with balance: 1000');
    } else {
      console.log('Current passive wallet balance:', passiveWallet.balance);
      
      if (passiveWallet.balance < 1000) {
        passiveWallet.balance = 1000;
        await passiveWallet.save();
        console.log('Updated passive wallet balance to: 1000');
      } else {
        console.log('Passive wallet already has sufficient balance');
      }
    }
    
    await mongoose.disconnect();
    console.log('Balance update completed');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addTestUserBalance();