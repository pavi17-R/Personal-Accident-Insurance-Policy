const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');
const premiumController = require('../controllers/premiumController');

// NOTE: static routes must be declared before the '/:id' dynamic route
router.post('/calculate-premium', premiumController.calculatePremiumController);
router.post('/assess-risk', policyController.assessRiskController);

router.get('/', policyController.getAllPolicies);
router.get('/:id', policyController.getPolicyById);
router.post('/', policyController.createPolicy);
router.put('/:id', policyController.updatePolicy);
router.post('/:id/renew', policyController.renewPolicy);
router.post('/:id/cancel', policyController.cancelPolicy);
router.post('/:id/bind', policyController.bindPolicy);
router.post('/:id/decline', policyController.declinePolicy);

module.exports = router;
