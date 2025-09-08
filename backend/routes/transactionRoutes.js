const express = require('express');
const { 
  getTransactions,
  getTransaction,
  getUserTransactions,
  createDeposit,
  createWithdrawal,
  processTransaction,
  getTransactionSummary
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getTransactions);

router.route('/summary')
  .get(getTransactionSummary);

router.route('/deposit')
  .post(createDeposit);

router.route('/withdraw')
  .post(createWithdrawal);

router.route('/user/:userId')
  .get(authorize('admin'), getUserTransactions);

router.route('/:id')
  .get(getTransaction);

router.route('/:id/process')
  .put(authorize('admin'), processTransaction);

module.exports = router;