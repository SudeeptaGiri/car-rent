const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  locationName: {
    type: String,
    required: true
  },
  locationAddress: {
    type: String,
    required: true
  },
  locationImageUrl: {
    type: String
  },
  mapEmbedUrl: {
    type: String,
    description: "Google Maps or other map service embed URL"
  },
  locationId: {
    type: String,
    description: "Optional external location identifier"
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

// Add pre-save middleware to update the 'updatedAt' timestamp
locationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
locationSchema.index({ locationName: 1 });
locationSchema.index({ locationId: 1 }, { sparse: true });

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;