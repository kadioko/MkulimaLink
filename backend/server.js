const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { cspMiddleware, securityHeaders } = require('./middleware/csp');
const { cache, cacheConfig, initRedis } = require('./middleware/cache');
const requestId = require('./middleware/requestId');
const { sanitizeInput } = require('./middleware/sanitize');
const { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } = require('./utils/sentry');
const logger = require('./utils/logger');
const path = require('path');
const http = require('http');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);

// Initialize Sentry
initSentry(app);

const { initializeSocket } = require('./utils/socket');
const io = initializeSocket(server);

// Security headers
app.use(securityHeaders);
app.use(cspMiddleware);
app.use(requestId);
app.use(compression());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'https://mkulimalink.vercel.app',
  'https://mkulima-link.vercel.app',
  'https://mkulimalink-api-aa384e99a888.herokuapp.com',
  'https://web-production-04667.up.railway.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.up.railway.app');
    if (isAllowed) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
morgan.token('id', (req) => req.id);
app.use(morgan(':id :method :url :status :response-time ms', { stream: logger.stream }));

const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/v1/auth/login', authLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mkulimalink';
try {
  const parsedMongoUri = new URL(mongoUri);
  logger.info(`MongoDB target: ${parsedMongoUri.hostname}:${parsedMongoUri.port || 'default'}${parsedMongoUri.pathname}`);
} catch (error) {
  logger.error('MongoDB URI is not parseable:', error.message);
}

const connectWithRetry = (retries = 5, delay = 3000) => {
  mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  })
  .then(() => logger.info('MongoDB connected successfully'))
  .catch(err => {
    logger.error('MongoDB connection error:', err.message);
    if (retries > 0) {
      logger.info(`Retrying MongoDB connection in ${delay}ms... (${retries} attempts left)`);
      setTimeout(() => connectWithRetry(retries - 1, delay), delay);
    } else {
      logger.error('MongoDB connection failed after all retries');
    }
  });
};

connectWithRetry();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const transactionRoutes = require('./routes/transactions');
const marketRoutes = require('./routes/market');
const weatherRoutes = require('./routes/weather');
const aiRoutes = require('./routes/ai');
const aimlRoutes = require('./routes/aiml');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const referralRoutes = require('./routes/referrals');
const reviewRoutes = require('./routes/reviews');
const loanRoutes = require('./routes/loans');
const featuredRoutes = require('./routes/featured');
const gamificationRoutes = require('./routes/gamification');
const voiceRoutes = require('./routes/voice');
const chatRoutes = require('./routes/chat');
const deliveryRoutes = require('./routes/delivery');
const insuranceRoutes = require('./routes/insurance');
const groupbuyRoutes = require('./routes/groupbuy');
const alertRoutes = require('./routes/alerts');
const calendarRoutes = require('./routes/calendar');
const equipmentRoutes = require('./routes/equipment');
const analyticsRoutes = require('./routes/analytics');
const supplierRoutes = require('./routes/suppliers');
const healthRoutes = require('./routes/health');
const docsRoutes = require('./routes/docs');
const seedRoutes = require('./routes/seed');
const sitemapRoutes = require('./routes/sitemap');
const searchRoutes = require('./routes/search');
const v1Routes = require('./routes/v1');
const metaRoutes = require('./routes/meta');
const reportRoutes = require('./routes/reports');
const recommendationRoutes = require('./routes/recommendations');

// New routes for enhanced features
const auctionRoutes = require('./routes/auctions');
const wishlistRoutes = require('./routes/wishlist');
const exchangeRateRoutes = require('./routes/exchangeRates');
const livestockRoutes = require('./routes/livestock');
const adminRoutes = require('./routes/admin');

// API Documentation
app.use('/api/docs', docsRoutes);
app.use('/api/v1/docs', docsRoutes);

// SEO and Search
app.use('/api/search', searchRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/sitemap.xml', sitemapRoutes);
app.use('/robots.txt', sitemapRoutes);

// API v1 routes (versioned)
app.use('/api/v1', v1Routes);

// New enhanced feature routes
app.use('/api/admin', adminRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/exchange-rates', exchangeRateRoutes);
app.use('/api/livestock', livestockRoutes);

// Legacy routes (for backwards compatibility)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', cacheConfig.products, productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/market', cacheConfig.marketPrices, marketRoutes);
app.use('/api/weather', cacheConfig.weather, weatherRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/aiml', aimlRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/featured', featuredRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/groupbuy', groupbuyRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/health', healthRoutes);
app.get('/api/ready', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ status: 'not_ready', error: 'MongoDB not ready' });
    }

    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ready', services: { mongodb: 'healthy' } });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', error: error.message });
  }
});
app.use('/api/seed', seedRoutes);

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  const errorResponse = {
    success: false,
    error: {
      message,
      statusCode,
      requestId: req.id
    }
  };

  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack;
  }

  (req.logger || logger).error({
    message,
    statusCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  res.status(statusCode).json(errorResponse);
});

// Sentry error handler (must be last)
app.use(sentryErrorHandler);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Socket.io enabled for real-time features`);
});

// Initialize database indexes and auto-seed
const { createAllIndexes } = require('./utils/indexes');
const { autoSeedOnEmpty } = require('./utils/autoSeed');
mongoose.connection.once('open', () => {
  logger.info('MongoDB connection open, creating indexes');
  createAllIndexes();
  autoSeedOnEmpty();
});

const cronJobs = require('./utils/cronJobs');
cronJobs.startCronJobs();

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed');
    if (io) {
      io.close();
      logger.info('Socket.io server closed');
    }
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error.message);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
