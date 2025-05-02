const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  locationId: {
    type: String,
    required: true,
    unique: true
  },
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;