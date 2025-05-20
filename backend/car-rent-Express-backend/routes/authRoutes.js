const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication routes
router.post('/sign-in', authController.signIn);  // US-2: Logs user into the system
router.post('/sign-up', authController.signUp);  // US-1: User profile registration; US-3: Automatic Role Assignment

module.exports = router;