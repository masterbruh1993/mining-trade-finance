const express = require('express');
const {
  getActiveContracts,
  getContractById,
  triggerPayoutProcessing,
  getContractsSummary
} = require('../controllers/activeContractsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes
router.get('/active', getActiveContracts);
router.get('/summary', getContractsSummary);
router.post('/process-payouts', triggerPayoutProcessing);
router.get('/:id', getContractById);

module.exports = router;