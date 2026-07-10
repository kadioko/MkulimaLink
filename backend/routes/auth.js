const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validate');
const FailedAction = require('../models/FailedAction');
const { success, error } = require('../utils/apiResponse');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

const buildAuthUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isPremium: user.isPremium,
  location: user.location,
  verified: user.verified
});

const buildAuthResponse = (user, token) => ({
  user: buildAuthUser(user),
  token
});

router.post('/register', registerValidation, async (req, res) => {
  try {
    const { name, email, phone, password, role, location, farmDetails, businessDetails } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return error(res, 'User already exists with this email or phone', 400);
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'farmer',
      location,
      farmDetails: role === 'farmer' ? farmDetails : undefined,
      businessDetails: role === 'buyer' ? businessDetails : undefined
    });

    const token = generateToken(user._id);

    return success(res, buildAuthResponse(user, token), 'User registered successfully', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    
    // Auto-create demo users if they don't exist
    if (!user && email.endsWith('@demo.com') && password === 'demo1234') {
      const demoUsers = {
        'farmer@demo.com': { name: 'Demo Farmer TZ', role: 'farmer', location: 'Tanzania', phone: '255700000001', isPremium: false },
        'buyer@demo.com': { name: 'Demo Buyer TZ', role: 'buyer', location: 'Tanzania', phone: '255700000002', isPremium: false },
        'premium@demo.com': { name: 'Premium Farmer TZ', role: 'farmer', location: 'Tanzania', phone: '255700000003', isPremium: true },
        'farmer.ke@demo.com': { name: 'Demo Farmer KE', role: 'farmer', location: 'Kenya', phone: '254700000004', isPremium: false },
      };
      
      const demoUser = demoUsers[email];
      if (demoUser) {
        user = await User.create({
          email,
          password,
          ...demoUser
        });
      }
    }

    if (!user) {
      await FailedAction.create({ type: 'login', email, ip: req.ip, requestId: req.id, reason: 'user_not_found' });
      return error(res, 'Invalid credentials', 401);
    }

    if (user.isLocked) {
      await FailedAction.create({ type: 'login', user: user._id, email, ip: req.ip, requestId: req.id, reason: 'account_locked' });
      return error(res, 'Account temporarily locked due to too many failed login attempts. Please try again later.', 423);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      await FailedAction.create({ type: 'login', user: user._id, email, ip: req.ip, requestId: req.id, reason: 'wrong_password' });
      return error(res, 'Invalid credentials', 401);
    }

    if (user.isBanned) {
      await FailedAction.create({ type: 'login', user: user._id, email, ip: req.ip, requestId: req.id, reason: 'user_banned' });
      return error(res, `Account suspended${user.bannedReason ? ': ' + user.bannedReason : ''}. Contact support@mkulimalink.com`, 403);
    }

    user.lastLogin = new Date();
    await user.save();
    await user.resetLoginAttempts();

    const token = generateToken(user._id);

    return success(res, buildAuthResponse(user, token), 'Login successful');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, location, farmDetails, businessDetails, notificationPreferences } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        phone,
        location,
        farmDetails: req.user.role === 'farmer' ? farmDetails : undefined,
        businessDetails: req.user.role === 'buyer' ? businessDetails : undefined,
        notificationPreferences
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/logout', protect, async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/refresh-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    const newToken = generateToken(user._id);
    res.json(buildAuthResponse(user, newToken));
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

router.post('/verify-email', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { verified: true },
      { new: true }
    ).select('-password');
    
    res.json({ message: 'Email verified successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
