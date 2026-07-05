const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const MarketPrice = require('../models/MarketPrice');
const FailedAction = require('../models/FailedAction');
const { protect, authorize } = require('../middleware/auth');

const adminOnly = [protect, authorize('admin')];

// ============================================================
// PLATFORM STATS
// ============================================================

// GET /api/admin/stats
router.get('/stats', adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const Transaction = mongoose.models.Transaction || null;
    const Livestock = mongoose.models.Livestock || null;

    const [
      totalUsers, newUsersThisMonth, newUsersLastMonth,
      totalFarmers, totalBuyers, totalAdmins,
      bannedUsers, premiumUsers,
      totalProducts, activeProducts,
      newProductsThisMonth,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ isPremium: true }),
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ createdAt: { $gte: startOfMonth } }),
    ]);

    let totalRevenue = 0, totalTransactions = 0, pendingTransactions = 0,
      revenueThisMonth = 0, revenueLastMonth = 0;

    if (Transaction) {
      const [rev, revMonth, revLastMonth, txTotal, txPending] = await Promise.all([
        Transaction.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
        Transaction.aggregate([
          { $match: { createdAt: { $gte: startOfMonth }, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Transaction.aggregate([
          { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Transaction.countDocuments(),
        Transaction.countDocuments({ status: 'pending' }),
      ]);
      totalRevenue = rev[0]?.total || 0;
      revenueThisMonth = revMonth[0]?.total || 0;
      revenueLastMonth = revLastMonth[0]?.total || 0;
      totalTransactions = txTotal;
      pendingTransactions = txPending;
    }

    let totalAnimals = 0;
    if (Livestock) {
      totalAnimals = await Livestock.countDocuments({ isActive: true });
    }

    const userGrowth = newUsersLastMonth > 0
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
      : newUsersThisMonth > 0 ? 100 : 0;

    const revenueGrowth = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : revenueThisMonth > 0 ? 100 : 0;

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, farmers: totalFarmers, buyers: totalBuyers, admins: totalAdmins, banned: bannedUsers, premium: premiumUsers, newThisMonth: newUsersThisMonth, growth: userGrowth },
        products: { total: totalProducts, active: activeProducts, newThisMonth: newProductsThisMonth },
        transactions: { total: totalTransactions, pending: pendingTransactions, revenue: totalRevenue, revenueThisMonth, revenueGrowth },
        livestock: { totalAnimals },
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/stats/growth — monthly user + revenue growth for chart
router.get('/stats/growth', adminOnly, async (req, res) => {
  try {
    const months = 6;
    const result = [];
    const Transaction = mongoose.models.Transaction || null;

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 0);
      const label = start.toLocaleString('default', { month: 'short', year: '2-digit' });

      const [users, revenue] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        Transaction
          ? Transaction.aggregate([{ $match: { createdAt: { $gte: start, $lte: end }, status: 'completed' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]).then(r => r[0]?.total || 0)
          : Promise.resolve(0),
      ]);
      result.push({ month: label, users, revenue });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// USER MANAGEMENT
// ============================================================

// GET /api/admin/users
router.get('/users', adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, banned } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (banned === 'true') filter.isBanned = true;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const Product = mongoose.model('Product');
    const [productCount] = await Promise.all([
      Product.countDocuments({ seller: user._id }),
    ]);

    res.json({ success: true, data: { ...user.toObject(), productCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot ban yourself' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: true, isActive: false, bannedReason: reason || 'Banned by admin', bannedAt: new Date() },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user, message: 'User banned' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id/unban
router.put('/users/:id/unban', adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, isActive: true, bannedReason: undefined, bannedAt: undefined },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user, message: 'User unbanned' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['farmer', 'buyer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user, message: `Role changed to ${role}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id/premium
router.put('/users/:id/premium', adminOnly, async (req, res) => {
  try {
    const { grant, days = 30 } = req.body;
    const update = grant
      ? { isPremium: true, premiumExpiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000) }
      : { isPremium: false, premiumExpiresAt: undefined };
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user, message: grant ? `Premium granted for ${days} days` : 'Premium revoked' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id/verify
router.put('/users/:id/verify', adminOnly, async (req, res) => {
  try {
    const { state = 'verified', method = 'manual', adminNotes, documentType, documentUrl } = req.body;
    if (!['unverified', 'pending_review', 'verified', 'rejected'].includes(state)) {
      return res.status(400).json({ success: false, message: 'Invalid verification state' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, {
      verified: state === 'verified',
      verification: {
        state,
        method,
        adminNotes,
        documentType,
        documentUrl,
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      }
    }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user, message: `User verification set to ${state}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted permanently' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// PRODUCT MODERATION
// ============================================================

// GET /api/admin/products
router.get('/products', adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name email phone role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({ success: true, data: products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/products/:id/status
router.put('/products/:id/status', adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['draft', 'active', 'reserved', 'sold', 'expired'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const product = await Product.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product, message: `Product set to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// TRANSACTIONS (read-only view for admin)
// ============================================================

// GET /api/admin/transactions
router.get('/transactions', adminOnly, async (req, res) => {
  try {
    const Transaction = mongoose.models.Transaction;
    if (!Transaction) return res.json({ success: true, data: [], total: 0 });

    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('buyer', 'name email')
        .populate('seller', 'name email')
        .populate('product', 'name category price unit')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({ success: true, data: transactions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// PLATFORM ANALYTICS
// ============================================================

// GET /api/admin/analytics/users — user breakdown by role + country
router.get('/analytics/users', adminOnly, async (req, res) => {
  try {
    const [byRole, byCountry, recentSignups] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: '$location.region', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      User.find().select('name email role createdAt').sort({ createdAt: -1 }).limit(10),
    ]);
    res.json({ success: true, data: { byRole, byCountry, recentSignups } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/analytics/products — product breakdown by category
router.get('/analytics/products', adminOnly, async (req, res) => {
  try {
    const [byCategory, byStatus, topSellers] = await Promise.all([
      Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Product.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Product.aggregate([
        { $group: { _id: '$seller', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' } },
        { $unwind: '$seller' },
        { $project: { count: 1, 'seller.name': 1, 'seller.email': 1 } },
      ]),
    ]);
    res.json({ success: true, data: { byCategory, byStatus, topSellers } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// SYSTEM SETTINGS (stored in-memory/env for now)
// ============================================================

// GET /api/admin/settings
router.get('/settings', adminOnly, async (req, res) => {
  res.json({
    success: true,
    data: {
      platformName: 'MkulimaLink',
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      registrationOpen: process.env.REGISTRATION_OPEN !== 'false',
      premiumEnabled: process.env.PREMIUM_ENABLED !== 'false',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@mkulimalink.com',
      version: '2.1.0',
    }
  });
});

// GET /api/admin/activity — recent admin-visible activity log
router.get('/activity', adminOnly, async (req, res) => {
  try {
    const [recentUsers, recentProducts] = await Promise.all([
      User.find().select('name email role createdAt isBanned').sort({ createdAt: -1 }).limit(5),
      Product.find().populate('seller', 'name').select('name category status createdAt seller').sort({ createdAt: -1 }).limit(5),
    ]);

    const activity = [
      ...recentUsers.map(u => ({ type: 'user_signup', label: `${u.name} joined as ${u.role}`, time: u.createdAt, icon: 'user' })),
      ...recentProducts.map(p => ({ type: 'product_listed', label: `${p.seller?.name || '?'} listed ${p.name}`, time: p.createdAt, icon: 'product' })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 12);

    res.json({ success: true, data: activity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/system
router.get('/system', adminOnly, async (req, res) => {
  try {
    const Transaction = mongoose.models.Transaction || null;
    const collections = await mongoose.connection.db.listCollections().toArray();
    const [
      users,
      products,
      activeProducts,
      expiredProducts,
      transactions,
      pendingTransactions
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'expired' }),
      Transaction ? Transaction.countDocuments() : Promise.resolve(0),
      Transaction ? Transaction.countDocuments({ status: 'pending' }) : Promise.resolve(0)
    ]);

    res.json({
      success: true,
      data: {
        app: {
          name: 'MkulimaLink',
          version: process.env.npm_package_version || '2.0.0',
          environment: process.env.NODE_ENV || 'development',
          uptimeSeconds: Math.round(process.uptime())
        },
        services: {
          mongodb: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
          redis: global.redisClient ? 'configured' : 'not_configured',
          sentry: process.env.SENTRY_DSN ? 'configured' : 'not_configured'
        },
        counts: {
          users,
          products,
          activeProducts,
          expiredProducts,
          transactions,
          pendingTransactions,
          collections: collections.length
        },
        env: {
          railway: Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID),
          frontendUrl: process.env.FRONTEND_URL || null,
          listingExpiryDays: process.env.LISTING_EXPIRY_DAYS || '45'
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/seed-status
router.get('/seed-status', adminOnly, async (req, res) => {
  try {
    const [demoUsers, products, marketPrices, transactions, failedSeedAttempts] = await Promise.all([
      User.countDocuments({ email: /@demo\.com$/ }),
      Product.countDocuments(),
      MarketPrice.countDocuments(),
      mongoose.models.Transaction ? mongoose.models.Transaction.countDocuments() : Promise.resolve(0),
      FailedAction.countDocuments({ type: 'seed' })
    ]);

    res.json({
      success: true,
      data: {
        demoUsers,
        products,
        marketPrices,
        transactions,
        failedSeedAttempts,
        complete: demoUsers >= 4 && products >= 9 && marketPrices >= 20 && transactions >= 2
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/failed-actions
router.get('/failed-actions', adminOnly, async (req, res) => {
  try {
    const { type, page = 1, limit = 50 } = req.query;
    const filter = type ? { type } : {};
    const [actions, total] = await Promise.all([
      FailedAction.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      FailedAction.countDocuments(filter)
    ]);
    res.json({ success: true, data: actions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
