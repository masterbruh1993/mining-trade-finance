const mongoose = require('mongoose');
const EncashmentSettings = require('./models/EncashmentSettings');
require('dotenv').config();

async function testEncashmentStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    console.log('\n=== TESTING ENCASHMENT STATUS DIRECTLY ===');
    
    // Get settings directly from model
    const settings = await EncashmentSettings.getSettings();
    
    console.log('\n📋 Current Settings:');
    console.log('Passive Wallet:', {
      enabled: settings.passiveWallet.isEnabled,
      overrideActive: settings.passiveWallet.overrideActive,
      startTime: settings.passiveWallet.startTime,
      endTime: settings.passiveWallet.endTime,
      allowedDays: settings.passiveWallet.allowedDays
    });
    
    console.log('Direct Bonus Wallet:', {
      enabled: settings.directBonusWallet.isEnabled,
      overrideActive: settings.directBonusWallet.overrideActive,
      startTime: settings.directBonusWallet.startTime,
      endTime: settings.directBonusWallet.endTime,
      allowedDays: settings.directBonusWallet.allowedDays
    });
    
    // Test status for both wallet types
    console.log('\n🔍 Testing Encashment Status:');
    
    const passiveStatus = settings.getEncashmentStatus('passive');
    console.log('\nPassive Wallet Status:', {
      isAllowed: passiveStatus.isAllowed,
      reason: passiveStatus.reason,
      message: passiveStatus.message
    });
    
    const directBonusStatus = settings.getEncashmentStatus('directBonus');
    console.log('\nDirect Bonus Wallet Status:', {
      isAllowed: directBonusStatus.isAllowed,
      reason: directBonusStatus.reason,
      message: directBonusStatus.message
    });
    
    // Simulate the API response
    const apiResponse = {
      success: true,
      data: {
        passiveWallet: {
          isAllowed: passiveStatus.isAllowed,
          message: passiveStatus.message,
          reason: passiveStatus.reason,
          settings: {
            startTime: settings.passiveWallet.startTime,
            endTime: settings.passiveWallet.endTime,
            allowedDays: settings.passiveWallet.allowedDays,
            isEnabled: settings.passiveWallet.isEnabled,
            overrideActive: settings.passiveWallet.overrideActive,
            overrideExpiry: settings.passiveWallet.overrideExpiry
          }
        },
        directBonusWallet: {
          isAllowed: directBonusStatus.isAllowed,
          message: directBonusStatus.message,
          reason: directBonusStatus.reason,
          settings: {
            startTime: settings.directBonusWallet.startTime,
            endTime: settings.directBonusWallet.endTime,
            allowedDays: settings.directBonusWallet.allowedDays,
            isEnabled: settings.directBonusWallet.isEnabled,
            overrideActive: settings.directBonusWallet.overrideActive,
            overrideExpiry: settings.directBonusWallet.overrideExpiry
          }
        }
      }
    };
    
    console.log('\n📤 API Response (simulated):');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    console.log('\n✅ Direct test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing encashment status:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testEncashmentStatus();