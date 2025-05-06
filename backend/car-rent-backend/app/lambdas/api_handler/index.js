const authController = require("./controllers/authController/authController");
const userController = require("./controllers/userController/userController");
const { connectToDatabase } = require('./utils/database');
const { createResponse } = require('./utils/responseUtil');
const CarController = require("./controllers/carController/index");
const homepageController = require('./controllers/homepageController/homepageController');

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
  context.callbackWaitsForEmptyEventLoop = false;
  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    return handleCors();
  }
  if (!dbConnection) {
    dbConnection = await connectToDatabase();
  }

  // Get the path and method from the event
  const path = event.rawPath || event.path || "/";
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
      return await userController.getPersonalInfoo(event);
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
        message: "Something went wrong",
        error: error.message,
      }),
    };
  }
};