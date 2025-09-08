require('dotenv').config();
const mongoose = require('mongoose');
const EncashmentSettings = require('./models/EncashmentSettings');

async function enableTestEncashment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get current settings
    let settings = await EncashmentSettings.getSettings();
    
    // Enable override for passive wallet for 1 hour
    const overrideExpiry = new Date();
    overrideExpiry.setHours(overrideExpiry.getHours() + 1);
    
    settings.passiveWallet.overrideActive = true;
    settings.passiveWallet.overrideExpiry = overrideExpiry;
    
    await settings.save();
    
    console.log('✅ Enabled encashment override for passive wallet');
    console.log(`⏰ Override expires at: ${overrideExpiry.toLocaleString()}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error enabling test encashment:', error);
    process.exit(1);
  }
}

enableTestEncashment();