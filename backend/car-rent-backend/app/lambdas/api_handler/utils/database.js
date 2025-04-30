const mongoose = require('mongoose');

let cachedDb = null;

const connectToDatabase = async () => {
  // If the database connection is cached, use it
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

module.exports = { connectToDatabase };