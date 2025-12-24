const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request');

router.get('/', requestController.getAllRequests);
router.get('/by-code/:code', requestController.getRequestByCode);
router.post('/', requestController.createRequest);
router.put('/:id/approve', requestController.approveRequest);
router.put('/:id/reject', requestController.rejectRequest);
router.get('/:id', requestController.getRequestById);
router.delete('/:id', requestController.deleteRequest);

module.exports = router;
