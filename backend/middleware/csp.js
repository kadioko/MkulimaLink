const helmet = require('helmet');

/**
 * Content Security Policy (CSP) configuration
 * Prevents XSS and other injection attacks
 */

const cspConfig = {
  directives: {
    // Default to self for everything
    defaultSrc: ["'self'"],
    
    // Scripts - Allow self and specific CDNs
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // For inline scripts (temporary, should be removed)
      "'unsafe-eval'", // For React development (remove in production)
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://cdnjs.cloudflare.com",
      "https://unpkg.com",
      "https://js.stripe.com",
      "https://checkout.stripe.com"
    ],
    
    // Styles - Allow self and inline styles (for Tailwind)
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com"
    ],
    
    // Images - Allow self, data URLs, and image CDNs
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https://mkulimalink-uploads.s3.af-south-1.amazonaws.com",
      "https://images.unsplash.com",
      "https://res.cloudinary.com",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com"
    ],
    
    // Fonts - Allow self and Google Fonts
    fontSrc: [
      "'self'",
      "data:",
      "https://fonts.gstatic.com",
      "https://cdnjs.cloudflare.com"
    ],
    
    // Connect - Allow API endpoints and external services
    connectSrc: [
      "'self'",
      "ws://localhost:5000",
      "wss://api.mkulimalink.co.tz",
      "https://api.mkulimalink.co.tz",
      "https://www.google-analytics.com",
      "https://analytics.google.com",
      "https://api.stripe.com",
      "https://checkout.stripe.com",
      "https://openweathermap.org",
      "https://api.africastalking.com",
      "https://sandbox.safaricom.co.ke",
      "https://mpesa.safaricom.co.ke"
    ],
    
    // Media - Allow self and upload CDN
    mediaSrc: [
      "'self'",
      "https://mkulimalink-uploads.s3.af-south-1.amazonaws.com"
    ],
    
    // Objects - Disallow objects (prevents plugins)
    objectSrc: ["'none'"],
    
    // Base URI - Restrict base tag
    baseUri: ["'self'"],
    
    // Form actions - Allow self and external payment forms
    formAction: [
      "'self'",
      "https://checkout.stripe.com",
      "https://mpesa.safaricom.co.ke"
    ],
    
    // Frame ancestors - Disallow framing (clickjacking protection)
    frameAncestors: ["'none'"],
    
    // Frame sources - Disallow frames
    frameSrc: ["'none'"],
    
    // Worker sources - Allow self for service workers
    workerSrc: ["'self'", "blob:"],
    
    // Manifest - Allow manifest.json
    manifestSrc: ["'self'"],
    
    // Upgrade insecure requests
    upgradeInsecureRequests: []
  },
  
  // Report CSP violations
  reportUri: process.env.NODE_ENV === 'production' 
    ? 'https://csp-report.mkulimalink.co.tz/report'
    : null,
  
  // Report only in development
  reportOnly: process.env.NODE_ENV !== 'production'
};

// Nonce-based CSP for stricter security
const nonceBasedCsp = (req, res, next) => {
  // Generate nonce for each request
  const nonce = require('crypto').randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  
  // CSP with nonce
  const cspWithNonce = {
    ...cspConfig,
    directives: {
      ...cspConfig.directives,
      scriptSrc: [
        "'self'",
        `'nonce-${nonce}'`,
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://cdnjs.cloudflare.com",
        "https://unpkg.com",
        "https://js.stripe.com",
        "https://checkout.stripe.com"
      ],
      styleSrc: [
        "'self'",
        `'nonce-${nonce}'`,
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"
      ]
    }
  };
  
  return helmet.contentSecurityPolicy(cspWithNonce)(req, res, next);
};

// Development CSP (more permissive)
const developmentCsp = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "blob:", "https:"],
    connectSrc: ["'self'", "ws:", "wss:", "https:"],
    fontSrc: ["'self'", "data:", "https:"],
    mediaSrc: ["'self'", "https:"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    frameSrc: ["'none'"],
    workerSrc: ["'self'", "blob:"],
    manifestSrc: ["'self'"]
  },
  reportOnly: true
});

// Production CSP (strict)
const productionCsp = helmet.contentSecurityPolicy(cspConfig);

// Middleware to choose CSP based on environment
const cspMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return developmentCsp(req, res, next);
  } else if (process.env.USE_NONCE_CSP === 'true') {
    return nonceBasedCsp(req, res, next);
  } else {
    return productionCsp(req, res, next);
  }
};

// Additional security headers
const securityHeaders = helmet({
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // Enable XSS protection
  xssFilter: true,
  
  // Force HTTPS in production
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  
  // Referrer policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // Permissions policy (formerly Feature Policy)
  permissionsPolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'self'"],
      payment: ["'self'", "https://checkout.stripe.com"],
      usb: ["'none'"],
      magnetometer: ["'none'"],
      gyroscope: ["'none'"],
      accelerometer: ["'none'"]
    }
  },
  
  // Cross Origin Embedder Policy
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  
  // Cross Origin Opener Policy
  crossOriginOpenerPolicy: process.env.NODE_ENV === 'production',
  
  // Cross Origin Resource Policy
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

module.exports = {
  cspMiddleware,
  securityHeaders,
  nonceBasedCsp,
  developmentCsp,
  productionCsp,
  cspConfig
};
