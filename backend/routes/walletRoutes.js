const express = require('express');
const { 
  getWallets,
  getWallet,
  getWalletByType,
  getWalletTransactions,
  transferBetweenWallets,
  initializeWallets,
  getCreditWallet,
  getPassiveWallet,
  getAllWalletBalances
} = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getWallets);

router.route('/initialize')
  .post(initializeWallets);

router.route('/credit')
  .get(getCreditWallet);

router.route('/passive')
  .get(getPassiveWallet);

router.route('/balances')
  .get(getAllWalletBalances);

router.route('/transfer')
  .post(transferBetweenWallets);

router.route('/type/:walletType')
  .get(getWalletByType);

router.route('/:id')
  .get(getWallet);

router.route('/:id/transactions')
  .get(getWalletTransactions);

module.exports = router;