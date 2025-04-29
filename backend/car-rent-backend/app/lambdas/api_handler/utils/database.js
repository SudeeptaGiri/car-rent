const mongoose = require('mongoose');

let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    // Get MongoDB URI from environment variables
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const mongooseOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    };

    const connection = await mongoose.connect(uri, mongooseOptions);
    console.log('Connected to MongoDB');
    
    cachedDb = connection;
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

module.exports = { connectToDatabase };