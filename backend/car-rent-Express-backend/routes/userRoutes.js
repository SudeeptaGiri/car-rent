const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// User routes
// US-11: Update Profile information
router.get('/:id/personal-info', authenticate, userController.getPersonalInfo);  // Get user personal info
router.put('/:id/personal-info', authenticate, userController.updatePersonalInfo);  // Change user personal info
router.put('/:id/change-password', authenticate, userController.changePassword);  // Change password for user

// Admin/Support routes
const adminOrSupport = [authenticate, authorize(['Admin', 'SupportAgent'])];
router.get('/clients', adminOrSupport, userController.getClients);  // US-7: Support Agent bookings management

// Admin routes
const adminOnly = [authenticate, authorize(['Admin'])];
router.get('/agents', adminOnly, userController.getAgents);  // US-10: Reporting Interface

module.exports = router;