const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const { createResponse } = require('../../utils/responseUtil');
const Car = require('../../models/carModel');
const Booking = require('../../models/bookingModel');
const Feedback = require('../../models/feedbackModel');
const Location = require('../../models/locationModel');
const { connectToDatabase } = require('../../utils/database');

const CarController = {
  // GET /cars - Get all cars with filtering options
  getAllCars: async (event) => {
    try {
      console.log('Getting all cars with filters');
      await connectToDatabase();
      
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
        size = 8,
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
        imageUrl: car.images.length > 0 ? car.images[0] : null,
        location: car.location,
        pricePerDay: car.pricePerDay.toString(),
        carRating: car.carRating.toString(),
        serviceRating: car.serviceRating.toString(),
        status: car.status,
      }));

      return createResponse(200, {
        content: carsList,
        currentPage: pageNum,
        totalElements,
        totalPages,
      });
    } catch (error) {
      console.error("Error getting cars:", error);
      return createResponse(500, {
        message: "Error retrieving cars",
        error: error.message,
      });
    }
  },

  // GET /cars/{carId} - Get car by ID
  getCarById: async (event) => {
    try {
      console.log('Getting car by ID');
      await connectToDatabase();
      
      // Extract car ID from path parameters or path
      let carId;
      if (event.pathParameters && event.pathParameters.carId) {
        carId = event.pathParameters.carId;
      } else {
        // Extract from path if not available in pathParameters
        const match = event.path.match(/\/cars\/([^\/]+)$/);
        if (match) {
          carId = match[1];
        } else {
          return createResponse(400, { message: 'Car ID is required' });
        }
      }
      
      console.log(`Looking for car with ID: ${carId}`);
      
      let car;
      try {
        const carObjId = new mongoose.Types.ObjectId(carId);
        car = await Car.findOne({ _id: carObjId });
      } catch (error) {
        return createResponse(400, { message: 'Invalid car ID format' });
      }

      if (!car) {
        return createResponse(404, {
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

      return createResponse(200, carDetails);
    } catch (error) {
      console.error("Error getting car by ID:", error);
      return createResponse(500, {
        message: "Error retrieving car",
        error: error.message,
      });
    }
  },

  // GET /cars/popular - Get popular cars
  getPopularCars: async (event) => {
    try {
      console.log('Getting popular cars');
      await connectToDatabase();
      
      const queryParams = event.queryStringParameters || {};
      const { category } = queryParams;
      
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
        .sort({ carRating: -1 })
      
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

      return createResponse(200, {
        content: carsList,
      });
    } catch (error) {
      console.error("Error getting popular cars:", error);
      return createResponse(500, {
        message: "Error retrieving popular cars",
        error: error.message,
      });
    }
  },

  // GET /cars/{carId}/booked-days - Get car booked days
  getCarBookedDays: async (event) => {
    try {
      console.log('Getting car booked days');
      await connectToDatabase();
      
      // Extract car ID from path parameters or path
      let carId;
      if (event.pathParameters && event.pathParameters.carId) {
        carId = event.pathParameters.carId;
      } else {
        // Extract from path if not available in pathParameters
        const match = event.path.match(/\/cars\/([^\/]+)\/booked-days$/);
        if (match) {
          carId = match[1];
        } else {
          return createResponse(400, { message: 'Car ID is required' });
        }
      }
      
      console.log(`Looking for booked days for car ID: ${carId}`);
      
      let carObjectId;
      try {
        carObjectId = new mongoose.Types.ObjectId(carId);
      } catch (error) {
        return createResponse(400, { message: 'Invalid car ID format' });
      }

      // Find all active bookings for the car
      const bookings = await Booking.find({
        carId: carObjectId,
        bookingStatus: { $nin: ["CANCELLED"] },
      }).select("pickupDateTime dropOffDateTime");

      if (!bookings || bookings.length === 0) {
        return createResponse(200, {
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

      return createResponse(200, {
        content: Array.from(bookedDates),
      });
    } catch (error) {
      console.error("Error getting car booked days:", error);
      return createResponse(500, {
        message: "Error retrieving car booked days",
        error: error.message,
      });
    }
  },

  // GET /cars/{carId}/client-review - Get car client reviews
  getCarClientReviews: async (event) => {
    try {
      console.log('Getting car client reviews');
      await connectToDatabase();
      
      // Extract car ID from path parameters or path
      let carId;
      if (event.pathParameters && event.pathParameters.carId) {
        carId = event.pathParameters.carId;
      } else {
        // Extract from path if not available in pathParameters
        const match = event.path.match(/\/cars\/([^\/]+)\/client-review$/);
        if (match) {
          carId = match[1];
        } else {
          return createResponse(400, { message: 'Car ID is required' });
        }
      }
      
      console.log(`Looking for reviews for car ID: ${carId}`);
      
      let carObjectId;
      try {
        carObjectId = new mongoose.Types.ObjectId(carId);
      } catch (error) {
        return createResponse(400, { message: 'Invalid car ID format' });
      }
      
      const queryParams = event.queryStringParameters || {};
      const {
        page = 1,
        size = 5,
        sort = "DATE",
        direction = "DESC",
      } = queryParams;

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

      return createResponse(200, {
        content: reviewsList,
        currentPage: pageNum,
        totalElements,
        totalPages,
      });
    } catch (error) {
      console.error("Error getting car client reviews:", error);
      return createResponse(500, {
        message: "Error retrieving car client reviews",
        error: error.message,
      });
    }
  },
};

module.exports = CarController;