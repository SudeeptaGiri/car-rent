const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
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
    enum: ['ECONOMY', 'COMFORT', 'BUSINESS', 'PREMIUM', 'CROSSOVER', 'MINIVAN', 'ELECTRIC'],
    required: true
  },
  gearBoxType: {
    type: String,
    enum: ['MANUAL', 'AUTOMATIC'],
    required: true
  },
  fuelType: {
    type: String,
    enum: ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'],
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
    enum: ['NONE', 'AIR_CONDITIONER', 'CLIMATE_CONTROL', 'TWO_ZONE_CLIMATE_CONTROL'],
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
  images: {
    type: [String],
    default: []
  },
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
carSchema.index({ category: 1 });
carSchema.index({ status: 1 });
carSchema.index({ locationId: 1 });
carSchema.index({ pricePerDay: 1 });
carSchema.index({ carRating: -1 });

const Car = mongoose.model('Car', carSchema);

module.exports = Car;