const express = require('express');
const router = express.Router();
const homepageController = require('../controllers/homepageController');

// Homepage routes - US-4: Main page view
router.get('/about-us', homepageController.getAboutUs);  // Returns 'About Us' stories
router.get('/faq', homepageController.getFAQ);  // Returns FAQ stories
router.get('/locations', homepageController.getLocations);  // Returns locations

module.exports = router;