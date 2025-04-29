const { connectToDatabase } = require('./utils/database');
const { createResponse } = require('./utils/responseUtil');
const CarController = require('./carController');
// Import other controllers as needed (UserController, BookingController, etc.)

// Initialize database connection
let dbConnection;

// Helper function for CORS preflight requests
const handleCors = () => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({})
  };
};

// Main handler function
exports.handler = async (event, context) => {
  // Optimize database connection for Lambda
  context.callbackWaitsForEmptyEventLoop = false;
  
  console.log('Event:', JSON.stringify(event));
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }
  
  try {
    // Connect to MongoDB if not already connected
    if (!dbConnection) {
      dbConnection = await connectToDatabase();
    }
    
    const path = event.path;
    const method = event.httpMethod;
    
    // Car routes
    if (path === '/cars' && method === 'GET') {
      return await CarController.getAllCars(event);
    }
    
    if (path.match(/^\/cars\/[^/]+$/) && method === 'GET') {
      return await CarController.getCarById(event);
    }
    
    if (path === '/cars/popular' && method === 'GET') {
      return await CarController.getPopularCars(event);
    }
    
    if (path.match(/^\/cars\/[^/]+\/booked-days$/) && method === 'GET') {
      return await CarController.getCarBookedDays(event);
    }
    
    if (path.match(/^\/cars\/[^/]+\/client-review$/) && method === 'GET') {
      return await CarController.getCarClientReviews(event);
    }
    
    // Admin car routes (these should be protected by authorization)
    if (path === '/admin/cars' && method === 'POST') {
      // Here you would add authorization check
      return await CarController.createCar(event);
    }
    
    if (path.match(/^\/admin\/cars\/[^/]+$/) && method === 'PUT') {
      // Here you would add authorization check
      return await CarController.updateCar(event);
    }
    
    if (path.match(/^\/admin\/cars\/[^/]+$/) && method === 'DELETE') {
      // Here you would add authorization check
      return await CarController.deleteCar(event);
    }
    
    // Add other routes here (user routes, booking routes, etc.)
    
    // If no route matches
    return createResponse(404, {
      message: 'Route not found'
    });
  } catch (error) {
    console.error('Error:', error);
    return createResponse(500, {
      message: 'Internal server error',
      error: error.message
    });
  }
};