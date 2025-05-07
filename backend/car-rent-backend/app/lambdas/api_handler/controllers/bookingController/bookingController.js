const mongoose = require('mongoose');
const Booking = require('../../models/bookingModel');
const Car = require('../../models/carModel');
const User = require('../../models/userModel');
const { createResponse } = require('../../utils/responseUtil');

exports.createBooking = async (event) => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        
        // Handle OPTIONS request for CORS preflight
        if (event.httpMethod === "OPTIONS") {
            return createResponse(200, {});
        }
        
        if (!event.body) {
            return createResponse(400, { message: 'Request body is missing' });
        }

        const body = JSON.parse(event.body);
        console.log('Parsed request body:', body);

        const { carId, clientId, pickupDateTime, dropOffDateTime, pickupLocationId, dropOffLocationId } = body;

        // Validate required fields
        if (!carId || !clientId || !pickupDateTime || !dropOffDateTime || !pickupLocationId || !dropOffLocationId) {
            return createResponse(400, { message: 'All fields are required' });
        }

        // Validate date formats
        const pickupDate = new Date(pickupDateTime);
        const dropOffDate = new Date(dropOffDateTime);
        
        if (isNaN(pickupDate.getTime()) || isNaN(dropOffDate.getTime())) {
            return createResponse(400, { message: 'Invalid date format. Use YYYY-MM-DD HH:mm format' });
        }

        // Convert carId to MongoDB ObjectId
        let mongoCarId;
        try {
            mongoCarId = new mongoose.Types.ObjectId(carId);
        } catch (error) {
            console.error('Invalid carId format:', error);
            return createResponse(400, { message: 'Invalid carId format' });
        }

        // Find car using Car model
        const car = await Car.findById(mongoCarId);
        if (!car) {
            return createResponse(404, { message: 'Car not found' });
        }

        // Check car availability based on car schema status
        if (car.status !== 'AVAILABLE') {
            return createResponse(400, { message: 'Car is not available for booking' });
        }

        // Check for overlapping bookings
        console.log('Checking for overlapping bookings');
        const overlappingBooking = await Booking.findOne({
            carId: mongoCarId,
            bookingStatus: { $nin: ['CANCELLED'] },
            $and: [
                { pickupDateTime: { $lt: dropOffDate } },
                { dropOffDateTime: { $gt: pickupDate } }
            ]
        });

        if (overlappingBooking) {
            return createResponse(400, { message: 'Car is already booked for these dates' });
        }

        // Generate order number (4 digits)
        const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();

        // Calculate total price using car schema's pricePerDay
        const days = Math.ceil((dropOffDate - pickupDate) / (1000 * 60 * 60 * 24));
        const totalPrice = days * car.pricePerDay;

        // Create new booking using booking schema
        console.log('Creating new booking');
        const newBooking = new Booking({
            carId: mongoCarId,
            clientId,
            pickupDateTime: pickupDate,
            dropOffDateTime: dropOffDate,
            pickupLocationId,
            dropOffLocationId,
            orderNumber,
            totalPrice,
            bookingStatus: 'RESERVED'
        });

        // Save booking
        console.log('Saving booking:', newBooking);
        await newBooking.save();

        // Update car status in car schema
        console.log('Updating car status');
        car.status = 'BOOKED';
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

        return createResponse(200, { 
            message,
            bookingId: newBooking._id,
            orderNumber: newBooking.orderNumber,
            totalPrice: newBooking.totalPrice
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        return createResponse(500, { 
            message: 'Error creating booking',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getAllBookings = async (event) => {
    try {
        // Handle OPTIONS request for CORS preflight
        if (event.httpMethod === "OPTIONS") {
            return createResponse(200, {});
        }
        
        // Simply fetch all bookings from the database
        const bookings = await Booking.find({})
            .populate('carId')
            .sort({ createdAt: -1 });

        // Return the array of bookings
        return createResponse(200, bookings);
    } catch (error) {
        console.error('Error getting all bookings:', error);
        return createResponse(500, { message: 'Error retrieving bookings' });
    }
};

exports.getUserBookings = async (event) => {
    try {
        // Handle OPTIONS request for CORS preflight
        if (event.httpMethod === "OPTIONS") {
            return createResponse(200, {});
        }
        
        const { userId } = event.pathParameters;

        const bookings = await Booking.find({ clientId: userId })
            .populate('carId', 'brand model year images')
            .sort({ createdAt: -1 });

        const formattedBookings = bookings.map(booking => ({
            bookingId: booking._id,
            bookingStatus: booking.bookingStatus,
            carImageUrl: booking.carId.images[0] || '',
            carModel: `${booking.carId.brand} ${booking.carId.model} ${booking.carId.year}`,
            orderDetails: `#${booking.orderNumber} (${new Date(booking.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })})`
        }));

        return createResponse(200, { content: formattedBookings });
    } catch (error) {
        console.error('Error getting user bookings:', error);
        return createResponse(500, { message: 'Error retrieving user bookings' });
    }
};