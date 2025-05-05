const mongoose = require('mongoose');

const aboutUsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  numericValue: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  iconType: {
    type: String,
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for better query performance
aboutUsSchema.index({ order: 1 });

const AboutUs = mongoose.model('AboutUs', aboutUsSchema);

module.exports = AboutUs;