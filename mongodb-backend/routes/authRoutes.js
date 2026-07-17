// mongodb-backend/routes/authRoutes.js
const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

/** Helper function: Returns plain text password directly (no hashing) */
function hashPassword(plainText) {
  if (!plainText) return '';
  return plainText;
}

/**
 * POST /api/auth/register
 * 1. Checks if email already exists in MongoDB (`db.users.findOne({ email })`)
 * 2. If no -> hashes password and stores new user (`db.users.create({...})`)
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, studentType, college, department, semester, schoolClass, board, skills, hobbies, interests, avatarUrl } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email is already registered! Please sign in instead.' });
    }

    // Store password as plain text
    const hashedPassword = hashPassword(password);

    const newUser = await User.create({
      username,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      studentType: studentType || 'college',
      college: college || '',
      department: department || '',
      semester: semester || 1,
      schoolClass: schoolClass || '',
      board: board || '',
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      hobbies: Array.isArray(hobbies) ? hobbies : (hobbies ? hobbies.split(',').map(s => s.trim()) : []),
      interests: Array.isArray(interests) ? interests : (interests ? interests.split(',').map(s => s.trim()) : []),
      avatarUrl: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6C63FF&color=fff`,
      badges: ['Verified Student', 'MongoDB User']
    });

    // Return user object without sensitive password field
    const userObj = newUser.toObject();
    delete userObj.password;
    
    // Map MongoDB _id to uid for clean React frontend display
    userObj.uid = userObj._id.toString();
    userObj.id = userObj._id.toString();
    userObj.name = userObj.username;

    return res.status(201).json({ message: 'User registered successfully!', user: userObj });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
});

/**
 * POST /api/auth/login
 * 1. Searches `SELECT * FROM users WHERE email = ?` (`db.users.findOne({ email })`)
 * 2. Compares entered plaintext with stored hashed password
 * 3. Returns user profile if matched
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Search user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare plain text password
    const computedHash = hashPassword(password);
    const isMatch = (user.password === computedHash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userObj = user.toObject();
    delete userObj.password;
    userObj.uid = userObj._id.toString();
    userObj.id = userObj._id.toString();
    userObj.name = userObj.username;

    return res.status(200).json({ message: 'Login successful!', user: userObj });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;
