const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return error(res, 'Not authorized, user not found', 401);
      }
      return next();
    } catch (err) {
      return error(res, 'Not authorized, token failed', 401);
    }
  }

  return error(res, 'Not authorized, no token', 401);
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return error(res, `User role ${req.user.role} is not authorized to access this route`, 403);
    }
    next();
  };
};

const checkPremium = (req, res, next) => {
  if (!req.user.isPremium || (req.user.premiumExpiresAt && req.user.premiumExpiresAt < new Date())) {
    return error(res, 'This feature requires a premium subscription', 403);
  }
  next();
};

module.exports = { protect, authorize, checkPremium };



