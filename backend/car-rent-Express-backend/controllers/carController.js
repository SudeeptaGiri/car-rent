const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Car = require('../models/carModel');
const Booking = require('../models/bookingModel');
const Feedback = require('../models/feedbackModel');
const Location = require('../models/locationModel');

const CarController = {
  // GET /cars - Get all cars with filtering options
  getAllCars: async (req, res, next) => {
    try {
      console.log('Getting all cars with filters');
      
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
        size = 8,
      } = req.query;

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
        filter.pricePerDay = {
          ...filter.pricePerDay,
          $lte: parseInt(maxPrice),
        };
      }

      // Add location filter if provided
      if (pickupLocationId) {
        try {
          // Convert string ID to MongoDB ObjectId
          const locationObjectId = new mongoose.Types.ObjectId(
            pickupLocationId
          );
          filter.locationId = locationObjectId;
        } catch (error) {
          // If the provided ID isn't a valid ObjectId, try as string
          filter.locationId = pickupLocationId;
        }
      }

      // Filter out cars that are booked during the requested period
      if (pickupDateTime && dropOffDateTime) {
        const pickupDate = new Date(pickupDateTime);
        const dropOffDate = new Date(dropOffDateTime);

        // Find all bookings that overlap with the requested period
        const overlappingBookings = await Booking.find({
          $and: [
            { bookingStatus: { $nin: ["CANCELLED"] } },
            {
              $or: [
                {
                  // Booking starts during requested period
                  pickupDateTime: { $gte: pickupDate, $lt: dropOffDate },
                },
                {
                  // Booking ends during requested period
                  dropOffDateTime: { $gt: pickupDate, $lte: dropOffDate },
                },
                {
                  // Booking spans the entire requested period
                  $and: [
                    { pickupDateTime: { $lte: pickupDate } },
                    { dropOffDateTime: { $gte: dropOffDate } },
                  ],
                },
              ],
            },
          ],
        }).select("carId");

        // Extract car IDs from overlapping bookings
        const bookedCarIds = overlappingBookings.map(
          (booking) => booking.carId
        );

        // Exclude booked cars from results
        if (bookedCarIds.length > 0) {
          filter._id = { $nin: bookedCarIds }; 
        }

        // Only show available cars
        filter.status = "AVAILABLE";
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

      console.log(`Found ${cars.length} cars matching filters (total: ${totalElements})`);

      // Transform data to match expected response format in API spec
      const carsList = cars.map((car) => ({
        carId: car._id.toString(),
        model: `${car.brand} ${car.model} ${car.year}`,
        imageUrl: car.images.length > 0 ? car.images : null,
        location: car.location,
        pricePerDay: car.pricePerDay.toString(),
        carRating: car.carRating.toString(),
        serviceRating: car.serviceRating.toString(),
        status: car.status,
      }));

      return res.status(200).json({
        content: carsList,
        currentPage: pageNum,
        totalElements,
        totalPages,
      });
    } catch (error) {
      console.error("Error getting cars:", error);
      next(error);
    }
  },

  // GET /cars/{carId} - Get car by ID
  getCarById: async (req, res, next) => {
    try {
      console.log('Getting car by ID');
      
      // Extract car ID from route parameters
      const carId = req.params.carId;
      
      if (!carId) {
        return res.status(400).json({ message: 'Car ID is required' });
      }
      
      console.log(`Looking for car with ID: ${carId}`);
      
      let car;
      try {
        const carObjId = new mongoose.Types.ObjectId(carId);
        car = await Car.findOne({ _id: carObjId });
      } catch (error) {
        return res.status(400).json({ message: 'Invalid car ID format' });
      }

      if (!car) {
        return res.status(404).json({
          message: "Car not found",
        });
      }

      // Transform data to match expected response format in API spec
      const carDetails = {
        carId: car._id.toString(),
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
        images: car.images,
      };

      return res.status(200).json(carDetails);
    } catch (error) {
      console.error("Error getting car by ID:", error);
      next(error);
    }
  },

  // GET /cars/popular - Get popular cars
  getPopularCars: async (req, res, next) => {
    try {
      console.log('Getting popular cars');
      
      const { category } = req.query;
      
      console.log('Filter category:', category);

      // Build filter object
      const filter = {
        status: "AVAILABLE",
        carRating: { $gt: 4.0 }, // Only cars with rating > 4.0
      };

      // Add category filter if provided
      if (category) {
        filter.category = category;
      }

      // Get top 5 cars by rating
      const popularCars = await Car.find(filter)
        .sort({ carRating: -1 });
      
      console.log(`Found ${popularCars.length} popular cars`);

      // Transform data to match expected response format in API spec
      const carsList = popularCars.map((car) => ({
        carId: car._id.toString(),
        model: `${car.brand} ${car.model} ${car.year}`,
        imageUrl: car.images.length > 0 ? car.images[0] : null,
        location: car.location,
        pricePerDay: car.pricePerDay.toString(),
        carRating: car.carRating.toString(),
        serviceRating: car.serviceRating.toString(),
        status: car.status,
      }));

      return res.status(200).json({
        content: carsList,
      });
    } catch (error) {
      console.error("Error getting popular cars:", error);
      next(error);
    }
  },

  // GET /cars/{carId}/booked-days - Get car booked days
  getCarBookedDays: async (req, res, next) => {
    try {
      console.log('Getting car booked days');
      
      // Extract car ID from route parameters
      const carId = req.params.carId;
      
      if (!carId) {
        return res.status(400).json({ message: 'Car ID is required' });
      }
      
      console.log(`Looking for booked days for car ID: ${carId}`);
      
      let carObjectId;
      try {
        carObjectId = new mongoose.Types.ObjectId(carId);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid car ID format' });
      }

      // Find all active bookings for the car
      const bookings = await Booking.find({
        carId: carObjectId,
        bookingStatus: { $nin: ["CANCELLED"] },
      }).select("pickupDateTime dropOffDateTime");

      if (!bookings || bookings.length === 0) {
        return res.status(200).json({
          content: [],
        });
      }

      // Generate array of booked dates
      const bookedDates = new Set();

      bookings.forEach((booking) => {
        const pickupDate = new Date(booking.pickupDateTime);
        const dropOffDate = new Date(booking.dropOffDateTime);

        // Loop through each day in the booking
        const currentDate = new Date(pickupDate);
        while (currentDate <= dropOffDate) {
          bookedDates.add(currentDate.toISOString().split("T")[0]); // Add date in YYYY-MM-DD format
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
      
      console.log(`Found ${bookedDates.size} booked days for car ID: ${carId}`);

      return res.status(200).json({
        content: Array.from(bookedDates),
      });
    } catch (error) {
      console.error("Error getting car booked days:", error);
      next(error);
    }
  },

  // GET /cars/{carId}/client-review - Get car client reviews
  getCarClientReviews: async (req, res, next) => {
    try {
      console.log('Getting car client reviews');
      
      // Extract car ID from route parameters
      const carId = req.params.carId;
      
      if (!carId) {
        return res.status(400).json({ message: 'Car ID is required' });
      }
      
      console.log(`Looking for reviews for car ID: ${carId}`);
      
      let carObjectId;
      try {
        carObjectId = new mongoose.Types.ObjectId(carId);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid car ID format' });
      }
      
      const {
        page = 1,
        size = 5,
        sort = "DATE",
        direction = "DESC",
      } = req.query;

      // Calculate pagination
      const pageNum = parseInt(page);
      const pageSize = parseInt(size);
      const skip = (pageNum - 1) * pageSize;

      // Determine sort field and direction
      let sortField = { date: -1 }; // Default sort by date descending

      if (sort === "RATING") {
        sortField = { carRating: direction === "ASC" ? 1 : -1 };
      } else if (sort === "DATE") {
        sortField = { date: direction === "ASC" ? 1 : -1 };
      }

      // Find reviews for the car
      const reviews = await Feedback.find({ carId: carObjectId })
        .sort(sortField)
        .skip(skip)
        .limit(pageSize);

      // Count total reviews for pagination info
      const totalElements = await Feedback.countDocuments({ carId: carObjectId });
      const totalPages = Math.ceil(totalElements / pageSize);
      
      console.log(`Found ${reviews.length} reviews for car ID: ${carId} (total: ${totalElements})`);

      // Transform data to match expected response format in API spec
      const reviewsList = reviews.map((review) => ({
        author: review.author,
        authorImageUrl: review.authorImageUrl || '',
        date: new Date(review.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        rentalExperience: (
          (review.carRating + review.serviceRating) /
          2
        ).toFixed(1),
        text: review.feedbackText,
      }));

      return res.status(200).json({
        content: reviewsList,
        currentPage: pageNum,
        totalElements,
        totalPages,
      });
    } catch (error) {
      console.error("Error getting car client reviews:", error);
      next(error);
    }
  },

  // Optional: Add a car
  addCar: async (req, res, next) => {
    try {
      console.log('Adding a new car');
      
      const {
        brand,
        model,
        year,
        category,
        gearBoxType,
        fuelType,
        engineCapacity,
        fuelConsumption,
        passengerCapacity,
        climateControlOption,
        pricePerDay,
        location,
        locationId,
        images
      } = req.body;

      // Validate required fields
      if (!brand || !model || !year || !pricePerDay) {
        return res.status(400).json({ message: 'Required fields missing' });
      }

      // Create new car
      const newCar = new Car({
        brand,
        model,
        year,
        category: category || 'STANDARD',
        gearBoxType: gearBoxType || 'AUTOMATIC',
        fuelType: fuelType || 'PETROL',
        engineCapacity: engineCapacity || '2.0',
        fuelConsumption: fuelConsumption || '7.5',
        passengerCapacity: passengerCapacity || 5,
        climateControlOption: climateControlOption || 'AC',
        pricePerDay,
        location,
        locationId,
        images: images || [],
        status: 'AVAILABLE',
        carRating: 0,
        serviceRating: 0,
        bookings: []
      });

      const savedCar = await newCar.save();

      return res.status(201).json({
        message: 'Car added successfully',
        carId: savedCar._id
      });
    } catch (error) {
      console.error("Error adding car:", error);
      next(error);
    }
  },

  // Optional: Update a car
  updateCar: async (req, res, next) => {
    try {
      console.log('Updating car');
      
      const carId = req.params.carId;
      const updates = req.body;
      
      if (!mongoose.isValidObjectId(carId)) {
        return res.status(400).json({ message: 'Invalid car ID format' });
      }

      const car = await Car.findById(carId);
      
      if (!car) {
        return res.status(404).json({ message: 'Car not found' });
      }
      
      // Update allowed fields
      const allowedUpdates = [
        'brand', 'model', 'year', 'category', 'gearBoxType', 
        'fuelType', 'engineCapacity', 'fuelConsumption', 
        'passengerCapacity', 'climateControlOption', 'pricePerDay',
        'location', 'locationId', 'images', 'status'
      ];
      
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          car[field] = updates[field];
        }
      });
      
      const updatedCar = await car.save();
      
      return res.status(200).json({
        message: 'Car updated successfully',
        car: {
          carId: updatedCar._id,
          model: `${updatedCar.brand} ${updatedCar.model} ${updatedCar.year}`,
          status: updatedCar.status
        }
      });
    } catch (error) {
      console.error("Error updating car:", error);
      next(error);
    }
  },

  // Optional: Delete a car
  deleteCar: async (req, res, next) => {
    try {
      console.log('Deleting car');
      
      const carId = req.params.carId;
      
      if (!mongoose.isValidObjectId(carId)) {
        return res.status(400).json({ message: 'Invalid car ID format' });
      }

      // Check if car exists
      const car = await Car.findById(carId);
      
      if (!car) {
        return res.status(404).json({ message: 'Car not found' });
      }
      
      // Check if car has active bookings
      const activeBookings = await Booking.find({
        carId: carId,
        bookingStatus: { $nin: ['CANCELLED', 'COMPLETED'] }
      });
      
      if (activeBookings.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete car with active bookings',
          activeBookingsCount: activeBookings.length
        });
      }
      
      // Delete the car
      await Car.findByIdAndDelete(carId);
      
      return res.status(200).json({
        message: 'Car deleted successfully'
      });
    } catch (error) {
      console.error("Error deleting car:", error);
      next(error);
    }
  }
};

module.exports = CarController;