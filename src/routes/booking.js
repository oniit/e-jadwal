const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking');
const { validateBooking, validateId, handleValidationErrors } = require('../middleware/validation');

router.get('/', bookingController.getAllBookings);
router.get('/by-code/:code', bookingController.getBookingByCode);
router.post('/', validateBooking, handleValidationErrors, bookingController.createBooking);
router.put('/:id', validateId, validateBooking, handleValidationErrors, bookingController.updateBooking);
router.delete('/:id', validateId, handleValidationErrors, bookingController.deleteBooking);

module.exports = router;
