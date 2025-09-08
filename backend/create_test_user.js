const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('./config/db');
const User = require('./models/User');
const Investment = require('./models/Investment');

async function createTestUser() {
  console.log('🚀 Creating Test User and Investment');
  
  try {
    // Connect to database
    await connectDB();
    
    // Find existing test user
    let user = await User.findOne({ 
      $or: [
        { email: 'testuser@example.com' },
        { username: 'testuser' }
      ]
    });
    
    if (!user) {
      // Create test user
      const hashedPassword = await bcrypt.hash('password123!', 12);
      user = new User({
        username: 'testuser2',
        email: 'testuser2@example.com',
        password: hashedPassword,
        fullName: 'Test User',
        mobileNumber: '09123456789',
        isVerified: true,
        wallets: {
          active: { balance: 100000 },
          passive: { balance: 0 }
        }
      });
      await user.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user found:', user.email);
    }
    
    // Check for existing active investments
    const existingInvestments = await Investment.find({ 
      user: user._id, 
      status: 'active' 
    });
    
    console.log(`📊 Found ${existingInvestments.length} existing active investments`);
    
    if (existingInvestments.length === 0) {
      // Create a test investment
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const maturityDate = new Date(startDate.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from start
      
      const investment = new Investment({
        user: user._id,
        amount: 50000,
        status: 'active',
        startDate: startDate,
        maturityDate: maturityDate,
        duration: 60,
        totalROI: 400,
        payoutPercent: 100,
        payoutInterval: 60,
        totalCycles: 1,
        remainingPayouts: 1,
        payouts: [], // Empty payouts array
        payoutSchedule: [{
          payoutDate: maturityDate,
          payoutAmount: 200000, // 400% of 50000
          status: 'pending'
        }]
      });
      await investment.save();
      console.log('✅ Test investment created (30 days old, 60-day maturity)');
    }
    
    console.log('✅ Setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

createTestUser();