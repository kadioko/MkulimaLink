const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Initialize Sentry error tracking
 * @param {Express} app - Express application instance
 */
function initSentry(app) {
  // Only initialize if DSN is provided
  if (!process.env.SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '2.0.0',
    
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // Enable profiling
      nodeProfilingIntegration()
    ],

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      
      // Remove sensitive body data
      if (event.request?.data) {
        const data = typeof event.request.data === 'string' 
          ? JSON.parse(event.request.data) 
          : event.request.data;
        
        if (data.password) data.password = '[FILTERED]';
        if (data.token) data.token = '[FILTERED]';
        if (data.apiKey) data.apiKey = '[FILTERED]';
        
        event.request.data = JSON.stringify(data);
      }
      
      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      'TokenExpiredError',
      'JsonWebTokenError',
      'ValidationError',
      /^Network request failed$/
    ]
  });

  console.log('Sentry initialized for error tracking');
}

/**
 * Sentry request handler middleware (use before routes)
 */
function sentryRequestHandler() {
  if (!process.env.SENTRY_DSN) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.requestHandler();
}

/**
 * Sentry tracing handler middleware (use before routes)
 */
function sentryTracingHandler() {
  if (!process.env.SENTRY_DSN) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.tracingHandler();
}

/**
 * Sentry error handler middleware (use after routes)
 */
function sentryErrorHandler() {
  if (!process.env.SENTRY_DSN) {
    return (err, req, res, next) => next(err);
  }
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture 4xx and 5xx errors
      return error.status >= 400;
    }
  });
}

/**
 * Capture exception manually
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context
 */
function captureException(error, context = {}) {
  if (!process.env.SENTRY_DSN) {
    console.error('Error:', error.message, context);
    return;
  }
  
  Sentry.withScope(scope => {
    if (context.user) {
      scope.setUser({
        id: context.user._id?.toString(),
        email: context.user.email,
        username: context.user.name
      });
    }
    
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    Sentry.captureException(error);
  });
}

/**
 * Capture message manually
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (info, warning, error)
 */
function captureMessage(message, level = 'info') {
  if (!process.env.SENTRY_DSN) {
    console.log(`[${level}] ${message}`);
    return;
  }
  
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for tracking
 * @param {Object} user - User object
 */
function setUser(user) {
  if (!process.env.SENTRY_DSN || !user) return;
  
  Sentry.setUser({
    id: user._id?.toString(),
    email: user.email,
    username: user.name,
    role: user.role
  });
}

/**
 * Clear user context
 */
function clearUser() {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setUser(null);
}

module.exports = {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  Sentry
};



