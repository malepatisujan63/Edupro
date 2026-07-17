// mongodb-backend/models/User.js
const mongoose = require('mongoose');

// Mongoose automatically creates `_id` of type ObjectId (e.g. "6899fbe38d7f46a8b92c53d1")
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // Stored as plain text

  // Extended Student Profile Data
  studentType: { type: String, enum: ['school', 'college'], default: 'college' },
  college: { type: String, default: '' },
  department: { type: String, default: '' },
  semester: { type: Number, default: 1 },
  
  schoolClass: { type: String, default: '' },
  board: { type: String, default: '' },
  
  skills: [{ type: String }],
  hobbies: [{ type: String }],
  interests: [{ type: String }],

  avatarUrl: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  role: { type: String, default: 'student' },
  reputationPoints: { type: Number, default: 100 },
  badges: [{ type: String, default: 'Verified Student' }],
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
