require('dotenv').config();
const mongoose = require('mongoose');
const Withdrawal = require('./models/Withdrawal');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const result = await Withdrawal.deleteMany({ 
      status: { $regex: /^pending$/i } 
    });
    console.log(`Deleted ${result.deletedCount} pending withdrawals`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });