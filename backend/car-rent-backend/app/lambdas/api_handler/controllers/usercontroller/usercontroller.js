// controllers/userController.js
const User = require('../../models/userModel');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// const { connectToDatabase } = require('../authcontroller/authcontroller');

// JWT configuration
const JWT_SECRET = 'd7f8a2b5c4e9f3a1d6b7c8e9f0a2d3b4c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0';
const JWT_EXPIRES_IN = '24h';


// Get personal info
exports.getPersonalInfo = async (event) => {
  try {
    // Connect to the database first
    // await connectToDatabase();
    
    // Extract userId from path parameters
    const id = event.pathParameters.id;

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
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ message: 'User not found' })
      };
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

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error getting personal info:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        message: 'Server error while getting personal information',
        error: error.message
      })
    };
  }
};

// Update personal info
exports.updatePersonalInfo = async (event) => {
  try {
    // Connect to the database first
    // await connectToDatabase();
    
    // Extract userId from path parameters
    const id = event.pathParameters.id;

    // Convert to ObjectId if it's a valid ObjectId format
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: new mongoose.Types.ObjectId(id) };
    } else {
      query = { userId: id };
    }

    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    
    // Extract user data
    const { firstName, lastName, phoneNumber, street, city, country, postalCode, imageUrl } = body;
    
    // Find user by query
    const user = await User.findOne(query);
    
    if (!user) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ message: 'User not found' })
      };
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

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error updating personal info:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        message: 'Server error while updating personal information',
        error: error.message
      })
    };
  }
};

// Change password
exports.changePassword = async (event) => {
  try {
    // Connect to the database first
    // await connectToDatabase();
    
    // Extract userId from path parameters
    const id = event.pathParameters.id;

    // Convert to ObjectId if it's a valid ObjectId format
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: new mongoose.Types.ObjectId(id) };
    } else {
      query = { userId: id };
    }

    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    const { oldPassword, newPassword } = body;

    // Find user by query
    const user = await User.findOne(query);
    
    if (!user) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ message: 'User not found' })
      };
    }

    // Verify old password if provided
    if (oldPassword) {
      const isPasswordValid = await  bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return {
          statusCode: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify({ message: 'Current password is incorrect' })
        };
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

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error changing password:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        message: 'Server error while changing password',
        error: error.message
      })
    };
  }
};

// Get all clients
exports.getClients = async (event) => {
  try {
    // Connect to the database first
    // await connectToDatabase();
    
    // Find all clients
    const clients = await User.find({ role: 'Client' }).select('_id firstName lastName');
    
    // Format response according to API spec
    const response = {
      content: clients.map(client => ({
        userId: client._id.toString(),
        userName: `${client.firstName} ${client.lastName}`
      }))
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error getting clients:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        message: 'Server error while getting clients',
        error: error.message
      })
    };
  }
};

// Get all agents
exports.getAgents = async (event) => {
  try {
    // Connect to the database first
    // await connectToDatabase();
    
    // Find all support agents
    const agents = await User.find({ role: 'SupportAgent' }).select('_id firstName lastName');
    
    // Format response according to API spec
    const response = {
      content: agents.map(agent => ({
        userId: agent._id.toString(),
        userName: `${agent.firstName} ${agent.lastName}`
      }))
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error getting agents:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        message: 'Server error while getting agents',
        error: error.message
      })
    };
  }
};