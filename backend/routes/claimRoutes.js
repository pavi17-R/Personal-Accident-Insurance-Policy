const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');

// NOTE: static route must be declared before the '/:id' dynamic route
router.post('/assess-fraud', claimController.assessFraudController);

router.get('/', claimController.getAllClaims);
router.get('/:id', claimController.getClaimById);
router.post('/', claimController.createClaim);
router.post('/:id/decide', claimController.decideClaim);
router.post('/:id/mark-paid', claimController.markClaimPaid);

module.exports = router;
