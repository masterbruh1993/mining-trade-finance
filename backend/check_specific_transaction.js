const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const User = require('./models/User');
require('dotenv').config();

async function checkSpecificTransaction() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check the specific transaction ID from the backend logs
    const transactionId = '68b90b40f4057f71ff77d87f'; // From the latest workflow test
    
    const transaction = await Transaction.findById(transactionId).populate('user', 'email');
    
    if (transaction) {
      console.log('Found transaction:');
      console.log('  ID:', transaction._id);
      console.log('  Type:', transaction.type);
      console.log('  Amount:', transaction.amount);
      console.log('  User:', transaction.user?.email || 'No user');
      console.log('  Status:', transaction.status);
      console.log('  Description:', transaction.description);
      console.log('  Created:', transaction.createdAt);
    } else {
      console.log('❌ Transaction not found with ID:', transactionId);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkSpecificTransaction();