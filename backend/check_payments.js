const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/1uptrade')
  .then(() => {
    console.log('Connected to MongoDB');
    checkPayments();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import Payment model
const Payment = require('./models/Payment');
const User = require('./models/User');

async function checkPayments() {
  try {
    console.log('\n=== CHECKING PAYMENTS ===');
    
    // Get all payments
    const allPayments = await Payment.find().populate('userId', 'name email');
    console.log(`Total payments in database: ${allPayments.length}`);
    
    // Get pending payments
    const pendingPayments = await Payment.find({ status: 'Pending' }).populate('userId', 'name email');
    console.log(`Pending payments: ${pendingPayments.length}`);
    
    if (pendingPayments.length > 0) {
      console.log('\nPending payments details:');
      pendingPayments.forEach((payment, index) => {
        console.log(`${index + 1}. ID: ${payment._id}`);
        console.log(`   User: ${payment.userId?.name || payment.userId?.email || 'Unknown'}`);
        console.log(`   Amount: $${payment.amount}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Created: ${payment.createdAt}`);
        console.log('---');
      });
    } else {
      console.log('No pending payments found.');
    }
    
    // Get all users
    const users = await User.find();
    console.log(`\nTotal users: ${users.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking payments:', error);
    process.exit(1);
  }
}