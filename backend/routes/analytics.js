const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const User = require('../models/User');
const MarketPrice = require('../models/MarketPrice');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let stats = {};

    if (role === 'farmer') {
      const [sales, products, revenue] = await Promise.all([
        Transaction.countDocuments({ seller: userId, createdAt: { $gte: thirtyDaysAgo } }),
        Product.countDocuments({ seller: userId, status: 'active' }),
        Transaction.aggregate([
          { $match: { seller: userId, status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
          { $group: { _id: null, total: { $sum: '$sellerAmount' } } }
        ])
      ]);

      stats = {
        totalSales: sales,
        activeProducts: products,
        monthlyRevenue: revenue[0]?.total || 0,
        pendingOrders: await Transaction.countDocuments({ seller: userId, status: 'pending' })
      };
    } else {
      const [purchases, spent] = await Promise.all([
        Transaction.countDocuments({ buyer: userId, createdAt: { $gte: thirtyDaysAgo } }),
        Transaction.aggregate([
          { $match: { buyer: userId, status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ])
      ]);

      stats = {
        totalPurchases: purchases,
        monthlySpent: spent[0]?.total || 0,
        pendingOrders: await Transaction.countDocuments({ buyer: userId, status: { $in: ['pending', 'confirmed'] } })
      };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/sales-chart', protect, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const salesData = await Transaction.aggregate([
      {
        $match: {
          seller: req.user._id,
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: 1 },
          revenue: { $sum: '$sellerAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(salesData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/top-products', protect, async (req, res) => {
  try {
    const topProducts = await Transaction.aggregate([
      { $match: { seller: req.user._id, status: 'completed' } },
      {
        $group: {
          _id: '$product',
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$sellerAmount' },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/market-trends', async (req, res) => {
  try {
    const { region, category } = req.query;
    const query = {};
    if (region) query.region = region;
    if (category) query.category = category;

    const trends = await MarketPrice.aggregate([
      { $match: query },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$product',
          latestPrice: { $first: '$currentPrice' },
          previousPrice: { $last: '$currentPrice' },
          trend: { $first: '$trend' },
          changePercent: { $first: '$changePercent' }
        }
      },
      { $sort: { changePercent: -1 } },
      { $limit: 20 }
    ]);

    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/platform-stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [users, products, transactions, revenue] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Transaction.countDocuments({ status: 'completed' }),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$commission' } } }
      ])
    ]);

    res.json({
      totalUsers: users,
      activeProducts: products,
      completedTransactions: transactions,
      totalCommission: revenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



