const authController = require("./controllers/authcontroller/authcontroller");
const userController = require("./controllers/usercontroller/usercontroller");
const { connectToDatabase } = require('./utils/database');
const { createResponse } = require('./utils/responseUtil');
const CarController = require("./controllers/carController/index");
const bookingController = require("./controllers/bookingController/bookingController");
const feedbackController = require("./controllers/feedbacksController/feedbacksController"); 
const homepageController = require('./controllers/homepageController/homepageController');
const reportController = require('./controllers/reportController/reportController')
// Add this at the top of your index.js
console.log('Loading function');
console.log('Current working directory:', process.cwd());
console.log('Directory contents:', require('fs').readdirSync('.'));

// Initialize database connection
let dbConnection;
const handleCors = () => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({}),
  };
};

exports.handler = async (event, context) => {
  // Keep connection alive between function calls

  console.log('=== Handler Started ===');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));
  
  console.log('FULL EVENT:', JSON.stringify(event, null, 2));
  
  const extractedPath = event.rawPath || event.path || event.resource || "/";
  console.log('EXTRACTED PATH:', extractedPath);
  console.log('EVENT.PATH:', event.path);
  console.log('EVENT.RAWPATH:', event.rawPath);
  console.log('EVENT.RESOURCE:', event.resource);
  
  context.callbackWaitsForEmptyEventLoop = false;
  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    return handleCors();
  }
  if (!dbConnection) {
    dbConnection = await connectToDatabase();
  }

  // Get the path and method from the event
  // Modify this line in your handler function
const path = event.rawPath || event.path || event.resource || "/";
  const method =
    event.requestContext?.http?.method || event.httpMethod || "UNKNOWN";

  console.log(`Request received: ${method} ${path}`);

  // Common headers for all responses
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
  };

  try {
    // Route to the appropriate controller based on path
    if (path === "/auth/sign-up" && method === "POST") {
      // Handle sign-up request
      return await authController.signUp(event);
    }

    if (path === "/auth/sign-in" && method === "POST") {
      // Handle sign-in request
      return await authController.signIn(event);
    }

    if (path === "/users" && method === "GET") {
      return await userController.getPersonalInfo(event);
    }
    if (path.match(/\/users\/[^\/]+\/personal-info$/) && method === "GET") {
      // Extract ID from path if pathParameters is not available
      if (!event.pathParameters) {
        const match = path.match(/\/users\/([^\/]+)\/personal-info/);
        if (match) {
          event.pathParameters = { id: match[1] };
        }
      }
      return await userController.getPersonalInfo(event);
    }

    // PUT /users/{id}/personal-info
    if (path.match(/\/users\/[^\/]+\/personal-info$/) && method === "PUT") {
      // Extract ID from path if pathParameters is not available
      if (!event.pathParameters) {
        const match = path.match(/\/users\/([^\/]+)\/personal-info/);
        if (match) {
          event.pathParameters = { id: match[1] };
        }
      }
      return await userController.updatePersonalInfo(event);
    }

    // PUT /users/{id}/change-password
    if (path.match(/\/users\/[^\/]+\/change-password$/) && method === "PUT") {
      // Extract ID from path if pathParameters is not available
      if (!event.pathParameters) {
        const match = path.match(/\/users\/([^\/]+)\/change-password/);
        if (match) {
          event.pathParameters = { id: match[1] };
        }
      }
      return await userController.changePassword(event);
    }

    // GET /users/clients
    if (path === "/users/clients" && method === "GET") {
      return await userController.getClients(event);
    }

    // GET /users/agents
    if (path === "/users/agents" && method === "GET") {
      return await userController.getAgents(event);
    }

    // Car routes
    if (path === "/cars" && method === "GET") {
      return await CarController.getAllCars(event);
    }

    if (path === "/cars/popular" && method === "GET") {
      return await CarController.getPopularCars(event);
    }

    if (path.match(/^\/cars\/[^/]+\/booked-days$/) && method === "GET") {
      // Extract carId from path if pathParameters is not available
      if (!event.pathParameters) {
        const match = path.match(/\/cars\/([^\/]+)\/booked-days$/);
        if (match) {
          event.pathParameters = { carId: match[1] };
        }
      }
      return await CarController.getCarBookedDays(event);
    }

    if (path.match(/^\/cars\/[^/]+\/client-review$/) && method === "GET") {
      // Extract carId from path if pathParameters is not available
      if (!event.pathParameters) {
        const match = path.match(/\/cars\/([^\/]+)\/client-review$/);
        if (match) {
          event.pathParameters = { carId: match[1] };
        }
      }
      return await CarController.getCarClientReviews(event);
    }

     // Route the request to the appropriate handler
     if (path === '/bookings' && method === 'POST') {
      return await bookingController.createBooking(event);
    } 
    if (path === '/bookings' && method === 'GET') {
      return await bookingController.getAllBookings(event);
    } 
    if (path.match(/^\/bookings\/[^/]+$/) && method === 'GET') {
      // Extract userId from path
      const userId = path.split('/')[2];
      event.pathParameters = { userId };
      return await bookingController.getUserBookings(event);
    } 
    
    if (path.match(/^\/users\/[^\/]+\/documents$/i) && method === 'GET') {
      return await documentController.getUserDocuments(event);
    }
    
    if (path.match(/^\/users\/[^\/]+\/documents$/i) && method === 'POST') {
      return await documentController.uploadDocuments(event);
    }
    
    if (path.match(/^\/users\/[^\/]+\/documents\/[^\/]+\/[^\/]+$/i) && method === 'DELETE') {
      return await documentController.deleteDocument(event);
    }
    

    // This route must come after the specific /cars/... routes
    if (path.match(/^\/cars\/[^/]+$/) && method === "GET") {
      // Extract carId from path if pathParameters is not available
      if (!event.pathParameters) {
        const match = path.match(/\/cars\/([^\/]+)$/);
        if (match) {
          event.pathParameters = { carId: match[1] };
        }
      }
      return await CarController.getCarById(event);
    }


     // Feedback routes - Add these new routes
     if (path === "/feedbacks" && method === "POST") {
      return await feedbackController.createFeedback(event);
    }
    
    if (path === "/feedbacks" && method === "GET") {
      return await feedbackController.getAllFeedback(event);
    }
    
    if (path === "/feedbacks/recent" && method === "GET") {
      return await feedbackController.getRecentFeedback(event);
    }
    

    // Homepage routes - Adding logging to debug the issue
    console.log(`Checking if path '${path}' matches homepage routes`);
    
    if (path === "/home/about-us" && method === "GET") {
      console.log("Matched /home/about-us route, calling homepageController.getAboutUs");
      try {
        return await homepageController.getAboutUs(event);
      } catch (error) {
        console.error("Error in getAboutUs:", error);
        throw error;
      }
    }
    
    if (path === "/home/faq" && method === "GET") {
      console.log("Matched /home/faq route, calling homepageController.getFAQ");
      try {
        return await homepageController.getFAQ(event);
      } catch (error) {
        console.error("Error in getFAQ:", error);
        throw error;
      }
    }
    
    if (path === "/home/locations" && method === "GET") {
      console.log("Matched /home/locations route, calling homepageController.getLocations");
      try {
        return await homepageController.getLocations(event);
      } catch (error) {
        console.error("Error in getLocations:", error);
        throw error;
      }
    }
    // Reports routes
    if (path === "/reports" && method === "GET") {
      console.log("Matched /reports route, calling reportController.getReports");
      try {
        return await reportController.getReports(event);
      } catch (error) {
        console.error("Error in getReports:", error);
        throw error;
      }
    }

    if (path === "/reports/sales" && method === "GET") {
      console.log("Matched /reports/sales GET route, calling reportController.getSalesReports");
      try {
        return await reportController.getSalesReports(event);
      } catch (error) {
        console.error("Error in getSalesReports:", error);
        throw error;
      }
    }

    if (path === "/reports/performance" && method === "GET") {
      console.log("Matched /reports/performance GET route, calling reportController.getPerformanceReports");
      try {
        return await reportController.getPerformanceReports(event);
      } catch (error) {
        console.error("Error in getPerformanceReports:", error);
        throw error;
      }
    }

    if (path === "/reports/sales" && method === "POST") {
      console.log("Matched /reports/sales POST route, calling reportController.saveSalesReport");
      try {
        return await reportController.saveSalesReport(event);
      } catch (error) {
        console.error("Error in saveSalesReport:", error);
        throw error;
      }
    }

    if (path === "/reports/performance" && method === "POST") {
      console.log("Matched /reports/performance POST route, calling reportController.savePerformanceReport");
      try {
        return await reportController.savePerformanceReport(event);
      } catch (error) {
        console.error("Error in savePerformanceReport:", error);
        throw error;
      }
    }
   
    // Add support for report exports
    if (path.match(/^\/reports\/export\/[^\/]+$/) && method === "GET") {
      console.log("Matched /reports/export route");
      try {
        // Extract format from path
        const match = path.match(/\/reports\/export\/([^\/]+)$/);
        if (match) {
          event.pathParameters = { format: match[1] };
        }
        return await reportController.exportReports(event);
      } catch (error) {
        console.error("Error in exportReports:", error);
        throw error;
      }
    }
    // If no routes match, return 404 Not Found
    console.log(`No route matched for: ${method} ${path}`);
    return {
      statusCode: 404,
      headers: headers,
      body: JSON.stringify({
        message: `Route not found: ${path}`,
      }),
    };
  } catch (error) {
    // Handle any errors that occur
    console.error("Error:", error);

    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: error.message,
      }),
    };
  }
};