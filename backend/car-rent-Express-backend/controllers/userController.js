const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// JWT configuration
const JWT_SECRET = 'd7f8a2b5c4e9f3a1d6b7c8e9f0a2d3b4c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0';
const JWT_EXPIRES_IN = '24h';

// Get personal info
exports.getPersonalInfo = async (req, res, next) => {
  try {
    // Extract userId from route parameters
    const id = req.params.id;

    // Convert to ObjectId if it's a valid ObjectId format
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: new mongoose.Types.ObjectId(id) };
    } else {
      query = { userId: id };
    }

    // Find user by query
    const user = await User.findOne(query).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format response according to API spec
    const response = {
      clientId: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      street: user.address?.street || '',
      city: user.address?.city || '',
      country: user.address?.country || '',
      postalCode: user.address?.postalCode || '',
      imageUrl: user.imageUrl || ''
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error getting personal info:', error);
    next(error);
  }
};

// Update personal info
exports.updatePersonalInfo = async (req, res, next) => {
  try {
    // Extract userId from route parameters
    const id = req.params.id;

    // Convert to ObjectId if it's a valid ObjectId format
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: new mongoose.Types.ObjectId(id) };
    } else {
      query = { userId: id };
    }

    // Extract user data from request body
    const { firstName, lastName, phoneNumber, street, city, country, postalCode, imageUrl } = req.body;
    
    // Find user by query
    const user = await User.findOne(query);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (imageUrl) user.imageUrl = imageUrl;
    
    // Update address fields
    user.address = {
      street: street || user.address?.street || '',
      city: city || user.address?.city || '',
      country: country || user.address?.country || '',
      postalCode: postalCode || user.address?.postalCode || ''
    };

    // Save updated user
    await user.save();

    // Format response according to API spec
    const response = {
      clientId: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      street: user.address?.street || '',
      city: user.address?.city || '',
      country: user.address?.country || '',
      postalCode: user.address?.postalCode || '',
      imageUrl: user.imageUrl || ''
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error updating personal info:', error);
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    // Extract userId from route parameters
    const id = req.params.id;

    // Convert to ObjectId if it's a valid ObjectId format
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: new mongoose.Types.ObjectId(id) };
    } else {
      query = { userId: id };
    }

    // Extract password data from request body
    const { oldPassword, newPassword } = req.body;

    // Find user by query
    const user = await User.findOne(query);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify old password if provided
    if (oldPassword) {
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
    }

    // Update password
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
    }

    // Generate new JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role || 'Client' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Format response according to API spec
    const response = {
      userId: user._id.toString(),
      username: `${user.firstName} ${user.lastName}`,
      role: user.role || 'Client',
      userImageUrl: user.imageUrl || '',
      idToken: token
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error changing password:', error);
    next(error);
  }
};

// Get all clients
exports.getClients = async (req, res, next) => {
  console.log('=== getClients Started ===');
  try {
    // Find all clients
    const clients = await User.find({ role: 'Client' }).select('_id firstName lastName');
    
    // Format response according to API spec
    const response = {
      content: clients.map(client => ({
        userId: client._id.toString(),
        userName: `${client.firstName} ${client.lastName}`
      }))
    };
    console.log('Fetched clients:', JSON.stringify(clients, null, 2));

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error getting clients:', error);
    next(error);
  }
};

// Get all agents
exports.getAgents = async (req, res, next) => {
  try {
    // Find all support agents
    console.log('=== getAgents Started ===');
    const agents = await User.find({ role: 'SupportAgent' }).select('_id firstName lastName');
    
    // Format response according to API spec
    const response = {
      content: agents.map(agent => ({
        userId: agent._id.toString(),
        userName: `${agent.firstName} ${agent.lastName}`
      }))
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error getting agents:', error);
    next(error);
  }
};

// Create a new user (admin function)
exports.createUser = async (req, res, next) => {
  try {
    console.log('=== createUser Started ===');
    
    // Extract user data from request body
    const { firstName, lastName, email, password, role, phoneNumber, address, imageUrl } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'First name, last name, email and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'Client',
      phoneNumber: phoneNumber || '',
      address: address || {
        street: '',
        city: '',
        country: '',
        postalCode: ''
      },
      imageUrl: imageUrl || '',
      userId: uuidv4() // Generate a UUID for the user
    });
    
    // Save the user
    await newUser.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id.toString(), email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Format response
    const response = {
      userId: newUser._id.toString(),
      username: `${newUser.firstName} ${newUser.lastName}`,
      role: newUser.role,
      userImageUrl: newUser.imageUrl || '',
      idToken: token
    };
    
    return res.status(201).json(response);
  } catch (error) {
    console.error('Error creating user:', error);
    next(error);
  }
};

// Delete a user (admin function)
exports.deleteUser = async (req, res, next) => {
  try {
    console.log('=== deleteUser Started ===');
    
    // Extract userId from route parameters
    const id = req.params.id;
    
    // Convert to ObjectId if it's a valid ObjectId format
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: new mongoose.Types.ObjectId(id) };
    } else {
      query = { userId: id };
    }
    
    // Find and delete the user
    const deletedUser = await User.findOneAndDelete(query);
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({ 
      message: 'User deleted successfully',
      userId: deletedUser._id.toString()
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    next(error);
  }
};

// Get all users with pagination and filtering (admin function)
exports.getAllUsers = async (req, res, next) => {
  try {
    console.log('=== getAllUsers Started ===');
    
    // Extract query parameters
    const { 
      role, 
      search, 
      page = 1, 
      limit = 10,
      sortBy = 'firstName',
      sortOrder = 'asc'
    } = req.query;
    
    // Build query
    const query = {};
    
    // Add role filter if provided
    if (role) {
      query.role = role;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Determine sort order
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination and sorting
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Count total users for pagination info
    const totalUsers = await User.countDocuments(query);
    
    // Format response
    const response = {
      users: users.map(user => ({
        userId: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role || 'Client',
        phoneNumber: user.phoneNumber || '',
        imageUrl: user.imageUrl || ''
      })),
      pagination: {
        totalItems: totalUsers,
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error getting all users:', error);
    next(error);
  }
};