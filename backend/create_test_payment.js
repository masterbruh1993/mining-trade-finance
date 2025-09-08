require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const User = require('./models/User');

const createTestPayment = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find a test user
    const testUser = await User.findOne({ email: 'test1@gmail.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    // Create a new test payment
    const testPayment = new Payment({
      userId: testUser._id,
      amount: 1500,
      receipt: 'test-receipt.jpg',
      status: 'Pending'
    });

    await testPayment.save();

    console.log('\n✅ Test payment created successfully!');
    console.log(`Payment ID: ${testPayment._id}`);
    console.log(`User: ${testUser.email}`);
    console.log(`Amount: $${testPayment.amount}`);
    console.log(`Status: ${testPayment.status}`);

  } catch (error) {
    console.error('❌ Error creating test payment:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

createTestPayment();