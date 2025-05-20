// utils/database.js

const mongoose = require('mongoose');

let cachedDb = null;

/**
 * Connect to MongoDB database
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
const connectToDatabase = async () => {
  // If the database connection is cached and active, use it
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  try {
    // Get MongoDB URI from environment variables
    const uri = process.env.MONGODB_URI || "mongodb+srv://gearup:gearUp8@cluster0.idgfejd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string (masked):', uri.replace(/:[^:]*@/, ':****@'));

    // Clear any existing connection
    if (mongoose.connection.readyState !== 0) {
      console.log('Closing existing mongoose connection');
      await mongoose.connection.close();
    }

    const mongooseOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000
    };

    // Connect to MongoDB
    const connection = await mongoose.connect(uri, mongooseOptions);
    console.log('Successfully connected to MongoDB');
    
    // Test the connection by listing collections
    try {
      const collections = await connection.connection.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name));
    } catch (err) {
      console.log('Could not list collections, but connection seems established');
    }
    
    // Set up connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      cachedDb = null;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    cachedDb = connection;
    return connection;
  } catch (error) {
    console.error('MongoDB connection error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    // Check for specific authentication errors
    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      console.error('Authentication failed. Please check your username and password.');
    }
    
    throw error;
  }
};

/**
 * Initialize database connection
 * Use this function at app startup
 */
const initDatabase = async () => {
  try {
    await connectToDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1); // Exit the application on database connection failure
  }
};

/**
 * Close database connection
 * Use this function during graceful shutdown
 */
const closeDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    console.log('Closing database connection...');
    await mongoose.connection.close();
    cachedDb = null;
    console.log('Database connection closed');
  }
};

module.exports = { 
  connectToDatabase,
  initDatabase,
  closeDatabase
};