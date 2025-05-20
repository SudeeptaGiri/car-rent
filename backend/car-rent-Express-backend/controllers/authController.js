const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const SupportAgentEmail = require('../models/supportAgentEmail');

// JWT secret - move to env/Secrets Manager in production
const JWT_SECRET = 'd7f8a2b5c4e9f3a1d6b7c8e9f0a2d3b4c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0';
const JWT_EXPIRES_IN = '24h';

// SignUp Handler - Express version
exports.signUp = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Convert email to lowercase for consistent comparison
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }
    
    if (password.length < 6 || /[A-Z]/.test(password) === false || /[0-9]/.test(password) === false) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long and contain at least one uppercase letter and one number' });
    }

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) === false) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (firstName.length > 50 || lastName.length > 50) {
      return res.status(400).json({ message: 'First name and last name must be less than 50 characters' });
    }
    
    if (/[^a-zA-Z]/.test(firstName) || /[^a-zA-Z]/.test(lastName)) {
      return res.status(400).json({ message: 'First name and last name must only contain letters' });
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

    return res.status(201).json({
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
    next(error);
  }
};

// SignIn Handler - Express version
exports.signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
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
    next(error);
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

// Express Authentication Middleware
exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const { valid, decoded, error } = exports.verifyToken(token);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid or expired token', error });
    }

    // Add user info to request object
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
};

// Role-based authorization middleware
exports.authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Convert string to array if only one role is passed
    if (typeof roles === 'string') {
      roles = [roles];
    }

    // Check if user's role is allowed
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};