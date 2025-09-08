require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    // Find a user to test with
    const users = await User.find().limit(1);
    if (users.length === 0) {
      console.log('No users found');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('Testing summary for user:', user.email);
    
    // Get summary by type
    const summary = await Transaction.aggregate([
      { $match: { user: user._id, status: 'completed' } },
      { 
        $group: { 
          _id: '$type', 
          count: { $sum: 1 }, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);
    
    console.log('\nSummary by type:');
    summary.forEach(s => {
      console.log(`${s._id}: ${s.count} transactions, ₱${s.total}`);
    });
    
    // Get total transactions
    const totalTransactions = await Transaction.countDocuments({ 
      user: user._id, 
      status: 'completed' 
    });
    
    console.log('\nTotal completed transactions:', totalTransactions);
    
    // Test the summary endpoint logic
    const deposits = await Transaction.countDocuments({ 
      user: user._id, 
      type: 'deposit', 
      status: 'completed' 
    });
    
    const withdrawals = await Transaction.countDocuments({ 
      user: user._id, 
      type: 'withdrawal', 
      status: 'completed' 
    });
    
    const activations = await Transaction.countDocuments({ 
      user: user._id, 
      type: 'activation', 
      status: 'completed' 
    });
    
    const earnings = await Transaction.countDocuments({ 
      user: user._id, 
      type: 'earning', 
      status: 'completed' 
    });
    
    const referrals = await Transaction.countDocuments({ 
      user: user._id, 
      type: 'referral', 
      status: 'completed' 
    });
    
    console.log('\nSummary endpoint format:');
    console.log({
      totalTransactions,
      deposits,
      withdrawals,
      activations,
      earnings,
      referrals
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}).catch(console.error);