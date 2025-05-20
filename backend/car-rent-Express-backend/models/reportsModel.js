const mongoose = require('mongoose');
 
// Schema for Sales Reports
const salesReportSchema = new mongoose.Schema({
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  carModel: {
    type: String,
    required: true
  },
  carId: {
    type: String,
    required: true
  },
  daysOfRent: {
    type: Number,
    required: true,
    min: 0
  },
  reservations: {
    type: Number,
    required: true,
    min: 0
  },
  mileageStart: {
    type: Number,
    required: true,
    min: 0
  },
  mileageEnd: {
    type: Number,
    required: true,
    min: 0
  },
  totalMileage: {
    type: Number,
    required: true,
    min: 0
  },
  averageMileage: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'salesreports' });
 
// Pre-save hook to calculate derived values
salesReportSchema.pre('save', function(next) {
  // Calculate total mileage if not set
  if (!this.totalMileage) {
    this.totalMileage = this.mileageEnd - this.mileageStart;
  }
 
  // Calculate average mileage if not set
  if (!this.averageMileage && this.reservations > 0) {
    this.averageMileage = Math.round(this.totalMileage / this.reservations);
  }
 
  next();
});
 
// Schema for Staff Performance Reports
const performanceReportSchema = new mongoose.Schema({
  staffMember: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  totalBookings: {
    type: Number,
    required: true,
    min: 0
  },
  totalRevenue: {
    type: Number,
    required: true,
    min: 0
  },
  customerRating: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  responseTime: {
    type: Number,
    required: true,
    min: 0
  },
  completionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'performancereports' });
 
// Create the models
const SalesReport = mongoose.model('SalesReport', salesReportSchema);
const PerformanceReport = mongoose.model('PerformanceReport', performanceReportSchema);
 
module.exports = {
  SalesReport,
  PerformanceReport
};