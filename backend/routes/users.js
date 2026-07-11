const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.location) user.location = req.body.location;
    if (req.body.farmDetails) user.farmDetails = req.body.farmDetails;
    if (req.body.businessDetails) user.businessDetails = req.body.businessDetails;
    if (req.body.notificationPreferences) user.notificationPreferences = req.body.notificationPreferences;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.updateRating(rating);
    await user.save();

    res.json({ message: 'Rating submitted successfully', rating: user.rating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



