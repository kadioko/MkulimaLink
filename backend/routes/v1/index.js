const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('../auth');
const userRoutes = require('../users');
const productRoutes = require('../products');
const transactionRoutes = require('../transactions');
const marketRoutes = require('../market');
const weatherRoutes = require('../weather');
const aiRoutes = require('../ai');
const paymentRoutes = require('../payments');
const notificationRoutes = require('../notifications');
const referralRoutes = require('../referrals');
const reviewRoutes = require('../reviews');
const loanRoutes = require('../loans');
const featuredRoutes = require('../featured');
const gamificationRoutes = require('../gamification');
const voiceRoutes = require('../voice');
const chatRoutes = require('../chat');
const deliveryRoutes = require('../delivery');
const insuranceRoutes = require('../insurance');
const groupbuyRoutes = require('../groupbuy');
const alertRoutes = require('../alerts');
const calendarRoutes = require('../calendar');
const equipmentRoutes = require('../equipment');
const analyticsRoutes = require('../analytics');
const supplierRoutes = require('../suppliers');
const healthRoutes = require('../health');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/transactions', transactionRoutes);
router.use('/market', marketRoutes);
router.use('/weather', weatherRoutes);
router.use('/ai', aiRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/referrals', referralRoutes);
router.use('/reviews', reviewRoutes);
router.use('/loans', loanRoutes);
router.use('/featured', featuredRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/voice', voiceRoutes);
router.use('/chat', chatRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/insurance', insuranceRoutes);
router.use('/groupbuy', groupbuyRoutes);
router.use('/alerts', alertRoutes);
router.use('/calendar', calendarRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/health', healthRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'MkulimaLink API',
    version: 'v1',
    description: 'Agriculture Super-App for East Africa',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      products: '/api/v1/products',
      transactions: '/api/v1/transactions',
      market: '/api/v1/market',
      weather: '/api/v1/weather',
      ai: '/api/v1/ai',
      payments: '/api/v1/payments',
      notifications: '/api/v1/notifications',
      chat: '/api/v1/chat',
      delivery: '/api/v1/delivery',
      insurance: '/api/v1/insurance',
      loans: '/api/v1/loans',
      groupbuy: '/api/v1/groupbuy',
      alerts: '/api/v1/alerts',
      calendar: '/api/v1/calendar',
      equipment: '/api/v1/equipment',
      analytics: '/api/v1/analytics',
      suppliers: '/api/v1/suppliers',
      health: '/api/v1/health'
    },
    documentation: '/api/v1/docs'
  });
});

module.exports = router;
