const mongoose = require('mongoose');
require('dotenv').config();

const Investment = require('./models/Investment');
const EarningsService = require('./services/earningsService');

async function checkProgress() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const investments = await Investment.find({status: 'active'}).limit(5);
    console.log(`Found ${investments.length} active contracts`);
    
    investments.forEach((inv, index) => {
      const progress = EarningsService.getInvestmentProgress(inv);
      const daysLeft = EarningsService.getDaysLeft(inv);
      console.log(`Contract ${index + 1}: ${progress.completed}/${progress.total} (${progress.percentage}%) - ${daysLeft} days left`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkProgress();