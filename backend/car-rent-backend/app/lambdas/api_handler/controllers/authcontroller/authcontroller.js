const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/userModel');
const SupportAgentEmail = require('../../models/supportAgentEmail');

// JWT secret - move to env/Secrets Manager in production
const JWT_SECRET = 'd7f8a2b5c4e9f3a1d6b7c8e9f0a2d3b4c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0';
const JWT_EXPIRES_IN = '24h';

let cachedDb = null;

// async function connectToDatabase() {
//   if (cachedDb) return cachedDb;

//   const mongoURI = 'mongodb+srv://gearup:gearUp8@cluster0.idgfejd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  
//   try {
//     const client = await mongoose.connect(mongoURI);
//     cachedDb = client.connection.db;
//     console.log('Connected to MongoDB successfully!');
//     return cachedDb;
//   } catch (error) {
//     console.error('MongoDB connection error:', error);
//     throw error;
//   }
// }
// Add this line at the end of authController.js
// exports.connectToDatabase = connectToDatabase;


// SignUp Handler

exports.signUp = async (event) => {
  try {
    // await connectToDatabase();
    const body = JSON.parse(event.body || '{}');
    const { firstName, lastName, email, password } = body;

    if (!firstName || !lastName || !email || !password) {
      return response(400, { message: 'All fields are required' });
    }

    // Convert email to lowercase for consistent comparison
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return response(400, { message: 'User already exists with this email' });
    }

    // Check if the email is in the support agent database
    const isSupportAgent = await SupportAgentEmail.findOne({ email: normalizedEmail });
    
    // Set the role based on whether the email is in the support agent database
    const role = isSupportAgent ? 'SupportAgent' : 'Client';

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      role: role // Set the role here
    });

    await newUser.save();

    const token = jwt.sign(
      { 
        userId: newUser._id, 
        email: newUser.email,
        role: newUser.role // Include role in the JWT token
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return response(201, {
      message: 'User created successfully',
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role // Include role in the response
      },
      token
    });
  } catch (error) {
    console.error('SignUp error:', error);
    return response(500, { message: 'Server error during signup' });
  }
};

// SignIn Handler
exports.signIn = async (event) => {
  try {
    // await connectToDatabase();
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    if (!email || !password) {
      return response(400, { message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return response(401, { message: 'Invalid email' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return response(401, { message: 'Invalid password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email ,role: user.role},
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return response(200, {
      message: 'Login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('SignIn error:', error);
    return response(500, { message: 'Server error during signin' });
  }
};

// JWT Verification Utility
exports.verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Middleware-like Authenticator for API Gateway
exports.authenticateRequest = async (event) => {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized('Authentication required');
    }

    const token = authHeader.split(' ')[1];
    const { valid, decoded, error } = exports.verifyToken(token);

    if (!valid) {
      return unauthorized('Invalid or expired token', error);
    }

    return {
      isAuthenticated: true,
      user: decoded
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      isAuthenticated: false,
      response: response(500, { message: 'Server error during authentication' })
    };
  }
};

// Reusable Response Helpers
function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}

function unauthorized(message, error = null) {
  return {
    isAuthenticated: false,
    response: response(401, { message, error })
  };
}
