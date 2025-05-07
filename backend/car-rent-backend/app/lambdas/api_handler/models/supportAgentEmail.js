// models/SupportAgentEmail.js
const mongoose = require('mongoose');

const supportAgentEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const SupportAgentEmail = mongoose.model('SupportAgentEmail', supportAgentEmailSchema);

module.exports = SupportAgentEmail;