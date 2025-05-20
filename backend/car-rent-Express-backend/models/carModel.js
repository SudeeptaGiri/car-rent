// carModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const carSchema = new Schema({
  carId: {
    type: String,
    required: true,
    unique: true
  },
  model: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  gearBoxType: {
    type: String,
    required: true
  },
  fuelType: {
    type: String,
    required: true
  },
  engineCapacity: {
    type: String,
    required: true
  },
  fuelConsumption: {
    type: String,
    required: true
  },
  passengerCapacity: {
    type: String,
    required: true
  },
  climateControlOption: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'BOOKED', 'UNAVAILABLE'],
    default: 'AVAILABLE'
  },
  pricePerDay: {
    type: Number,
    required: true
  },
  locationId: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  carRating: {
    type: Number,
    default: 0
  },
  serviceRating: {
    type: Number,
    default: 0
  },
  carNumber: {
    type: String,
    required: true
  },
  bookings: [{
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  }]
}, {
  timestamps: true
});

// Create indexes
carSchema.index({ carId: 1 }, { unique: true });
carSchema.index({ locationId: 1, status: 1 });
carSchema.index({ category: 1, pricePerDay: 1 });
carSchema.index({ status: 1, pricePerDay: 1 });

module.exports = mongoose.model('Car', carSchema);