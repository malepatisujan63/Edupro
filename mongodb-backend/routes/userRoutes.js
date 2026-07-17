// mongodb-backend/routes/userRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');

const router = express.Router();

/**
 * GET /api/users/profile/:identifier
 * Fetch and display account profile data by email OR MongoDB _id
 */
router.get('/profile/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let user = null;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await User.findById(identifier);
    } else {
      user = await User.findOne({ email: identifier.toLowerCase().trim() });
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const userObj = user.toObject();
    delete userObj.password;
    userObj.uid = userObj._id.toString();
    userObj.id = userObj._id.toString();
    userObj.name = userObj.username;

    return res.status(200).json({ user: userObj });
  } catch (err) {
    console.error('Fetch profile error:', err);
    return res.status(500).json({ error: 'Server error fetching user profile.' });
  }
});

/**
 * PUT /api/users/profile/:id
 * Update account data for display on profile page
 */
router.put('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    delete updateData.password; // Do not update password through general profile update

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userObj = updatedUser.toObject();
    delete userObj.password;
    userObj.uid = userObj._id.toString();
    userObj.id = userObj._id.toString();
    userObj.name = userObj.username;

    return res.status(200).json({ message: 'Profile updated successfully!', user: userObj });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Server error updating user profile.' });
  }
});

module.exports = router;
