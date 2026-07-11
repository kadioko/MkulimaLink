/**
 * Subscription Routes
 * Handles premium subscription management and billing
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const subscriptionService = require('../services/subscriptionService');
const { Subscription, Invoice, DiscountCode } = require('../models/Subscription');

// Apply authentication middleware
router.use(protect);

// Get current subscription
router.get('/current', async (req, res) => {
  try {
    const subscription = await subscriptionService.getCurrentSubscription(req.user._id);
    const details = await subscriptionService.getSubscriptionDetails(req.user._id);

    res.json({
      success: true,
      data: {
        ...subscription.toObject(),
        ...details
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

// Get available plans
router.get('/plans', async (req, res) => {
  try {
    const plans = subscriptionService.getAvailablePlans();

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plans',
      error: error.message
    });
  }
});

// Upgrade subscription
router.post('/upgrade', async (req, res) => {
  try {
    const { plan_id, payment_method } = req.body;

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    const subscription = await subscriptionService.upgradeSubscription(
      req.user._id,
      plan_id,
      payment_method || 'mpesa'
    );

    res.json({
      success: true,
      message: 'Subscription upgraded successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade subscription',
      error: error.message
    });
  }
});

// Cancel subscription
router.post('/cancel', async (req, res) => {
  try {
    const { reason } = req.body;

    const subscription = await subscriptionService.cancelSubscription(
      req.user._id,
      reason
    );

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

// Renew subscription
router.post('/renew', async (req, res) => {
  try {
    const subscription = await subscriptionService.renewSubscription(req.user._id);

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Renew subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew subscription',
      error: error.message
    });
  }
});

// Check feature access
router.get('/features/:feature', async (req, res) => {
  try {
    const hasFeature = await subscriptionService.hasFeature(
      req.user._id,
      req.params.feature
    );

    res.json({
      success: true,
      data: {
        feature: req.params.feature,
        has_access: hasFeature
      }
    });
  } catch (error) {
    console.error('Check feature error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check feature access',
      error: error.message
    });
  }
});

// Get billing history
router.get('/billing-history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await subscriptionService.getBillingHistory(
      req.user._id,
      page,
      limit
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing history',
      error: error.message
    });
  }
});

// Get invoice details
router.get('/invoices/:invoiceId', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.invoiceId,
      user_id: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...invoice.toObject(),
        invoice_number: invoice.invoice_number,
        is_overdue: invoice.is_overdue
      }
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message
    });
  }
});

// Apply discount code
router.post('/apply-discount', async (req, res) => {
  try {
    const { discount_code } = req.body;

    if (!discount_code) {
      return res.status(400).json({
        success: false,
        message: 'Discount code is required'
      });
    }

    const discountInfo = await subscriptionService.applyDiscount(
      req.user._id,
      discount_code
    );

    res.json({
      success: true,
      message: 'Discount applied successfully',
      data: discountInfo
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

// Get pending invoices
router.get('/pending-invoices', async (req, res) => {
  try {
    const invoices = await Invoice.getPending(req.user._id);

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Get pending invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending invoices',
      error: error.message
    });
  }
});

// Pause subscription
router.post('/pause', async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user_id: req.user._id,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    await subscription.pause();

    res.json({
      success: true,
      message: 'Subscription paused successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Pause subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause subscription',
      error: error.message
    });
  }
});

// Resume subscription
router.post('/resume', async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user_id: req.user._id,
      status: 'paused'
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No paused subscription found'
      });
    }

    await subscription.resume();

    res.json({
      success: true,
      message: 'Subscription resumed successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Resume subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume subscription',
      error: error.message
    });
  }
});

// Admin routes
router.use('/admin', protect);

// Get all subscriptions (admin)
router.get('/admin/all', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    let filter = {};
    if (status) filter.status = status;

    const subscriptions = await Subscription.find(filter)
      .populate('user_id', 'name email phone')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Subscription.countDocuments(filter);

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message
    });
  }
});

// Get overdue invoices (admin)
router.get('/admin/overdue-invoices', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const invoices = await Invoice.getOverdue();

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Admin get overdue invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue invoices',
      error: error.message
    });
  }
});

// Get revenue analytics (admin)
router.get('/admin/revenue-analytics', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get revenue data
    const paidInvoices = await Invoice.find({
      status: 'paid',
      paid_at: { $gte: thirtyDaysAgo }
    });

    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const avgRevenue = totalRevenue / 30;

    // Get subscription breakdown
    const subscriptionStats = await Subscription.aggregate([
      {
        $group: {
          _id: '$plan_id',
          count: { $sum: 1 },
          total_revenue: { $sum: '$price' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total_revenue: totalRevenue,
        avg_daily_revenue: avgRevenue,
        period: '30 days',
        subscription_breakdown: subscriptionStats
      }
    });
  } catch (error) {
    console.error('Admin get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message
    });
  }
});

module.exports = router;



