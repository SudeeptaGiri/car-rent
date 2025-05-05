const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
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