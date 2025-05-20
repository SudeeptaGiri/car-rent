const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

// Booking routes
router.get('/', authenticate, authorize(['Admin', 'SupportAgent']), bookingController.getAllBookings);  // US-7: Support Agent bookings management
router.post('/', authenticate, bookingController.createBooking);  // US-6: Car booking (book a car)
router.get('/:userId', authenticate, bookingController.getUserBookings);  // US-6: Car booking (returns client's bookings)

module.exports = router;