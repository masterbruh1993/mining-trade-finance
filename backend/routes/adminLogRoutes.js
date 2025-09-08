const express = require('express');
const {
  getAdminLogs,
  getAdminLogsSummary,
  getRecentAdminLogs,
  createAdminLog
} = require('../controllers/adminLogController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// Admin log routes
router.route('/')
  .get(getAdminLogs)
  .post(createAdminLog);

router.get('/summary', getAdminLogsSummary);
router.get('/recent', getRecentAdminLogs);

module.exports = router;