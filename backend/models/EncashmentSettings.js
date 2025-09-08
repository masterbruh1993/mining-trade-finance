const mongoose = require('mongoose');

// Wallet-specific encashment configuration schema
const walletEncashmentSchema = {
  startTime: {
    type: String,
    required: true,
    default: '11:00' // 11 AM
  },
  endTime: {
    type: String,
    required: true,
    default: '15:00' // 3 PM
  },
  allowedDays: {
    type: [String],
    required: true,
    default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    validate: {
      validator: function(days) {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        return days.every(day => validDays.includes(day.toLowerCase()));
      },
      message: 'Invalid day provided. Use: monday, tuesday, wednesday, thursday, friday, saturday, sunday'
    }
  },
  isEnabled: {
    type: Boolean,
    required: true,
    default: true
  },
  overrideActive: {
    type: Boolean,
    required: true,
    default: false
  },
  overrideExpiry: {
    type: Date,
    default: null
  }
};

const encashmentSettingsSchema = new mongoose.Schema({
  passiveWallet: walletEncashmentSchema,
  directBonusWallet: walletEncashmentSchema,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Method to check if encashment is currently allowed for a specific wallet type
encashmentSettingsSchema.methods.isEncashmentAllowed = function(walletType = 'passive') {
  const now = new Date();
  const walletConfig = walletType === 'passive' ? this.passiveWallet : this.directBonusWallet;
  
  if (!walletConfig) {
    return false;
  }
  
  // Check if override is active and not expired
  if (walletConfig.overrideActive && walletConfig.overrideExpiry && now < walletConfig.overrideExpiry) {
    return true;
  }
  
  // If override is expired, auto-disable it
  if (walletConfig.overrideActive && walletConfig.overrideExpiry && now >= walletConfig.overrideExpiry) {
    walletConfig.overrideActive = false;
    this.save();
  }
  
  // Check if encashment is enabled
  if (!walletConfig.isEnabled) {
    return false;
  }
  
  // Check if today is an allowed day
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()].toLowerCase();
  
  if (!walletConfig.allowedDays.map(day => day.toLowerCase()).includes(currentDay)) {
    return false;
  }
  
  // Check if current time is within allowed time window
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  return currentTime >= walletConfig.startTime && currentTime <= walletConfig.endTime;
};

// Method to get detailed encashment status with reason for a specific wallet type
encashmentSettingsSchema.methods.getEncashmentStatus = function(walletType = 'passive') {
  const now = new Date();
  const walletConfig = walletType === 'passive' ? this.passiveWallet : this.directBonusWallet;
  const walletName = walletType === 'passive' ? 'Passive Wallet' : 'Direct Bonus Wallet';
  
  if (!walletConfig) {
    return {
      isAllowed: false,
      reason: 'config_not_found',
      message: `${walletName} encashment configuration not found.`
    };
  }
  
  // Check if override is active and not expired
  if (walletConfig.overrideActive && walletConfig.overrideExpiry && now < walletConfig.overrideExpiry) {
    const timeLeft = Math.ceil((walletConfig.overrideExpiry - now) / (1000 * 60)); // minutes
    return {
      isAllowed: true,
      reason: 'override',
      message: `${walletName} encashment is temporarily open. Time remaining: ${timeLeft} minutes.`
    };
  }
  
  // If override is expired, auto-disable it
  if (walletConfig.overrideActive && walletConfig.overrideExpiry && now >= walletConfig.overrideExpiry) {
    walletConfig.overrideActive = false;
    this.save();
  }
  
  // Check if encashment is enabled
  if (!walletConfig.isEnabled) {
    return {
      isAllowed: false,
      reason: 'disabled',
      message: `${walletName} encashment requests are currently disabled.`
    };
  }
  
  // Check if today is an allowed day
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()].toLowerCase();
  
  if (!walletConfig.allowedDays.map(day => day.toLowerCase()).includes(currentDay)) {
    const allowedDaysFormatted = walletConfig.allowedDays.map(day => 
      day.charAt(0).toUpperCase() + day.slice(1)
    ).join(', ');
    return {
      isAllowed: false,
      reason: 'day_not_allowed',
      message: `${walletName} encashment is only allowed on: ${allowedDaysFormatted}.`
    };
  }
  
  // Check if current time is within allowed time window
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  const isTimeAllowed = currentTime >= walletConfig.startTime && currentTime <= walletConfig.endTime;
  
  if (!isTimeAllowed) {
    return {
      isAllowed: false,
      reason: 'time_not_allowed',
      message: `${walletName} encashment requests are only allowed between ${walletConfig.startTime} and ${walletConfig.endTime}.`
    };
  }
  
  return {
    isAllowed: true,
    reason: 'allowed',
    message: `${walletName} encashment requests are currently open.`
  };
};

// Static method to get or create default settings
encashmentSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      passiveWallet: {
        startTime: '11:00',
        endTime: '15:00',
        allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        isEnabled: true,
        overrideActive: false,
        overrideExpiry: null
      },
      directBonusWallet: {
        startTime: '11:00',
        endTime: '15:00',
        allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        isEnabled: true,
        overrideActive: false,
        overrideExpiry: null
      }
    });
  }
  return settings;
};

// Helper method to update specific wallet settings
encashmentSettingsSchema.methods.updateWalletSettings = function(walletType, updates) {
  const walletConfig = walletType === 'passive' ? this.passiveWallet : this.directBonusWallet;
  
  if (!walletConfig) {
    throw new Error(`Invalid wallet type: ${walletType}`);
  }
  
  // Update fields if provided
  if (updates.startTime !== undefined) walletConfig.startTime = updates.startTime;
  if (updates.endTime !== undefined) walletConfig.endTime = updates.endTime;
  if (updates.isEnabled !== undefined) walletConfig.isEnabled = updates.isEnabled;
  if (updates.allowedDays !== undefined) {
    walletConfig.allowedDays = updates.allowedDays.map(day => day.toLowerCase());
  }
  if (updates.overrideActive !== undefined) walletConfig.overrideActive = updates.overrideActive;
  if (updates.overrideExpiry !== undefined) walletConfig.overrideExpiry = updates.overrideExpiry;
  
  this.lastUpdated = new Date();
  
  return this;
};

module.exports = mongoose.model('EncashmentSettings', encashmentSettingsSchema);