const mongoose = require('mongoose');

// Create Feedback handler - Express version
exports.createFeedback = async (req, res, next) => {
  try {
    // Extract required fields from request body
    const { 
      carId, 
      clientId, 
      bookingId, 
      author, 
      carRating, 
      serviceRating, 
      feedbackText,
      authorImageUrl 
    } = req.body;

    // Validate required fields
    if (!carId || !clientId || !bookingId || !author || !carRating || !serviceRating || !feedbackText) {
      return res.status(400).json({ 
        message: 'Missing required fields. Please provide carId, clientId, bookingId, author, carRating, serviceRating, and feedbackText' 
      });
    }

    // Validate ratings
    if (carRating < 1 || carRating > 5 || serviceRating < 1 || serviceRating > 5) {
      return res.status(400).json({ message: 'Ratings must be between 1 and 5' });
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
      return res.status(404).json({ message: 'Car not found' });
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
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is completed
    if (booking.bookingStatus !== 'COMPLETED') {
      return res.status(400).json({ message: 'Feedback can only be submitted for completed bookings' });
    }

    // Check if feedback already exists for this booking
    const Feedback = mongoose.model('Feedback');
    const existingFeedback = await Feedback.findOne({ bookingId: booking._id });
    
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already exists for this booking' });
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

    return res.status(201).json({
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
    next(error);
  }
};

// Get All Feedback handler - Express version
exports.getAllFeedback = async (req, res, next) => {
  try {
    // Parse query parameters
    const { 
      carId, 
      clientId, 
      minRating = 0,
      limit = 10, 
      page = 1 
    } = req.query;
    
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
          return res.status(404).json({ message: 'Car not found' });
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
        carId: car ? car._id : null,
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

    return res.status(200).json({ 
      feedback: formattedFeedback,
      pagination
    });
  } catch (error) {
    console.error('Error getting feedback:', error);
    next(error);
  }
};

// Get Recent Feedback handler - Express version
exports.getRecentFeedback = async (req, res, next) => {
  try {
    // Parse query parameters
    const { limit = 5 } = req.query;
    
    // Get the Feedback model
    const Feedback = mongoose.model('Feedback');
    
    // Fetch recent feedback
    const recentFeedback = await Feedback.find()
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('carId', '_id brand model year images')
      .populate('bookingId', 'orderNumber');
      
    // Format the response
    const formattedFeedback = recentFeedback.map(item => {
      const car = item.carId;
      return {
        id: item._id,
        author: item.author,
        authorImageUrl: item.authorImageUrl || '',
        carId: car ? car._id : null,
        carDetails: car ? `${car.brand} ${car.model} ${car.year}` : 'N/A',
        carImage: car && car.images && car.images.length > 0 ? car.images[0] : null,
        carRating: item.carRating,
        serviceRating: item.serviceRating,
        feedbackText: item.feedbackText,
        date: item.date,
        orderNumber: item.bookingId ? item.bookingId.orderNumber : 'N/A'
      };
    });

    return res.status(200).json({ 
      content: formattedFeedback
    });
  } catch (error) {
    console.error('Error getting recent feedback:', error);
    next(error);
  }
};

// Optional: Update feedback
exports.updateFeedback = async (req, res, next) => {
  try {
    const feedbackId = req.params.feedbackId;
    const { carRating, serviceRating, feedbackText } = req.body;
    
    if (!mongoose.isValidObjectId(feedbackId)) {
      return res.status(400).json({ message: 'Invalid feedback ID' });
    }
    
    // Get the Feedback model
    const Feedback = mongoose.model('Feedback');
    
    // Find the feedback
    const feedback = await Feedback.findById(feedbackId);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    // Check if user is authorized to update this feedback
    // This would typically be done by comparing the clientId with the authenticated user
    // For now, we'll just allow the update
    
    // Update fields if provided
    if (carRating !== undefined) {
      if (carRating < 1 || carRating > 5) {
        return res.status(400).json({ message: 'Car rating must be between 1 and 5' });
      }
      feedback.carRating = carRating;
    }
    
    if (serviceRating !== undefined) {
      if (serviceRating < 1 || serviceRating > 5) {
        return res.status(400).json({ message: 'Service rating must be between 1 and 5' });
      }
      feedback.serviceRating = serviceRating;
    }
    
    if (feedbackText !== undefined) {
      feedback.feedbackText = feedbackText;
    }
    
    // Save the updated feedback
    const updatedFeedback = await feedback.save();
    
    // Update car average rating if car rating changed
    if (carRating !== undefined) {
      const Car = mongoose.model('Car');
      const car = await Car.findById(feedback.carId);
      
      if (car) {
        const allCarFeedback = await Feedback.find({ carId: car._id });
        const totalCarRatings = allCarFeedback.reduce((sum, fb) => sum + fb.carRating, 0);
        const averageCarRating = totalCarRatings / allCarFeedback.length;
        
        car.rating = averageCarRating.toFixed(1);
        await car.save();
      }
    }
    
    return res.status(200).json({
      message: 'Feedback updated successfully',
      feedback: {
        id: updatedFeedback._id,
        carRating: updatedFeedback.carRating,
        serviceRating: updatedFeedback.serviceRating,
        feedbackText: updatedFeedback.feedbackText,
        date: updatedFeedback.date
      }
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    next(error);
  }
};

// Optional: Delete feedback
exports.deleteFeedback = async (req, res, next) => {
  try {
    const feedbackId = req.params.feedbackId;
    
    if (!mongoose.isValidObjectId(feedbackId)) {
      return res.status(400).json({ message: 'Invalid feedback ID' });
    }
    
    // Get the Feedback model
    const Feedback = mongoose.model('Feedback');
    
    // Find the feedback
    const feedback = await Feedback.findById(feedbackId);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    // Store car ID before deleting feedback
    const carId = feedback.carId;
    
    // Delete the feedback
    await Feedback.findByIdAndDelete(feedbackId);
    
    // Update car average rating
    const Car = mongoose.model('Car');
    const car = await Car.findById(carId);
    
    if (car) {
      const allCarFeedback = await Feedback.find({ carId: car._id });
      
      if (allCarFeedback.length > 0) {
        const totalCarRatings = allCarFeedback.reduce((sum, fb) => sum + fb.carRating, 0);
        const averageCarRating = totalCarRatings / allCarFeedback.length;
        car.rating = averageCarRating.toFixed(1);
      } else {
        car.rating = 0; // No feedback left, reset rating
      }
      
      await car.save();
    }
    
    return res.status(200).json({
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    next(error);
  }
};

/**
 * Get Recent Feedbacks
 * @route GET /feedbacks/recent
 * @description US-4: Main page view (returns recent feedbacks from users)
 */
exports.getRecentFeedbacks = async (req, res, next) => {
  try {
    console.log('Getting recent feedbacks');
    
    // Parse query parameters
    const { limit = 5 } = req.query;
    
    // Get the Feedback model
    const Feedback = mongoose.model('Feedback');
    
    // Fetch recent feedback
    const recentFeedback = await Feedback.find({ isActive: true })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('carId', '_id brand model year images')
      .populate('clientId', 'firstName lastName imageUrl');
      
    // Format the response according to API spec
    const formattedFeedback = recentFeedback.map(item => {
      const car = item.carId;
      const client = item.clientId;
      
      return {
        id: item._id.toString(),
        author: client ? `${client.firstName} ${client.lastName}` : item.author,
        authorImageUrl: client?.imageUrl || item.authorImageUrl || '',
        carId: car ? car._id.toString() : null,
        carDetails: car ? `${car.brand} ${car.model} ${car.year}` : 'N/A',
        carImageUrl: car && car.images && car.images.length > 0 ? 
          (typeof car.images[0] === 'string' ? car.images[0] : car.images[0].url) : 
          null,
        carRating: item.carRating,
        serviceRating: item.serviceRating,
        feedbackText: item.feedbackText,
        date: item.date.toISOString().split('T')[0]
      };
    });

    console.log(`Returning ${formattedFeedback.length} recent feedbacks`);
    
    return res.status(200).json({ 
      content: formattedFeedback
    });
  } catch (error) {
    console.error('Error getting recent feedbacks:', error);
    next(error);
  }
};