const AdminLog = require('../models/AdminLog');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get admin activity logs with filtering and pagination
// @route   GET /api/v1/admin/logs
// @access  Admin
exports.getAdminLogs = async (req, res, next) => {
  try {
    const {
      adminId,
      action,
      targetUserId,
      page = 1,
      limit = 50,
      startDate,
      endDate
    } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return next(new ErrorResponse('Invalid pagination parameters', 400));
    }

    const result = await AdminLog.getLogs({
      adminId,
      action,
      targetUserId,
      page: pageNum,
      limit: limitNum,
      startDate,
      endDate
    });

    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return next(new ErrorResponse('Failed to fetch admin logs', 500));
  }
};

// @desc    Get admin activity summary/statistics
// @route   GET /api/v1/admin/logs/summary
// @access  Admin
exports.getAdminLogsSummary = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days);
    
    if (daysNum < 1 || daysNum > 365) {
      return next(new ErrorResponse('Days parameter must be between 1 and 365', 400));
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get activity counts by action type
    const actionCounts = await AdminLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get activity counts by admin
    const adminCounts = await AdminLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$adminId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'admin'
        }
      },
      {
        $unwind: '$admin'
      },
      {
        $project: {
          adminId: '$_id',
          adminUsername: '$admin.username',
          adminEmail: '$admin.email',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get daily activity counts
    const dailyActivity = await AdminLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get total count
    const totalCount = await AdminLog.countDocuments({
      createdAt: { $gte: startDate }
    });

    res.status(200).json({
      success: true,
      data: {
        period: `${daysNum} days`,
        totalActivities: totalCount,
        actionBreakdown: actionCounts,
        adminBreakdown: adminCounts,
        dailyActivity: dailyActivity
      }
    });
  } catch (error) {
    console.error('Error fetching admin logs summary:', error);
    return next(new ErrorResponse('Failed to fetch admin logs summary', 500));
  }
};

// @desc    Get recent admin activities (last 24 hours)
// @route   GET /api/v1/admin/logs/recent
// @access  Admin
exports.getRecentAdminLogs = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const limitNum = parseInt(limit);
    
    if (limitNum < 1 || limitNum > 100) {
      return next(new ErrorResponse('Limit must be between 1 and 100', 400));
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const logs = await AdminLog.find({
      createdAt: { $gte: yesterday }
    })
    .populate('adminId', 'username email')
    .populate('targetUserId', 'username email')
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .lean();

    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Error fetching recent admin logs:', error);
    return next(new ErrorResponse('Failed to fetch recent admin logs', 500));
  }
};

// @desc    Manually log an admin action (for testing or manual entries)
// @route   POST /api/v1/admin/logs
// @access  Admin
exports.createAdminLog = async (req, res, next) => {
  try {
    const {
      action,
      targetUserId,
      walletType,
      description,
      oldValues,
      newValues
    } = req.body;

    if (!action || !description) {
      return next(new ErrorResponse('Action and description are required', 400));
    }

    const logEntry = await AdminLog.logAction({
      adminId: req.user.id,
      action,
      targetUserId,
      walletType,
      oldValues,
      newValues,
      description,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      data: logEntry,
      message: 'Admin log entry created successfully'
    });
  } catch (error) {
    console.error('Error creating admin log:', error);
    return next(new ErrorResponse('Failed to create admin log entry', 500));
  }
};