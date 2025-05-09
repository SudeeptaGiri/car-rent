// feedbackController.js
const mongoose = require('mongoose');

// Helper function for formatting responses
function formatResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
}

// Create Feedback handler
exports.createFeedback = async (event) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return formatResponse(200, {});
    }
    
    if (!event.body) {
      return formatResponse(400, { message: 'Request body is missing' });
    }

    // Parse request body
    const body = JSON.parse(event.body);
    console.log('Parsed feedback request body:', body);

    // Extract required fields
    const { 
      carId, 
      clientId, 
      bookingId, 
      author, 
      carRating, 
      serviceRating, 
      feedbackText,
      authorImageUrl 
    } = body;

    // Validate required fields
    if (!carId || !clientId || !bookingId || !author || !carRating || !serviceRating || !feedbackText) {
      return formatResponse(400, { 
        message: 'Missing required fields. Please provide carId, clientId, bookingId, author, carRating, serviceRating, and feedbackText' 
      });
    }

    // Validate ratings
    if (carRating < 1 || carRating > 5 || serviceRating < 1 || serviceRating > 5) {
      return formatResponse(400, { message: 'Ratings must be between 1 and 5' });
    }

    // Check if car exists
    const Car = mongoose.model('Car');
    let car;
    
    // Check if carId is a valid MongoDB ObjectId
    const isValidCarId = mongoose.isValidObjectId(carId);
    
    if (isValidCarId) {
      car = await Car.findById(carId);
    } else {
      // If not a valid ObjectId, search by string carId field
      car = await Car.findOne({ carId: carId });
    }
    
    if (!car) {
      return formatResponse(404, { message: 'Car not found' });
    }

    // Check if booking exists
    const Booking = mongoose.model('Booking');
    const isValidBookingId = mongoose.isValidObjectId(bookingId);
    
    let booking;
    if (isValidBookingId) {
      booking = await Booking.findById(bookingId);
    } else {
      booking = await Booking.findOne({ orderNumber: bookingId });
    }
    
    if (!booking) {
      return formatResponse(404, { message: 'Booking not found' });
    }

    // Check if booking is completed
    if (booking.bookingStatus !== 'COMPLETED') {
      return formatResponse(400, { message: 'Feedback can only be submitted for completed bookings' });
    }

    // Check if feedback already exists for this booking
    const Feedback = mongoose.model('Feedback');
    const existingFeedback = await Feedback.findOne({ bookingId: booking._id });
    
    if (existingFeedback) {
      return formatResponse(400, { message: 'Feedback already exists for this booking' });
    }

    // Create new feedback
    const newFeedback = new Feedback({
      carId: car._id,
      clientId,
      bookingId: booking._id,
      author,
      authorImageUrl: authorImageUrl || '',
      carRating,
      serviceRating,
      feedbackText,
      date: new Date()
    });

    // Save feedback to database
    const savedFeedback = await newFeedback.save();

    // Update car average rating
    const allCarFeedback = await Feedback.find({ carId: car._id });
    const totalCarRatings = allCarFeedback.reduce((sum, feedback) => sum + feedback.carRating, 0);
    const averageCarRating = totalCarRatings / allCarFeedback.length;
    
    car.rating = averageCarRating.toFixed(1);
    await car.save();

    return formatResponse(201, {
      message: 'Feedback submitted successfully',
      feedback: {
        id: savedFeedback._id,
        carRating: savedFeedback.carRating,
        serviceRating: savedFeedback.serviceRating,
        feedbackText: savedFeedback.feedbackText,
        date: savedFeedback.date
      }
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return formatResponse(500, { 
      message: 'Error submitting feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get All Feedback handler
exports.getAllFeedback = async (event) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return formatResponse(200, {});
    }
    
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const { 
      carId, 
      clientId, 
      minRating = 0,
      limit = 10, 
      page = 1 
    } = queryParams;
    
    // Build query
    const query = {};
    
    if (carId) {
      // Check if carId is a valid MongoDB ObjectId
      const isValidCarId = mongoose.isValidObjectId(carId);
      
      if (isValidCarId) {
        query.carId = carId;
      } else {
        // If not a valid ObjectId, find the car by carId string first
        const Car = mongoose.model('Car');
        const car = await Car.findOne({ carId: carId });
        
        if (!car) {
          return formatResponse(404, { message: 'Car not found' });
        }
        
        query.carId = car._id;
      }
    }
    
    if (clientId) {
      query.clientId = clientId;
    }
    
    if (minRating && !isNaN(minRating)) {
      query.carRating = { $gte: Number(minRating) };
    }
    
    // Set up pagination
    const pageSize = parseInt(limit);
    const skip = (parseInt(page) - 1) * pageSize;
    
    // Get the Feedback model
    const Feedback = mongoose.model('Feedback');
    
    // Fetch feedback with pagination
    const feedback = await Feedback.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('carId', 'brand model year images')
      .populate('bookingId', 'orderNumber');
      
    // Get total count for pagination
    const totalCount = await Feedback.countDocuments(query);
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Format the response
    const formattedFeedback = feedback.map(item => {
      const car = item.carId;
      return {
        id: item._id,
        author: item.author,
        authorImageUrl: item.authorImageUrl || '',
        carDetails: car ? `${car.brand} ${car.model} ${car.year}` : 'N/A',
        carImage: car && car.images && car.images.length > 0 ? car.images[0] : null,
        carRating: item.carRating,
        serviceRating: item.serviceRating,
        feedbackText: item.feedbackText,
        date: item.date,
        orderNumber: item.bookingId ? item.bookingId.orderNumber : 'N/A'
      };
    });
    
    // Build pagination info
    const pagination = {
      totalItems: totalCount,
      totalPages,
      currentPage: parseInt(page),
      pageSize: pageSize,
      hasNext: parseInt(page) < totalPages,
      hasPrevious: parseInt(page) > 1
    };

    return formatResponse(200, { 
      feedback: formattedFeedback,
      pagination
    });
  } catch (error) {
    console.error('Error getting feedback:', error);
    return formatResponse(500, { message: 'Error retrieving feedback' });
  }
};

// Get Recent Feedback handler
exports.getRecentFeedback = async (event) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return formatResponse(200, {});
    }
    
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const { limit = 5 } = queryParams;
    
    // Get the Feedback model
    const Feedback = mongoose.model('Feedback');
    
    // Fetch recent feedback
    const recentFeedback = await Feedback.find()
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('carId', 'brand model year images')
      .populate('bookingId', 'orderNumber');
      
    // Format the response
    const formattedFeedback = recentFeedback.map(item => {
      const car = item.carId;
      return {
        id: item._id,
        author: item.author,
        authorImageUrl: item.authorImageUrl || '',
        carDetails: car ? `${car.brand} ${car.model} ${car.year}` : 'N/A',
        carImage: car && car.images && car.images.length > 0 ? car.images[0] : null,
        carRating: item.carRating,
        serviceRating: item.serviceRating,
        feedbackText: item.feedbackText,
        date: item.date,
        orderNumber: item.bookingId ? item.bookingId.orderNumber : 'N/A'
      };
    });

    return formatResponse(200, { 
      content: formattedFeedback
    });
  } catch (error) {
    console.error('Error getting recent feedback:', error);
    return formatResponse(500, { message: 'Error retrieving recent feedback' });
  }
};

// Get Car Feedback handler
// exports.getCarFeedback = async (event) => {
//   try {
//     // Handle OPTIONS request for CORS preflight
//     if (event.httpMethod === "OPTIONS") {
//       return formatResponse(200, {});
//     }
    
//     const carId = event.pathParameters?.carId;
//     if (!carId) {
//       return formatResponse(400, { message: 'Car ID is required' });
//     }
    
//     // Get the Car model and Feedback model
//     const Car = mongoose.model('Car');
//     const Feedback = mongoose.model('Feedback');
    
//     // Find the car
//     let car;
//     const isValidObjectId = mongoose.isValidObjectId(carId);
    
//     if (isValidObjectId) {
//       car = await Car.findById(carId);
//     } else {
//       car = await Car.findOne({ carId: carId });
//     }
    
//     if (!car) {
//       return formatResponse(404, { message: 'Car not found' });
//     }
    
//     // Fetch feedback for this car
//     const feedback = await Feedback.find({ carId: car._id })
//       .sort({ date: -1 })
//       .populate('bookingId', 'orderNumber');
      
//     // Calculate average ratings
//     const totalCarRatings = feedback.reduce((sum, item) => sum + item.carRating, 0);
//     const totalServiceRatings = feedback.reduce((sum, item) => sum + item.serviceRating, 0);
//     const avgCarRating = feedback.length > 0 ? (totalCarRatings / feedback.length).toFixed(1) : 0;
//     const avgServiceRating = feedback.length > 0 ? (totalServiceRatings / feedback.length).toFixed(1) : 0;
    
//     // Format the response
//     const formattedFeedback = feedback.map(item => {
//       return {
//         id: item._id,
//         author: item.author,
//         authorImageUrl: item.authorImageUrl || '',
//         carRating: item.carRating,
//         serviceRating: item.serviceRating,
//         feedbackText: item.feedbackText,
//         date: item.date,
//         orderNumber: item.bookingId ? item.bookingId.orderNumber : 'N/A'
//       };
//     });

//     return formatResponse(200, { 
//       carDetails: {
//         brand: car.brand,
//         model: car.model,
//         year: car.year,
//         avgCarRating,
//         avgServiceRating,
//         totalReviews: feedback.length
//       },
//       feedback: formattedFeedback
//     });
//   } catch (error) {
//     console.error('Error getting car feedback:', error);
//     return formatResponse(500, { message: 'Error retrieving car feedback' });
//   }
// };