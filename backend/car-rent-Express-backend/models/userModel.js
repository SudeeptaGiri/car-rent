// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Client', 'SupportAgent', 'Admin'],
    default: 'Client'
  },
  imageUrl: {
    type: String,
    default: null
  },
  phoneNumber: {
    type: String,
    default: null
  },
  address: {
    street: {
      type: String,
      default: null
    },
    city: {
      type: String,
      default: null
    },
    country: {
      type: String,
      default: null
    },
    postalCode: {
      type: String,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


const User = mongoose.model('User', userSchema);

module.exports = User;