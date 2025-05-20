const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { initDatabase, closeDatabase } = require('./utils/database');

// Import routes
const carRoutes = require('./routes/carRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const homepageRoutes = require('./routes/homepageRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

// Error handler middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/cars', carRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/home', homepageRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to Car Rental API' });
});

// Error handling middleware
app.use(errorHandler);

// 404 route
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database before starting the server
const startServer = async () => {
  try {
    await initDatabase();
    
    // Start server
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        await closeDatabase();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(async () => {
        console.log('HTTP server closed');
        await closeDatabase();
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;