const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  clientId: {
    type: String,
    required: true
  },
  pickupDateTime: {
    type: Date,
    required: true
  },
  dropOffDateTime: {
    type: Date,
    required: true
  },
  pickupLocationId: {
    type: String,
    required: true
  },
  dropOffLocationId: {
    type: String,
    required: true
  },
  bookingStatus: {
    type: String,
    enum: ['RESERVED', 'RESERVED_BY_SUPPORT_AGENT', 'SERVICE_STARTED', 'SERVICE_PROVIDED', 'BOOKING_FINISHED', 'CANCELLED'],
    default: 'RESERVED'
  },
  orderNumber: {
    type: String,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
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
bookingSchema.index({ carId: 1 }, { unique: false });
bookingSchema.index({ clientId: 1 }, { unique: false });
bookingSchema.index({ pickupDateTime: 1 });
bookingSchema.index({ dropOffDateTime: 1 });
bookingSchema.index({ bookingStatus: 1 }, { unique: false });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;