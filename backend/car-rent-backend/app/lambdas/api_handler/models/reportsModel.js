// models/reportsModel.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  bookingPeriod: {
    type: String,
    required: true
  },
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  carModel: {
    type: String,
    required: true
  },
  carNumber: {
    type: String,
    required: true
  },
  carMillageStart: {
    type: Number,
    required: true
  },
  carMillageEnd: {
    type: Number,
    required: true
  },
  locationId: {
    type: String,
    required: true
  },
  supportAgentId: {
    type: String,
    required: false
  },
  supportAgent: {
    type: String,
    required: false
  },
  clientId: {
    type: String,
    required: true
  },
  madeBy: {
    type: String,
    required: true
  },
  carServiceRating: {
    type: String,
    default: null
  },
  exportedFileUrls: {
    pdf: String,
    csv: String,
    excel: String
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
reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
reportSchema.index({ reportId: 1 });
reportSchema.index({ carId: 1 });
reportSchema.index({ locationId: 1 });
reportSchema.index({ supportAgentId: 1 });
reportSchema.index({ clientId: 1 });
reportSchema.index({ createdAt: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;