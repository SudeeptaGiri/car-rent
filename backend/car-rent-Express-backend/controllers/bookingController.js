const mongoose = require('mongoose');

// Create Booking handler - Express version
exports.createBooking = async (req, res, next) => {
  try {
    const { carId, clientId, pickupDateTime, dropOffDateTime, pickupLocationId, dropOffLocationId } = req.body;

    // Validate required fields
    if (!carId || !clientId || !pickupDateTime || !dropOffDateTime || !pickupLocationId || !dropOffLocationId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate date formats
    const pickupDate = new Date(pickupDateTime);
    const dropOffDate = new Date(dropOffDateTime);
    
    if (isNaN(pickupDate.getTime()) || isNaN(dropOffDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD HH:mm format' });
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
      return res.status(404).json({ message: 'Car not found' });
    }

    // Check car availability based on car schema status
    if (car.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Car is not available for booking' });
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
      return res.status(400).json({ message: 'Car is already booked for these dates' });
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

    return res.status(200).json({ 
      message,
      bookingId: savedBooking._id,
      orderNumber: savedBooking.orderNumber,
      totalPrice: savedBooking.totalPrice
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    next(error);
  }
};

// Get All Bookings handler - Express version
exports.getAllBookings = async (req, res, next) => {
  try {
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
        carId: car ? car._id : 'N/A',
        pickupDateTime: booking.pickupDateTime,
        dropOffDateTime: booking.dropOffDateTime,
        pickupLocation: booking.pickupLocation,
        dropOffLocation: booking.dropOffLocation,
        status: booking.bookingStatus,
        totalPrice: booking.totalPrice,
        createdAt: booking.createdAt
      };
    });

    return res.status(200).json({ bookings: formattedBookings });
  } catch (error) {
    console.error('Error getting all bookings:', error);
    next(error);
  }
};

// Get User Bookings handler - Express version
exports.getUserBookings = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
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
        carId: car ? car._id : 'N/A',
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

    return res.status(200).json({ content: formattedBookings });
  } catch (error) {
    console.error('Error getting user bookings:', error);
    next(error);
  }
};

// Optional: Add update booking functionality
exports.updateBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;
    const updates = req.body;
    
    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }
    
    const Booking = mongoose.model('Booking');
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if booking can be updated (e.g., not already started)
    const now = new Date();
    if (new Date(booking.pickupDateTime) < now) {
      return res.status(400).json({ message: 'Cannot update a booking that has already started' });
    }
    
    // Update allowed fields
    const allowedUpdates = ['pickupDateTime', 'dropOffDateTime', 'pickupLocationId', 'dropOffLocationId', 'bookingStatus'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        booking[key] = updates[key];
      }
    });
    
    // If dates are updated, recalculate price
    if (updates.pickupDateTime || updates.dropOffDateTime) {
      const pickupDate = new Date(updates.pickupDateTime || booking.pickupDateTime);
      const dropOffDate = new Date(updates.dropOffDateTime || booking.dropOffDateTime);
      
      const Car = mongoose.model('Car');
      const car = await Car.findById(booking.carId);
      
      if (car) {
        const days = Math.ceil((dropOffDate - pickupDate) / (1000 * 60 * 60 * 24));
        booking.totalPrice = days * car.pricePerDay;
      }
    }
    
    const updatedBooking = await booking.save();
    
    return res.status(200).json({
      message: 'Booking updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    next(error);
  }
};

// Optional: Add cancel booking functionality
exports.cancelBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;
    
    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }
    
    const Booking = mongoose.model('Booking');
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if booking can be cancelled (e.g., not already started)
    const now = new Date();
    if (new Date(booking.pickupDateTime) < now) {
      return res.status(400).json({ message: 'Cannot cancel a booking that has already started' });
    }
    
    // Update booking status
    booking.bookingStatus = 'CANCELLED';
    await booking.save();
    
    // Update car status
    const Car = mongoose.model('Car');
    const car = await Car.findById(booking.carId);
    
    if (car) {
      car.status = 'AVAILABLE';
      // Remove this booking from car.bookings array
      car.bookings = car.bookings.filter(id => !id.equals(booking._id));
      await car.save();
    }
    
    return res.status(200).json({
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    next(error);
  }
};