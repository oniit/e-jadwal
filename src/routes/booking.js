const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking');
const assetExportController = require('../controllers/assetExport');
const { isAdminOrDriver } = require('../middleware/auth');

// Export route (admin only)
router.get('/export/excel', assetExportController.exportBookings);

// CRUD routes (accessible by admin and supir)
router.get('/', isAdminOrDriver, bookingController.getAllBookings);
router.get('/by-code/:code', isAdminOrDriver, bookingController.getBookingByCode);
router.get('/:id', isAdminOrDriver, bookingController.getBooking);
router.post('/', bookingController.createBooking);
router.put('/:id', bookingController.updateBooking);
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;
