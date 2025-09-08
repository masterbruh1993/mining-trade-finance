const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'encashment_settings_update',
      'user_activate',
      'user_deactivate', 
      'user_password_reset',
      'encashment_override_enable',
      'encashment_override_disable',
      'reset_user_withdrawals',
      'void_investment'
    ]
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Only for user management actions
  },
  walletType: {
    type: String,
    enum: ['passive', 'directBonus'],
    required: false // Only for encashment settings actions
  },
  oldValues: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient querying
adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ targetUserId: 1, createdAt: -1 });

// Static method to log admin actions
adminLogSchema.statics.logAction = async function({
  adminId,
  action,
  targetUserId = null,
  walletType = null,
  oldValues = null,
  newValues = null,
  description,
  ipAddress = null,
  userAgent = null
}) {
  try {
    const logEntry = new this({
      adminId,
      action,
      targetUserId,
      walletType,
      oldValues,
      newValues,
      description,
      ipAddress,
      userAgent
    });
    
    await logEntry.save();
    return logEntry;
  } catch (error) {
    console.error('Failed to log admin action:', error);
    throw error;
  }
};

// Static method to get logs with pagination and filtering
adminLogSchema.statics.getLogs = async function({
  adminId = null,
  action = null,
  targetUserId = null,
  page = 1,
  limit = 50,
  startDate = null,
  endDate = null
}) {
  const query = {};
  
  if (adminId) query.adminId = adminId;
  if (action) query.action = action;
  if (targetUserId) query.targetUserId = targetUserId;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    this.find(query)
      .populate('adminId', 'username email')
      .populate('targetUserId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);
  
  return {
    logs,
    pagination: {
      current: page,
      total: Math.ceil(total / limit),
      count: logs.length,
      totalRecords: total
    }
  };
};

module.exports = mongoose.model('AdminLog', adminLogSchema);