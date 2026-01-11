const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Enhanced validation middleware with custom validators
 */

// Custom validators
const validators = {
  // Validate Tanzanian phone numbers
  isTanzanianPhone: (value) => {
    const regex = /^(?:\+255|0)?[67]\d{8}$/;
    return regex.test(value);
  },

  // Validate Tanzanian regions
  isTanzanianRegion: (value) => {
    const regions = [
      'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera',
      'Katavi', 'Kigoma', 'Kilimanjaro', 'Lindi', 'Manyara', 'Mara',
      'Mbeya', 'Morogoro', 'Mtwara', 'Mwanza', 'Njombe', 'Pwani',
      'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Tabora', 'Tanga'
    ];
    return regions.includes(value);
  },

  // Validate strong password
  isStrongPassword: (value) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(value);
  },

  // Validate product categories
  isProductCategory: (value) => {
    const categories = [
      'vegetables', 'fruits', 'grains', 'legumes', 'dairy',
      'poultry', 'livestock', 'seeds', 'fertilizers', 'pesticides',
      'tools', 'machinery', 'processed', 'other'
    ];
    return categories.includes(value);
  },

  // Validate M-Pesa transaction codes
  isMpesaCode: (value) => {
    const regex = /^[A-Z0-9]{10}$/;
    return regex.test(value);
  },

  // Validate GPS coordinates
  isGPSCoordinate: (value) => {
    const coord = parseFloat(value);
    return !isNaN(coord) && coord >= -90 && coord <= 90;
  },

  // Validate file size (in bytes)
  isFileSize: (maxSize) => (value) => {
    return value && value.size <= maxSize;
  },

  // Validate image file types
  isImageFile: (value) => {
    if (!value) return true;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedTypes.includes(value.mimetype);
  },

  // Validate MongoDB ObjectId
  isObjectId: (value) => {
    return mongoose.Types.ObjectId.isValid(value);
  },

  // Validate price range
  isPriceRange: (value) => {
    const price = parseFloat(value);
    return !isNaN(price) && price > 0 && price <= 10000000; // Max 10M TZS
  },

  // Validate quantity
  isQuantity: (value) => {
    const qty = parseFloat(value);
    return !isNaN(qty) && qty > 0 && qty <= 1000000; // Max 1M units
  },

  // Validate URL
  isSecureUrl: (value) => {
    if (!value) return true;
    const urlRegex = /^https:\/\/(?:[\w-]+\.)+[\w-]+(?:\/[\w-./?%&=]*)?$/;
    return urlRegex.test(value);
  }
};

// Validation chains
const validations = {
  // User registration
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be 2-50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('phone')
      .trim()
      .custom(validators.isTanzanianPhone)
      .withMessage('Please provide a valid Tanzanian phone number'),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .custom(validators.isStrongPassword)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    
    body('role')
      .isIn(['farmer', 'buyer'])
      .withMessage('Role must be either farmer or buyer'),
    
    body('location.region')
      .custom(validators.isTanzanianRegion)
      .withMessage('Please select a valid Tanzanian region'),
    
    body('location.district')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('District must be 2-50 characters')
  ],

  // User login
  login: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  // Product creation/update
  product: [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Product name must be 3-100 characters'),
    
    body('description')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be 10-1000 characters'),
    
    body('category')
      .custom(validators.isProductCategory)
      .withMessage('Please select a valid category'),
    
    body('price')
      .custom(validators.isPriceRange)
      .withMessage('Price must be between 1 and 10,000,000 TZS'),
    
    body('unit')
      .trim()
      .isIn(['kg', 'ton', 'piece', 'box', 'bag', 'liter', 'dozen'])
      .withMessage('Please select a valid unit'),
    
    body('quantity')
      .custom(validators.isQuantity)
      .withMessage('Quantity must be between 1 and 1,000,000'),
    
    body('location.region')
      .custom(validators.isTanzanianRegion)
      .withMessage('Please select a valid Tanzanian region'),
    
    body('location.district')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('District must be 2-50 characters'),
    
    body('images')
      .optional()
      .isArray()
      .withMessage('Images must be an array'),
    
    body('images.*')
      .optional()
      .isURL()
      .withMessage('Each image must be a valid URL')
  ],

  // Transaction
  transaction: [
    body('product')
      .custom(validators.isObjectId)
      .withMessage('Invalid product ID'),
    
    body('quantity')
      .custom(validators.isQuantity)
      .withMessage('Quantity must be between 1 and 1,000,000'),
    
    body('deliveryAddress')
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('Delivery address must be 10-200 characters'),
    
    body('deliveryLocation.coordinates.lat')
      .optional()
      .custom(validators.isGPSCoordinate)
      .withMessage('Invalid latitude'),
    
    body('deliveryLocation.coordinates.lng')
      .optional()
      .custom((value) => {
        const coord = parseFloat(value);
        return !isNaN(coord) && coord >= -180 && coord <= 180;
      })
      .withMessage('Invalid longitude')
  ],

  // Loan application
  loan: [
    body('amount')
      .isFloat({ min: 10000, max: 5000000 })
      .withMessage('Loan amount must be between 10,000 and 5,000,000 TZS'),
    
    body('purpose')
      .isIn(['seeds', 'fertilizer', 'equipment', 'irrigation', 'labor', 'other'])
      .withMessage('Please select a valid loan purpose'),
    
    body('term')
      .isInt({ min: 1, max: 24 })
      .withMessage('Loan term must be between 1 and 24 months'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
  ],

  // Search and filter
  search: [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search query must be 2-100 characters'),
    
    query('category')
      .optional()
      .custom(validators.isProductCategory)
      .withMessage('Invalid category'),
    
    query('region')
      .optional()
      .custom(validators.isTanzanianRegion)
      .withMessage('Invalid region'),
    
    query('minPrice')
      .optional()
      .custom(validators.isPriceRange)
      .withMessage('Invalid minimum price'),
    
    query('maxPrice')
      .optional()
      .custom(validators.isPriceRange)
      .withMessage('Invalid maximum price'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  // File upload
  fileUpload: [
    body('file')
      .custom(validators.isImageFile)
      .withMessage('File must be a valid image (JPEG, PNG, or WebP)'),
    
    body('file')
      .custom(validators.isFileSize(5 * 1024 * 1024)) // 5MB
      .withMessage('File size must not exceed 5MB')
  ],

  // ID parameter
  objectId: [
    param('id')
      .custom(validators.isObjectId)
      .withMessage('Invalid ID format')
  ]
};

// Error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      status: 400,
      error: 'Validation Failed',
      message: 'Please check your input',
      errors: errorMessages
    });
  }
  
  next();
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize all string inputs
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Remove potentially harmful characters
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else if (typeof value === 'object') {
        sanitized[key] = sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// Rate limiting for sensitive operations
const sensitiveOperationLimiter = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old requests
    if (requests.has(key)) {
      requests.set(key, requests.get(key).filter(time => time > windowStart));
    } else {
      requests.set(key, []);
    }
    
    // Check rate limit
    if (requests.get(key).length >= maxRequests) {
      return res.status(429).json({
        status: 429,
        error: 'Too Many Requests',
        message: `Please try again after ${Math.ceil(windowMs / 60000)} minutes`
      });
    }
    
    // Add current request
    requests.get(key).push(now);
    
    next();
  };
};

module.exports = {
  validators,
  validations,
  handleValidationErrors,
  sanitizeInput,
  sensitiveOperationLimiter
};
