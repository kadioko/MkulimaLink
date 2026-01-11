const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { cspMiddleware, securityHeaders } = require('./middleware/csp');
const { cache, cacheConfig } = require('./middleware/cache');
const { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } = require('./utils/sentry');
const path = require('path');
const http = require('http');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Initialize Sentry
initSentry(app);

const { initializeSocket } = require('./utils/socket');
initializeSocket(server);

// Security headers
app.use(securityHeaders);
app.use(cspMiddleware);
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/v1/auth/login', authLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mkulimalink')
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const transactionRoutes = require('./routes/transactions');
const marketRoutes = require('./routes/market');
const weatherRoutes = require('./routes/weather');
const aiRoutes = require('./routes/ai');
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
const sitemapRoutes = require('./routes/sitemap');
const searchRoutes = require('./routes/search');
const v1Routes = require('./routes/v1');

// API Documentation
app.use('/api/docs', docsRoutes);
app.use('/api/v1/docs', docsRoutes);

// SEO and Search
app.use('/api/search', searchRoutes);
app.use('/sitemap.xml', sitemapRoutes);
app.use('/robots.txt', sitemapRoutes);

// API v1 routes (versioned)
app.use('/api/v1', v1Routes);

// Legacy routes (for backwards compatibility)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/ai', aiRoutes);
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

// Apply caching to API routes
app.use('/api/products', cacheConfig.products);
app.use('/api/market', cacheConfig.marketPrices);
app.use('/api/weather', cacheConfig.weather);

// Sentry error handler (must be last)
app.use(sentryErrorHandler);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io enabled for real-time features`);
});

// Initialize database indexes
const { createAllIndexes } = require('./utils/indexes');
mongoose.connection.once('open', () => {
  createAllIndexes();
});

const cronJobs = require('./utils/cronJobs');
cronJobs.startCronJobs();
