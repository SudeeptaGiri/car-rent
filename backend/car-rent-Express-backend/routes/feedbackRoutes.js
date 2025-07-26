const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');

// Feedback routes
router.post('/', authenticate, feedbackController.createFeedback);  // US-8: Client's feedback
router.get('/', feedbackController.getAllFeedback);  // US-7: Admin view (returns all feedbacks)
router.get('/recent', feedbackController.getRecentFeedbacks);  // US-4: Main page view (returns recent feedbacks)

module.exports = router;