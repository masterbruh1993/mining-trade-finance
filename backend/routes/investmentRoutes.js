const express = require('express');
const { 
  getInvestments,
  getInvestment,
  createInvestment,
  activateInvestment,
  getInvestmentStatus,
  getActiveContracts,
  getInvestmentSummary
} = require('../controllers/investmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getInvestments);

router.route('/deposit')
  .post(createInvestment);

router.route('/activate')
  .post(activateInvestment);

router.route('/active')
  .get(getActiveContracts);

router.route('/summary')
  .get(getInvestmentSummary);

router.route('/:id')
  .get(getInvestment);

router.route('/:id/status')
  .get(getInvestmentStatus);

module.exports = router;