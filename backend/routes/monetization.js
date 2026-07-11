/**
 * Monetization Routes
 * Handles premium subscriptions, advertising, and data marketplace
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const monetizationService = require('../services/monetizationService');
const { PremiumSubscription, AdvertisingCampaign, DataProduct, DiscountCode } = require('../models/Monetization');

// Public routes - no authentication required
router.get('/tiers', async (req, res) => {
  try {
    const tiers = monetizationService.getPremiumTiers();
    res.json({
      success: true,
      data: tiers
    });
  } catch (error) {
    console.error('Get tiers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription tiers',
      error: error.message
    });
  }
});

router.get('/data-products/popular', async (req, res) => {
  try {
    const products = await monetizationService.getTopDataProducts(10);
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get popular data products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular data products',
      error: error.message
    });
  }
});

router.get('/data-products/search', async (req, res) => {
  try {
    const { query, category, page, limit } = req.query;
    const result = await monetizationService.searchDataProducts(
      query,
      category,
      parseInt(page) || 1,
      parseInt(limit) || 20
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Search data products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search data products',
      error: error.message
    });
  }
});

// Protected routes - authentication required
router.use(protect);

// Subscription management
router.post('/subscribe', async (req, res) => {
  try {
    const { tier_id, payment_method } = req.body;

    const subscription = await monetizationService.createSubscription(
      req.user._id,
      tier_id,
      payment_method || 'mpesa'
    );

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message
    });
  }
});

router.get('/subscription/current', async (req, res) => {
  try {
    const subscription = await PremiumSubscription.findOne({
      user_id: req.user._id,
      status: 'active'
    });

    if (!subscription) {
      return res.json({
        success: true,
        data: null,
        message: 'No active subscription'
      });
    }

    res.json({
      success: true,
      data: {
        ...subscription.toObject(),
        days_remaining: subscription.days_remaining,
        is_active: subscription.is_active
      }
    });
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription',
      error: error.message
    });
  }
});

router.post('/subscription/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const subscription = await monetizationService.cancelSubscription(req.user._id, reason);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
});

router.post('/subscription/apply-discount', async (req, res) => {
  try {
    const { code } = req.body;
    const discount = await monetizationService.applyDiscountCode(req.user._id, code);

    res.json({
      success: true,
      message: 'Discount applied successfully',
      data: discount
    });
  } catch (error) {
    console.error('Apply discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply discount',
      error: error.message
    });
  }
});

router.get('/feature-access/:feature', async (req, res) => {
  try {
    const hasAccess = await monetizationService.hasFeatureAccess(
      req.user._id,
      req.params.feature
    );

    res.json({
      success: true,
      data: {
        feature: req.params.feature,
        has_access: hasAccess
      }
    });
  } catch (error) {
    console.error('Check feature access error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check feature access',
      error: error.message
    });
  }
});

// Advertising campaigns
router.post('/campaigns', async (req, res) => {
  try {
    const campaign = await monetizationService.createAdCampaign(req.user._id, req.body);

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      error: error.message
    });
  }
});

router.get('/campaigns', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const campaigns = await AdvertisingCampaign.find({ advertiser_id: req.user._id })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AdvertisingCampaign.countDocuments({ advertiser_id: req.user._id });

    res.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message
    });
  }
});

router.get('/campaigns/:campaignId/analytics', async (req, res) => {
  try {
    const analytics = await monetizationService.getAdAnalytics(req.params.campaignId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get campaign analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign analytics',
      error: error.message
    });
  }
});

// Data marketplace
router.post('/data-products', async (req, res) => {
  try {
    const product = await monetizationService.createDataProduct(req.user._id, req.body);

    res.status(201).json({
      success: true,
      message: 'Data product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create data product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create data product',
      error: error.message
    });
  }
});

router.post('/data-products/:productId/purchase', async (req, res) => {
  try {
    const product = await monetizationService.purchaseDataProduct(
      req.user._id,
      req.params.productId
    );

    res.json({
      success: true,
      message: 'Data product purchased successfully',
      data: product
    });
  } catch (error) {
    console.error('Purchase data product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase data product',
      error: error.message
    });
  }
});

// Revenue analytics
router.get('/revenue/analytics', async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const analytics = await monetizationService.getRevenueAnalytics(req.user._id, period);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message
    });
  }
});

// Admin routes
router.use('/admin', protect);

router.get('/admin/platform-revenue', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const period = req.query.period || '30d';
    const analytics = await monetizationService.getPlatformRevenue(period);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get platform revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform revenue',
      error: error.message
    });
  }
});

router.get('/admin/subscription-analytics', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const analytics = await monetizationService.getSubscriptionAnalytics();

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get subscription analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription analytics',
      error: error.message
    });
  }
});

router.post('/admin/discount-codes', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { code, description, discount_type, discount_value, max_uses, applicable_tiers, valid_until } = req.body;

    const discountCode = new DiscountCode({
      code,
      description,
      discount_type,
      discount_value,
      max_uses,
      applicable_tiers,
      valid_until: new Date(valid_until),
      created_by: req.user._id
    });

    await discountCode.save();

    res.status(201).json({
      success: true,
      message: 'Discount code created successfully',
      data: discountCode
    });
  } catch (error) {
    console.error('Create discount code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create discount code',
      error: error.message
    });
  }
});

module.exports = router;



