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

// Create Booking handler
exports.createBooking = async (event) => {
  try {
    
    // Handle OPTIONS request for CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return formatResponse(200, {});
    }
    
    if (!event.body) {
      return formatResponse(400, { message: 'Request body is missing' });
    }

    const body = JSON.parse(event.body);
    console.log('Parsed request body:', body);

    const { carId, clientId, pickupDateTime, dropOffDateTime, pickupLocationId, dropOffLocationId } = body;

    // Validate required fields
    if (!carId || !clientId || !pickupDateTime || !dropOffDateTime || !pickupLocationId || !dropOffLocationId) {
      return formatResponse(400, { message: 'All fields are required' });
    }

    // Validate date formats
    const pickupDate = new Date(pickupDateTime);
    const dropOffDate = new Date(dropOffDateTime);
    
    if (isNaN(pickupDate.getTime()) || isNaN(dropOffDate.getTime())) {
      return formatResponse(400, { message: 'Invalid date format. Use YYYY-MM-DD HH:mm format' });
    }

    // Find car using Car model - using MongoDB _id or string carId based on input
    const Car = mongoose.model('Car');
    let car;
    
    // Check if carId is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.isValidObjectId(carId);
    
    if (isValidObjectId) {
      car = await Car.findById(carId);
    } else {
      // If not a valid ObjectId, search by string carId field
      car = await Car.findOne({ carId: carId });
    }
    
    if (!car) {
      return formatResponse(404, { message: 'Car not found' });
    }

    // Check car availability based on car schema status
    if (car.status !== 'AVAILABLE') {
      return formatResponse(400, { message: 'Car is not available for booking' });
    }

    // Check for overlapping bookings
    const Booking = mongoose.model('Booking');
    const overlappingBooking = await Booking.findOne({
      carId: car._id,
      bookingStatus: { $nin: ['CANCELLED'] },
      $and: [
        { pickupDateTime: { $lt: dropOffDate } },
        { dropOffDateTime: { $gt: pickupDate } }
      ]
    });

    if (overlappingBooking) {
      return formatResponse(400, { message: 'Car is already booked for these dates' });
    }

    // Get location names
    const pickupLocation = car.location; // Use car's location for pickup
    
    // For drop-off location, we might need to look it up if it's different from pickup
    let dropOffLocation = pickupLocation;
    if (pickupLocationId !== dropOffLocationId) {
      // If we have a locations collection, we could look up the location name
      // For now, we'll use the same as pickup
      dropOffLocation = pickupLocation;
    }

    // Generate order number (4 digits)
    const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();

    // Calculate total price using car schema's pricePerDay
    const days = Math.ceil((dropOffDate - pickupDate) / (1000 * 60 * 60 * 24));
    const totalPrice = days * car.pricePerDay;

    // Create new booking using booking schema
    const newBooking = new Booking({
      carId: car._id,
      carStringId: car.carId,
      clientId,
      pickupDateTime: pickupDate,
      dropOffDateTime: dropOffDate,
      pickupLocationId,
      pickupLocation,
      dropOffLocationId,
      dropOffLocation,
      orderNumber,
      totalPrice,
      bookingStatus: 'RESERVED',
      madeBy: 'CLIENT'
    });

    // Save booking
    const savedBooking = await newBooking.save();

    // Update car status in car schema
    car.status = 'BOOKED';
    car.bookings = car.bookings || [];
    car.bookings.push(savedBooking._id);
    await car.save();

    // Format response message using car schema fields
    const formattedPickupDate = pickupDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const formattedDropOffDate = dropOffDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });

    const message = `New booking was successfully created. \n${car.brand} ${car.model} ${car.year} is booked for ${formattedPickupDate} - ${formattedDropOffDate} \nYou can change booking details until 10:30 PM ${formattedPickupDate}.\nYour order: #${orderNumber} (${formattedDate})`;

    return formatResponse(200, { 
      message,
      bookingId: savedBooking._id,
      orderNumber: savedBooking.orderNumber,
      totalPrice: savedBooking.totalPrice
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return formatResponse(500, { 
      message: 'Error creating booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get All Bookings handler
exports.getAllBookings = async (event) => {
  try {
    
    // Handle OPTIONS request for CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return formatResponse(200, {});
    }
    
    // Get the Booking model
    const Booking = mongoose.model('Booking');
    
    // Fetch all bookings from the database
    const bookings = await Booking.find({})
      .populate('carId', 'brand model year images carNumber carId')
      .sort({ createdAt: -1 });

    // Format the response
    const formattedBookings = bookings.map(booking => {
      const car = booking.carId;
      return {
        bookingId: booking._id,
        orderNumber: booking.orderNumber,
        clientId: booking.clientId,
        carDetails: car ? `${car.brand} ${car.model} ${car.year}` : 'N/A',
        carImage: car && car.images && car.images.length > 0 ? car.images[0] : null,
        carNumber: car ? car.carNumber : 'N/A',
        carId: car ? car.carId : 'N/A',
        pickupDateTime: booking.pickupDateTime,
        dropOffDateTime: booking.dropOffDateTime,
        pickupLocation: booking.pickupLocation,
        dropOffLocation: booking.dropOffLocation,
        status: booking.bookingStatus,
        totalPrice: booking.totalPrice,
        createdAt: booking.createdAt
      };
    });

    return formatResponse(200, { bookings: formattedBookings });
  } catch (error) {
    console.error('Error getting all bookings:', error);
    return formatResponse(500, { message: 'Error retrieving bookings' });
  }
};

// Get User Bookings handler
exports.getUserBookings = async (event) => {
  try {
    
    // Handle OPTIONS request for CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return formatResponse(200, {});
    }
    
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return formatResponse(400, { message: 'User ID is required' });
    }

    // Get the Booking model
    const Booking = mongoose.model('Booking');
    
    // Fetch user bookings
    const bookings = await Booking.find({ clientId: userId })
      .populate('carId', 'brand model year images carId')
      .sort({ createdAt: -1 });

    // Format the response
    const formattedBookings = bookings.map(booking => {
      const car = booking.carId;
      return {
        bookingId: booking._id,
        bookingStatus: booking.bookingStatus,
        carImageUrl: car && car.images && car.images.length > 0 ? car.images[0] : '',
        carModel: car ? `${car.brand} ${car.model} ${car.year}` : 'N/A',
        carId: car ? car.carId : 'N/A',
        orderDetails: `#${booking.orderNumber} (${new Date(booking.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })})`,
        pickupDateTime: booking.pickupDateTime,
        dropOffDateTime: booking.dropOffDateTime,
        pickupLocation: booking.pickupLocation,
        dropOffLocation: booking.dropOffLocation,
        totalPrice: booking.totalPrice
      };
    });

    return formatResponse(200, { content: formattedBookings });
  } catch (error) {
    console.error('Error getting user bookings:', error);
    return formatResponse(500, { message: 'Error retrieving user bookings' });
  }
};
