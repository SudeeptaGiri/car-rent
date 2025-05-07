// bookingModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  carId: {
    type: Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  carStringId: {
    type: String,
    required: true
  },
  clientId: {
    type: String,
    required: true
  },
  supportAgentId: {
    type: String,
    default: null
  },
  pickupLocationId: {
    type: String,
    required: true
  },
  pickupLocation: {
    type: String,
    required: true
  },
  dropOffLocationId: {
    type: String,
    required: true
  },
  dropOffLocation: {
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
  bookingStatus: {
    type: String,
    enum: ['RESERVED', 'SERVICE_STARTED', 'COMPLETED', 'CANCELLED'],
    default: 'RESERVED'
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  madeBy: {
    type: String,
    enum: ['CLIENT', 'SUPPORT_AGENT'],
    default: 'CLIENT'
  },
  carMillageStart: {
    type: Number,
    default: null
  },
  carMillageEnd: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Create indexes
bookingSchema.index({ clientId: 1, createdAt: -1 });
bookingSchema.index({ carId: 1, pickupDateTime: 1 });
bookingSchema.index({ carStringId: 1, pickupDateTime: 1 });
bookingSchema.index({ supportAgentId: 1, createdAt: -1 });
bookingSchema.index({ pickupLocationId: 1, pickupDateTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);