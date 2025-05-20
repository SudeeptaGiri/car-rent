const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');

// Car routes
router.get('/', carController.getAllCars);  // US-5: Car selection (returns cars list)
router.get('/popular', carController.getPopularCars);  // US-4: Main page view (returns most popular cars)
router.get('/:carId', carController.getCarById);  // US-5: Car selection (returns car by id)
router.get('/:carId/booked-days', carController.getCarBookedDays);  // US-5: Car selection (returns car booked dates)
router.get('/:carId/client-review', carController.getCarClientReviews);  // US-5: Car selection (returns sorted pageable client reviews)

module.exports = router;