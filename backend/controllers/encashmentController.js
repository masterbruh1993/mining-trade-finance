const EncashmentSettings = require('../models/EncashmentSettings');
const AdminLog = require('../models/AdminLog');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get encashment settings for both wallet types
// @route   GET /api/v1/admin/encashment-settings
// @access  Admin
exports.getEncashmentSettings = async (req, res, next) => {
  try {
    const settings = await EncashmentSettings.getSettings();
    
    res.status(200).json({
      success: true,
      data: {
        passiveWallet: settings.passiveWallet,
        directBonusWallet: settings.directBonusWallet,
        lastUpdated: settings.lastUpdated,
        updatedBy: settings.updatedBy
      }
    });
  } catch (error) {
    console.error('Error fetching encashment settings:', error);
    return next(new ErrorResponse('Failed to fetch encashment settings', 500));
  }
};

// @desc    Get encashment settings for specific wallet type
// @route   GET /api/v1/admin/encashment-settings/:walletType
// @access  Admin
exports.getWalletEncashmentSettings = async (req, res, next) => {
  try {
    const { walletType } = req.params;
    
    if (!['passive', 'directBonus'].includes(walletType)) {
      return next(new ErrorResponse('Invalid wallet type. Use: passive, directBonus', 400));
    }
    
    const settings = await EncashmentSettings.getSettings();
    const walletConfig = walletType === 'passive' ? settings.passiveWallet : settings.directBonusWallet;
    
    res.status(200).json({
      success: true,
      data: {
        walletType,
        config: walletConfig,
        lastUpdated: settings.lastUpdated,
        updatedBy: settings.updatedBy
      }
    });
  } catch (error) {
    console.error('Error fetching wallet encashment settings:', error);
    return next(new ErrorResponse('Failed to fetch wallet encashment settings', 500));
  }
};

// @desc    Update encashment settings for specific wallet type
// @route   POST /api/v1/admin/encashment-settings/:walletType
// @access  Admin
exports.updateWalletEncashmentSettings = async (req, res, next) => {
  try {
    const { walletType } = req.params;
    const { startTime, endTime, isEnabled, allowedDays, overrideActive, overrideExpiry } = req.body;
    
    if (!['passive', 'directBonus'].includes(walletType)) {
      return next(new ErrorResponse('Invalid wallet type. Use: passive, directBonus', 400));
    }
    
    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timeRegex.test(startTime)) {
      return next(new ErrorResponse('Invalid start time format. Use HH:MM', 400));
    }
    if (endTime && !timeRegex.test(endTime)) {
      return next(new ErrorResponse('Invalid end time format. Use HH:MM', 400));
    }
    
    // Validate allowedDays
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (allowedDays && Array.isArray(allowedDays)) {
      const invalidDays = allowedDays.filter(day => !validDays.includes(day.toLowerCase()));
      if (invalidDays.length > 0) {
        return next(new ErrorResponse(`Invalid days: ${invalidDays.join(', ')}. Valid days: ${validDays.join(', ')}`, 400));
      }
    }
    
    let settings = await EncashmentSettings.getSettings();
    
    // Capture old values for logging
    const oldValues = walletType === 'passive' ? 
      JSON.parse(JSON.stringify(settings.passiveWallet)) : 
      JSON.parse(JSON.stringify(settings.directBonusWallet));
    
    // Update wallet-specific settings
    settings.updateWalletSettings(walletType, {
      startTime,
      endTime,
      isEnabled,
      allowedDays,
      overrideActive,
      overrideExpiry
    });
    
    settings.updatedBy = req.user?.id || 'admin';
    
    await settings.save();
    
    // Capture new values for logging
    const newValues = walletType === 'passive' ? 
      JSON.parse(JSON.stringify(settings.passiveWallet)) : 
      JSON.parse(JSON.stringify(settings.directBonusWallet));
    
    // Log admin action
    try {
      await AdminLog.logAction({
        adminId: req.user?.id || null,
        action: 'encashment_settings_update',
        walletType: walletType,
        oldValues: oldValues,
        newValues: newValues,
        description: `Updated ${walletType === 'passive' ? 'Passive' : 'Direct Bonus'} wallet encashment settings`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
      // Don't fail the main operation if logging fails
    }
    
    const walletConfig = walletType === 'passive' ? settings.passiveWallet : settings.directBonusWallet;
    
    res.status(200).json({
      success: true,
      data: {
        walletType,
        config: walletConfig,
        lastUpdated: settings.lastUpdated,
        updatedBy: settings.updatedBy
      },
      message: `${walletType === 'passive' ? 'Passive' : 'Direct Bonus'} wallet encashment settings updated successfully`
    });
  } catch (error) {
    console.error('Error updating wallet encashment settings:', error);
    return next(new ErrorResponse('Failed to update wallet encashment settings', 500));
  }
};

// @desc    Update encashment settings (legacy endpoint - updates both wallets)
// @route   POST /api/v1/admin/encashment-settings
// @access  Admin
exports.updateEncashmentSettings = async (req, res, next) => {
  try {
    const { startTime, endTime, isEnabled, allowedDays, overrideActive, overrideExpiry } = req.body;
    
    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timeRegex.test(startTime)) {
      return next(new ErrorResponse('Invalid start time format. Use HH:MM', 400));
    }
    if (endTime && !timeRegex.test(endTime)) {
      return next(new ErrorResponse('Invalid end time format. Use HH:MM', 400));
    }
    
    // Validate allowedDays
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (allowedDays && Array.isArray(allowedDays)) {
      const invalidDays = allowedDays.filter(day => !validDays.includes(day.toLowerCase()));
      if (invalidDays.length > 0) {
        return next(new ErrorResponse(`Invalid days: ${invalidDays.join(', ')}. Valid days: ${validDays.join(', ')}`, 400));
      }
    }
    
    let settings = await EncashmentSettings.getSettings();
    
    // Update both wallet types with the same settings (legacy behavior)
    const updates = {
      startTime,
      endTime,
      isEnabled,
      allowedDays,
      overrideActive,
      overrideExpiry
    };
    
    settings.updateWalletSettings('passive', updates);
    settings.updateWalletSettings('directBonus', updates);
    
    settings.updatedBy = req.user?.id || 'admin';
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      data: {
        passiveWallet: settings.passiveWallet,
        directBonusWallet: settings.directBonusWallet,
        lastUpdated: settings.lastUpdated,
        updatedBy: settings.updatedBy
      },
      message: 'Encashment settings updated successfully for both wallets'
    });
  } catch (error) {
    console.error('Error updating encashment settings:', error);
    return next(new ErrorResponse('Failed to update encashment settings', 500));
  }
};

// @desc    Activate encashment override
// @route   POST /api/v1/admin/encashment-override
// @access  Admin
exports.activateEncashmentOverride = async (req, res, next) => {
  try {
    const { duration, unit } = req.body; // duration in number, unit in 'minutes' or 'hours'
    
    if (!duration || !unit) {
      return next(new ErrorResponse('Duration and unit are required', 400));
    }
    
    if (!['minutes', 'hours'].includes(unit)) {
      return next(new ErrorResponse('Unit must be either "minutes" or "hours"', 400));
    }
    
    if (duration <= 0 || duration > 24) {
      return next(new ErrorResponse('Duration must be between 1 and 24', 400));
    }
    
    let settings = await EncashmentSettings.getSettings();
    
    // Calculate expiry time
    const now = new Date();
    const expiryTime = new Date(now);
    
    if (unit === 'minutes') {
      expiryTime.setMinutes(now.getMinutes() + duration);
    } else if (unit === 'hours') {
      expiryTime.setHours(now.getHours() + duration);
    }
    
    settings.overrideActive = true;
    settings.overrideExpiry = expiryTime;
    settings.lastUpdated = new Date();
    settings.updatedBy = req.user.id;
    
    await settings.save();
    
    // Log admin action
    try {
      await AdminLog.logAction({
        adminId: req.user?.id || null,
        action: 'encashment_override_enable',
        oldValues: { overrideActive: false },
        newValues: { overrideActive: true, overrideExpiry: expiryTime },
        description: `Activated encashment override for ${duration} ${unit}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
    }
    
    res.status(200).json({
      success: true,
      message: `Encashment override activated for ${duration} ${unit}`,
      data: {
        overrideActive: true,
        overrideExpiry: expiryTime,
        duration: duration,
        unit: unit
      }
    });
  } catch (error) {
    console.error('Error activating encashment override:', error);
    return next(new ErrorResponse('Failed to activate encashment override', 500));
  }
};

// @desc    Check if encashment is currently allowed for both wallet types
// @route   GET /api/v1/encashment-status
// @access  Private
exports.getEncashmentStatus = async (req, res, next) => {
  try {
    const settings = await EncashmentSettings.getSettings();
    
    // Get status for both wallet types
    const passiveStatus = settings.getEncashmentStatus('passive');
    const directBonusStatus = settings.getEncashmentStatus('directBonus');
    
    res.status(200).json({
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
    });
  } catch (error) {
    console.error('Error checking encashment status:', error);
    return next(new ErrorResponse('Failed to check encashment status', 500));
  }
};

// @desc    Deactivate encashment override
// @route   POST /api/v1/admin/encashment-override/deactivate
// @access  Admin
exports.deactivateEncashmentOverride = async (req, res, next) => {
  try {
    let settings = await EncashmentSettings.getSettings();
    
    settings.overrideActive = false;
    settings.overrideExpiry = null;
    settings.lastUpdated = new Date();
    settings.updatedBy = req.user.id;
    
    await settings.save();
    
    // Log admin action
    try {
      await AdminLog.logAction({
        adminId: req.user?.id || null,
        action: 'encashment_override_disable',
        oldValues: { overrideActive: true },
        newValues: { overrideActive: false, overrideExpiry: null },
        description: 'Deactivated encashment override',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Encashment override deactivated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error deactivating encashment override:', error);
    return next(new ErrorResponse('Failed to deactivate encashment override', 500));
  }
};