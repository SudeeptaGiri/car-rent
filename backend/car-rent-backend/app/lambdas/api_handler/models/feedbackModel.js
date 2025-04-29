const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  feedbackId: {
    type: String,
    required: true,
    unique: true
  },
  carId: {
    type: String,
    required: true
  },
  clientId: {
    type: String,
    required: true
  },
  bookingId: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  authorImageUrl: {
    type: String
  },
  carRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  serviceRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedbackText: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for better query performance
feedbackSchema.index({ carId: 1 });
feedbackSchema.index({ clientId: 1 });
feedbackSchema.index({ date: -1 });
feedbackSchema.index({ carRating: -1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;