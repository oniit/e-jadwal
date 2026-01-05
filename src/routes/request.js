const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request');
const { validateRequest, validateId, handleValidationErrors } = require('../middleware/validation');

router.get('/', requestController.getAllRequests);
router.get('/by-code/:code', requestController.getRequestByCode);
router.post('/', validateRequest, handleValidationErrors, requestController.createRequest);
router.put('/:id/approve', validateId, handleValidationErrors, requestController.approveRequest);
router.put('/:id/reject', validateId, handleValidationErrors, requestController.rejectRequest);
router.get('/:id', validateId, handleValidationErrors, requestController.getRequestById);
router.delete('/:id', validateId, handleValidationErrors, requestController.deleteRequest);

module.exports = router;
