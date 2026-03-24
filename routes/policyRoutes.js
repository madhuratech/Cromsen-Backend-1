const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');

router.get('/', policyController.getPolicies);
router.get('/:slug', policyController.getPolicyBySlug);
router.post('/', policyController.createPolicy);
router.put('/:id', policyController.updatePolicy);
router.delete('/:id', policyController.deletePolicy);

module.exports = router;
