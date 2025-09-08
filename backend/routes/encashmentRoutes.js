const express = require('express');
const {
  getEncashmentSettings,
  updateEncashmentSettings,
  getWalletEncashmentSettings,
  updateWalletEncashmentSettings,
  activateEncashmentOverride,
  getEncashmentStatus,
  deactivateEncashmentOverride
} = require('../controllers/encashmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route for checking encashment status
router.get('/encashment-status', protect, getEncashmentStatus);

// Admin routes - apply middleware only to admin routes
router.route('/admin/encashment-settings')
  .get(protect, authorize('admin'), getEncashmentSettings)
  .post(protect, authorize('admin'), updateEncashmentSettings);

// Wallet-specific encashment settings routes
router.route('/admin/encashment-settings/:walletType')
  .get(protect, authorize('admin'), getWalletEncashmentSettings)
  .post(protect, authorize('admin'), updateWalletEncashmentSettings);

router.post('/admin/encashment-override', protect, authorize('admin'), activateEncashmentOverride);
router.post('/admin/encashment-override/deactivate', protect, authorize('admin'), deactivateEncashmentOverride);

module.exports = router;