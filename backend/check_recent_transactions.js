require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'email');
    
    console.log('Recent transactions:');
    recentTransactions.forEach((tx, index) => {
      console.log(`${index + 1}. ID: ${tx._id}`);
      console.log(`   Type: ${tx.type}`);
      console.log(`   Amount: ₱${tx.amount}`);
      console.log(`   User: ${tx.user ? tx.user.email : tx.user}`);
      console.log(`   Status: ${tx.status}`);
      console.log(`   Date: ${tx.createdAt}`);
      console.log(`   Description: ${tx.description}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}).catch(console.error);