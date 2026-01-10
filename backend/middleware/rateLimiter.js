const rateLimit = require('express-rate-limit');

// General API rate limiter (IP-based)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    status: 429,
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for auth endpoints (IP-based)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    status: 429,
    error: 'Too many login attempts',
    message: 'Too many login attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

// Per-user rate limiter (requires authentication)
const userRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests for this user'
  } = options;

  const userRequests = new Map();

  // Cleanup old entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of userRequests.entries()) {
      if (now - data.windowStart > windowMs) {
        userRequests.delete(key);
      }
    }
  }, 60000);

  return (req, res, next) => {
    // Skip if no user (not authenticated)
    if (!req.user || !req.user._id) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();

    let userData = userRequests.get(userId);

    // Initialize or reset window
    if (!userData || now - userData.windowStart > windowMs) {
      userData = {
        windowStart: now,
        count: 0
      };
    }

    userData.count++;
    userRequests.set(userId, userData);

    // Set headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - userData.count));
    res.setHeader('X-RateLimit-Reset', new Date(userData.windowStart + windowMs).toISOString());

    if (userData.count > max) {
      return res.status(429).json({
        status: 429,
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil((userData.windowStart + windowMs - now) / 1000)
      });
    }

    next();
  };
};

// Premium users get higher limits
const premiumUserLimiter = userRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Premium rate limit exceeded'
});

// Standard users
const standardUserLimiter = userRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Standard rate limit exceeded'
});

// Dynamic rate limiter based on user type
const dynamicUserLimiter = (req, res, next) => {
  if (req.user?.isPremium) {
    return premiumUserLimiter(req, res, next);
  }
  return standardUserLimiter(req, res, next);
};

// Upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: {
    status: 429,
    error: 'Upload limit exceeded',
    message: 'Too many uploads, please try again later.'
  }
});

// Payment rate limiter (very strict)
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 payment attempts per hour
  message: {
    status: 429,
    error: 'Payment rate limit exceeded',
    message: 'Too many payment attempts, please try again later.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  userRateLimiter,
  dynamicUserLimiter,
  premiumUserLimiter,
  standardUserLimiter,
  uploadLimiter,
  paymentLimiter
};
