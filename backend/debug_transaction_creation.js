const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const User = require('./models/User');
require('dotenv').config();

async function debugTransactionCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('Creating test transaction with type: deposit');
    
    // Create transaction exactly like paymentController
    const transactionData = {
      user: adminUser._id,
      type: 'deposit',
      amount: 1000,
      netAmount: 1000,
      walletType: 'credit',
      status: 'completed',
      description: 'Debug test transaction',
      createdAt: new Date()
    };
    
    console.log('Transaction data before save:', transactionData);
    
    const transaction = new Transaction(transactionData);
    await transaction.save();
    
    console.log('Transaction saved with ID:', transaction._id);
    console.log('Transaction type after save:', transaction.type);
    
    // Fetch it back from database to verify
    const savedTransaction = await Transaction.findById(transaction._id);
    console.log('Transaction type from database:', savedTransaction.type);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugTransactionCreation();