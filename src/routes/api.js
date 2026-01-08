const express = require('express');
const router = express.Router();
const bookingRoutes = require('./booking');
const assetRoutes = require('./asset');
const requestRoutes = require('./request');
const driverRoutes = require('./driver');
const { verifyToken, checkFirstLogin } = require('../middleware/auth');

// All API routes require authentication and first login check
router.use(verifyToken);
router.use(checkFirstLogin);

router.use('/bookings', bookingRoutes);
router.use('/assets', assetRoutes);
router.use('/requests', requestRoutes);
router.use('/drivers', driverRoutes);

module.exports = router;
