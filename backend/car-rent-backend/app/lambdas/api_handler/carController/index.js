const { v4: uuidv4 } = require('uuid');
const { createResponse } = require('../utils/responseUtil');
const Car = require('../models/carModel');
const Booking = require('../models/bookingModel');
const Feedback = require('../models/feedbackModel');
const Location = require('../models/locationModel');

const CarController = {
  // Get all cars with filtering options
  getAllCars: async (event) => {
    try {
      const queryParams = event.queryStringParameters || {};
      const {
        pickupLocationId,
        dropOffLocationId,
        pickupDateTime,
        dropOffDateTime,
        category,
        gearBoxType,
        fuelType,
        minPrice,
        maxPrice,
        page = 1,
        size = 8
      } = queryParams;

      // Build filter object
      const filter = {};

      // Add category filter if provided
      if (category) {
        filter.category = category;
      }

      // Add gearBoxType filter if provided
      if (gearBoxType) {
        filter.gearBoxType = gearBoxType;
      }

      // Add fuelType filter if provided
      if (fuelType) {
        filter.fuelType = fuelType;
      }

      // Add price range filter if provided
      if (minPrice) {
        filter.pricePerDay = { $gte: parseInt(minPrice) };
      }
      if (maxPrice) {
        filter.pricePerDay = { ...filter.pricePerDay, $lte: parseInt(maxPrice) };
      }

      // Add location filter if provided
      if (pickupLocationId) {
        filter.locationId = pickupLocationId;
      }

      // Filter out cars that are booked during the requested period
      if (pickupDateTime && dropOffDateTime) {
        const pickupDate = new Date(pickupDateTime);
        const dropOffDate = new Date(dropOffDateTime);

        // Find all bookings that overlap with the requested period
        const overlappingBookings = await Booking.find({
          $and: [
            { bookingStatus: { $nin: ['CANCELLED'] } },
            {
              $or: [
                {
                  // Booking starts during requested period
                  pickupDateTime: { $gte: pickupDate, $lt: dropOffDate }
                },
                {
                  // Booking ends during requested period
                  dropOffDateTime: { $gt: pickupDate, $lte: dropOffDate }
                },
                {
                  // Booking spans the entire requested period
                  $and: [
                    { pickupDateTime: { $lte: pickupDate } },
                    { dropOffDateTime: { $gte: dropOffDate } }
                  ]
                }
              ]
            }
          ]
        }).select('carId');

        // Extract car IDs from overlapping bookings
        const bookedCarIds = overlappingBookings.map(booking => booking.carId);

        // Exclude booked cars from results
        if (bookedCarIds.length > 0) {
          filter.carId = { $nin: bookedCarIds };
        }

        // Only show available cars
        filter.status = 'AVAILABLE';
      }

      // Calculate pagination
      const pageNum = parseInt(page);
      const pageSize = parseInt(size);
      const skip = (pageNum - 1) * pageSize;

      // Execute query with pagination
      const cars = await Car.find(filter)
        .sort({ carRating: -1 })
        .skip(skip)
        .limit(pageSize);

      // Count total matching documents for pagination info
      const totalElements = await Car.countDocuments(filter);
      const totalPages = Math.ceil(totalElements / pageSize);

      // Transform data to match expected response format
      const carsList = cars.map(car => ({
        carId: car.carId,
        model: `${car.brand} ${car.model} ${car.year}`,
        imageUrl: car.images.length > 0 ? car.images[0] : null,
        location: car.location,
        pricePerDay: car.pricePerDay.toString(),
        carRating: car.carRating.toString(),
        serviceRating: car.serviceRating.toString(),
        status: car.status
      }));

      return createResponse(200, {
        content: carsList,
        currentPage: pageNum,
        totalElements,
        totalPages
      });
    } catch (error) {
      console.error('Error getting cars:', error);
      return createResponse(500, {
        message: 'Error retrieving cars',
        error: error.message
      });
    }
  },

  // Get car by ID
  getCarById: async (event) => {
    try {
      const carId = event.pathParameters.carId;

      const car = await Car.findOne({ carId });

      if (!car) {
        return createResponse(404, {
          message: 'Car not found'
        });
      }

      // Transform data to match expected response format
      const carDetails = {
        carId: car.carId,
        model: `${car.brand} ${car.model} ${car.year}`,
        location: car.location,
        pricePerDay: car.pricePerDay.toString(),
        carRating: car.carRating.toString(),
        serviceRating: car.serviceRating.toString(),
        status: car.status,
        gearBoxType: car.gearBoxType,
        fuelType: car.fuelType,
        engineCapacity: car.engineCapacity,
        fuelConsumption: car.fuelConsumption,
        passengerCapacity: car.passengerCapacity,
        climateControlOption: car.climateControlOption,
        images: car.images
      };

      return createResponse(200, carDetails);
    } catch (error) {
      console.error('Error getting car by ID:', error);
      return createResponse(500, {
        message: 'Error retrieving car',
        error: error.message
      });
    }
  },

  // Get popular cars
  getPopularCars: async (event) => {
    try {
      const queryParams = event.queryStringParameters || {};
      const { category } = queryParams;

      // Build filter object
      const filter = {
        status: 'AVAILABLE',
        carRating: { $gt: 4.0 } // Only cars with rating > 4.0
      };

      // Add category filter if provided
      if (category) {
        filter.category = category;
      }

      // Get top 5 cars by rating
      const popularCars = await Car.find(filter)
        .sort({ carRating: -1 })
        .limit(5);

      // Transform data to match expected response format
      const carsList = popularCars.map(car => ({
        carId: car.carId,
        model: `${car.brand} ${car.model} ${car.year}`,
        imageUrl: car.images.length > 0 ? car.images[0] : null,
        location: car.location,
        pricePerDay: car.pricePerDay.toString(),
        carRating: car.carRating.toString(),
        serviceRating: car.serviceRating.toString(),
        status: car.status
      }));

      return createResponse(200, {
        content: carsList
      });
    } catch (error) {
      console.error('Error getting popular cars:', error);
      return createResponse(500, {
        message: 'Error retrieving popular cars',
        error: error.message
      });
    }
  },

  // Get car booked days
  getCarBookedDays: async (event) => {
    try {
      const carId = event.pathParameters.carId;

      // Find all active bookings for the car
      const bookings = await Booking.find({
        carId,
        bookingStatus: { $nin: ['CANCELLED'] }
      }).select('pickupDateTime dropOffDateTime');

      if (!bookings || bookings.length === 0) {
        return createResponse(200, {
          content: []
        });
      }

      // Generate array of booked dates
      const bookedDates = new Set();
      
      bookings.forEach(booking => {
        const pickupDate = new Date(booking.pickupDateTime);
        const dropOffDate = new Date(booking.dropOffDateTime);
        
        // Loop through each day in the booking
        const currentDate = new Date(pickupDate);
        while (currentDate <= dropOffDate) {
          bookedDates.add(currentDate.toISOString().split('T')[0]); // Add date in YYYY-MM-DD format
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

      return createResponse(200, {
        content: Array.from(bookedDates)
      });
    } catch (error) {
      console.error('Error getting car booked days:', error);
      return createResponse(500, {
        message: 'Error retrieving car booked days',
        error: error.message
      });
    }
  },

  // Get car client reviews
  getCarClientReviews: async (event) => {
    try {
      const carId = event.pathParameters.carId;
      const queryParams = event.queryStringParameters || {};
      const {
        page = 1,
        size = 5,
        sort = 'DATE',
        direction = 'DESC'
      } = queryParams;

      // Calculate pagination
      const pageNum = parseInt(page);
      const pageSize = parseInt(size);
      const skip = (pageNum - 1) * pageSize;

      // Determine sort field and direction
      let sortField = { date: -1 }; // Default sort by date descending
      
      if (sort === 'RATING') {
        sortField = { carRating: direction === 'ASC' ? 1 : -1 };
      } else if (sort === 'DATE') {
        sortField = { date: direction === 'ASC' ? 1 : -1 };
      }

      // Find reviews for the car
      const reviews = await Feedback.find({ carId })
        .sort(sortField)
        .skip(skip)
        .limit(pageSize);

      // Count total reviews for pagination info
      const totalElements = await Feedback.countDocuments({ carId });
      const totalPages = Math.ceil(totalElements / pageSize);

      // Transform data to match expected response format
      const reviewsList = reviews.map(review => ({
        author: review.author,
        authorImageUrl: review.authorImageUrl,
        date: new Date(review.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        rentalExperience: ((review.carRating + review.serviceRating) / 2).toFixed(1),
        text: review.feedbackText
      }));

      return createResponse(200, {
        content: reviewsList,
        currentPage: pageNum,
        totalElements,
        totalPages
      });
    } catch (error) {
      console.error('Error getting car client reviews:', error);
      return createResponse(500, {
        message: 'Error retrieving car client reviews',
        error: error.message
      });
    }
  },

  // Admin: Create a new car
  createCar: async (event) => {
    try {
      const carData = JSON.parse(event.body);
      const carId = uuidv4();
      
      // Check if location exists
      const location = await Location.findOne({ locationId: carData.locationId });
      if (!location) {
        return createResponse(400, {
          message: 'Invalid location ID'
        });
      }

      // Create new car
      const newCar = new Car({
        carId,
        model: carData.model,
        brand: carData.brand,
        year: parseInt(carData.year),
        category: carData.category,
        gearBoxType: carData.gearBoxType,
        fuelType: carData.fuelType,
        engineCapacity: carData.engineCapacity,
        fuelConsumption: carData.fuelConsumption,
        passengerCapacity: carData.passengerCapacity,
        climateControlOption: carData.climateControlOption,
        status: carData.status || 'AVAILABLE',
        pricePerDay: parseFloat(carData.pricePerDay),
        locationId: carData.locationId,
        location: `${location.locationName}, ${location.locationAddress}`,
        images: carData.images || [],
        carRating: carData.carRating || 0,
        serviceRating: carData.serviceRating || 0,
        carNumber: carData.carNumber
      });

      await newCar.save();

      return createResponse(201, {
        message: 'Car created successfully',
        carId
      });
    } catch (error) {
      console.error('Error creating car:', error);
      return createResponse(500, {
        message: 'Error creating car',
        error: error.message
      });
    }
  },

  // Admin: Update a car
  updateCar: async (event) => {
    try {
      const carId = event.pathParameters.carId;
      const updateData = JSON.parse(event.body);
      
      // Find car
      const car = await Car.findOne({ carId });
      if (!car) {
        return createResponse(404, {
          message: 'Car not found'
        });
      }

      // Update location info if locationId is changed
      if (updateData.locationId && updateData.locationId !== car.locationId) {
        const location = await Location.findOne({ locationId: updateData.locationId });
        if (!location) {
          return createResponse(400, {
            message: 'Invalid location ID'
          });
        }
        updateData.location = `${location.locationName}, ${location.locationAddress}`;
      }

      // Update car data
      const updatedCar = await Car.findOneAndUpdate(
        { carId },
        { 
          ...updateData,
          updatedAt: new Date()
        },
        { new: true }
      );

      return createResponse(200, {
        message: 'Car updated successfully',
        carId: updatedCar.carId
      });
    } catch (error) {
      console.error('Error updating car:', error);
      return createResponse(500, {
        message: 'Error updating car',
        error: error.message
      });
    }
  },

  // Admin: Delete a car
  deleteCar: async (event) => {
    try {
      const carId = event.pathParameters.carId;
      
      // Check if car exists
      const car = await Car.findOne({ carId });
      if (!car) {
        return createResponse(404, {
          message: 'Car not found'
        });
      }

      // Check if car has active bookings
      const activeBookings = await Booking.findOne({
        carId,
        bookingStatus: { $nin: ['CANCELLED', 'BOOKING_FINISHED'] }
      });

      if (activeBookings) {
        return createResponse(400, {
          message: 'Cannot delete car with active bookings'
        });
      }

      // Delete car
      await Car.deleteOne({ carId });

      return createResponse(200, {
        message: 'Car deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting car:', error);
      return createResponse(500, {
        message: 'Error deleting car',
        error: error.message
      });
    }
  }
};

module.exports = CarController;