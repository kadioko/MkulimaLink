/**
 * Subscription Service
 * Manages premium subscription tiers and billing
 */

const { User } = require('../models');
const { Subscription, Invoice } = require('../models/Subscription');
const mpesaService = require('./mpesaService');
const airtelMoneyService = require('./airtelMoneyService');

class SubscriptionService {
  constructor() {
    this.plans = {
      free: {
        id: 'free',
        name: 'Free',
        price: 0,
        period: 'month',
        features: [
          'basic_metrics',
          'manual_data_entry',
          'basic_alerts'
        ]
      },
      premium: {
        id: 'premium',
        name: 'Premium',
        price: 20000,
        period: 'month',
        features: [
          'basic_metrics',
          'manual_data_entry',
          'basic_alerts',
          'gps_mapping',
          'satellite_data',
          'yield_predictions',
          'price_forecasting',
          'market_intelligence',
          'competitor_benchmarking',
          'advanced_recommendations',
          'data_export_csv_json',
          'priority_support'
        ]
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: null, // Custom pricing
        period: 'month',
        features: [
          'basic_metrics',
          'manual_data_entry',
          'basic_alerts',
          'gps_mapping',
          'satellite_data',
          'yield_predictions',
          'price_forecasting',
          'market_intelligence',
          'competitor_benchmarking',
          'advanced_recommendations',
          'data_export_csv_json_pdf',
          'priority_support',
          'api_access',
          'custom_integrations'
        ]
      }
    };

    this.discounts = {
      annual: 0.17, // 2 months free (17% discount)
      referral: 0.10, // 10% referral discount
      nonprofit: 0.50 // 50% for nonprofits
    };
  }

  /**
   * Get user's current subscription
   */
  async getCurrentSubscription(userId) {
    try {
      let subscription = await Subscription.findOne({
        user_id: userId,
        status: 'active'
      });

      if (!subscription) {
        // Create free subscription if doesn't exist
        subscription = new Subscription({
          user_id: userId,
          plan_id: 'free',
          status: 'active',
          started_at: new Date(),
          expires_at: null, // Free plan never expires
          auto_renew: false
        });
        await subscription.save();
      }

      return subscription;
    } catch (error) {
      console.error('Get current subscription error:', error);
      throw error;
    }
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(userId, planId, paymentMethod = 'mpesa') {
    try {
      const plan = this.plans[planId];
      if (!plan) {
        throw new Error('Invalid plan');
      }

      // Get current subscription
      const currentSubscription = await this.getCurrentSubscription(userId);

      // If upgrading from free, process payment
      if (currentSubscription.plan_id === 'free' && plan.price > 0) {
        // Process payment
        const paymentResult = await this.processPayment(userId, plan, paymentMethod);

        if (!paymentResult.success) {
          throw new Error('Payment failed');
        }

        // Cancel old subscription
        currentSubscription.status = 'cancelled';
        currentSubscription.cancelled_at = new Date();
        await currentSubscription.save();

        // Create new subscription
        const newSubscription = new Subscription({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          billing_cycle: 'monthly',
          price: plan.price,
          features: plan.features,
          auto_renew: true,
          started_at: new Date(),
          expires_at: this.calculateExpiryDate('monthly'),
          payment_method: paymentMethod,
          invoice_id: paymentResult.invoice_id
        });

        await newSubscription.save();

        // Update user
        const user = await User.findById(userId);
        user.subscription_tier = planId;
        user.subscription_id = newSubscription._id;
        await user.save();

        return newSubscription;
      }

      return currentSubscription;
    } catch (error) {
      console.error('Upgrade subscription error:', error);
      throw error;
    }
  }

  /**
   * Process subscription payment
   */
  async processPayment(userId, plan, paymentMethod) {
    try {
      const user = await User.findById(userId);

      // Create invoice
      const invoice = new Invoice({
        user_id: userId,
        plan_id: plan.id,
        amount: plan.price,
        currency: 'TZS',
        status: 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        items: [{
          description: `${plan.name} Subscription (Monthly)`,
          quantity: 1,
          unit_price: plan.price,
          total: plan.price
        }]
      });

      await invoice.save();

      // Process payment based on method
      let paymentResult;

      if (paymentMethod === 'mpesa') {
        paymentResult = await mpesaService.initiateSTKPush(
          user.phone,
          plan.price,
          `MkulimaLink ${plan.name} Subscription`,
          invoice._id.toString()
        );
      } else if (paymentMethod === 'airtel') {
        paymentResult = await airtelMoneyService.initiateCollection(
          user.phone,
          plan.price,
          `MkulimaLink ${plan.name} Subscription`,
          invoice._id.toString()
        );
      } else {
        throw new Error('Unsupported payment method');
      }

      if (paymentResult.success) {
        invoice.status = 'paid';
        invoice.paid_at = new Date();
        invoice.payment_reference = paymentResult.transaction_id;
        await invoice.save();

        return {
          success: true,
          invoice_id: invoice._id,
          transaction_id: paymentResult.transaction_id
        };
      }

      return {
        success: false,
        error: 'Payment initiation failed'
      };
    } catch (error) {
      console.error('Process payment error:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId, reason = null) {
    try {
      const subscription = await Subscription.findOne({
        user_id: userId,
        status: 'active'
      });

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      subscription.status = 'cancelled';
      subscription.cancelled_at = new Date();
      subscription.cancellation_reason = reason;
      subscription.auto_renew = false;

      await subscription.save();

      // Revert to free plan
      const user = await User.findById(userId);
      user.subscription_tier = 'free';
      await user.save();

      return subscription;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }

  /**
   * Check subscription features
   */
  async hasFeature(userId, feature) {
    try {
      const subscription = await this.getCurrentSubscription(userId);
      const plan = this.plans[subscription.plan_id];

      return plan.features.includes(feature);
    } catch (error) {
      console.error('Check feature error:', error);
      return false;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscriptionDetails(userId) {
    try {
      const subscription = await this.getCurrentSubscription(userId);
      const plan = this.plans[subscription.plan_id];

      return {
        plan_id: subscription.plan_id,
        plan_name: plan.name,
        price: plan.price,
        period: plan.period,
        status: subscription.status,
        started_at: subscription.started_at,
        expires_at: subscription.expires_at,
        auto_renew: subscription.auto_renew,
        features: plan.features,
        days_remaining: subscription.expires_at ? 
          Math.ceil((subscription.expires_at - new Date()) / (1000 * 60 * 60 * 24)) : 
          null
      };
    } catch (error) {
      console.error('Get subscription details error:', error);
      throw error;
    }
  }

  /**
   * Renew subscription
   */
  async renewSubscription(userId) {
    try {
      const subscription = await this.getCurrentSubscription(userId);
      const plan = this.plans[subscription.plan_id];

      if (plan.price === 0) {
        // Free plan, just extend expiry
        subscription.expires_at = this.calculateExpiryDate('monthly');
        await subscription.save();
        return subscription;
      }

      // Process payment for renewal
      const paymentResult = await this.processPayment(userId, plan, subscription.payment_method);

      if (paymentResult.success) {
        subscription.expires_at = this.calculateExpiryDate('monthly');
        subscription.invoice_id = paymentResult.invoice_id;
        await subscription.save();

        return subscription;
      }

      throw new Error('Renewal payment failed');
    } catch (error) {
      console.error('Renew subscription error:', error);
      throw error;
    }
  }

  /**
   * Get billing history
   */
  async getBillingHistory(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const invoices = await Invoice.find({ user_id: userId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Invoice.countDocuments({ user_id: userId });

      return {
        invoices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get billing history error:', error);
      throw error;
    }
  }

  /**
   * Apply discount code
   */
  async applyDiscount(userId, discountCode) {
    try {
      const subscription = await this.getCurrentSubscription(userId);
      const plan = this.plans[subscription.plan_id];

      if (plan.price === 0) {
        throw new Error('Cannot apply discount to free plan');
      }

      let discountRate = 0;

      if (discountCode === 'ANNUAL') {
        discountRate = this.discounts.annual;
      } else if (discountCode.startsWith('REFER_')) {
        discountRate = this.discounts.referral;
      } else if (discountCode === 'NONPROFIT') {
        discountRate = this.discounts.nonprofit;
      } else {
        throw new Error('Invalid discount code');
      }

      const discountAmount = plan.price * discountRate;
      const finalPrice = plan.price - discountAmount;

      return {
        original_price: plan.price,
        discount_rate: discountRate * 100,
        discount_amount: discountAmount,
        final_price: finalPrice
      };
    } catch (error) {
      console.error('Apply discount error:', error);
      throw error;
    }
  }

  /**
   * Get available plans
   */
  getAvailablePlans() {
    return Object.values(this.plans).map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      period: plan.period,
      features: plan.features.length
    }));
  }

  // Helper methods

  calculateExpiryDate(period) {
    const date = new Date();
    if (period === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else if (period === 'annual') {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date;
  }
}

module.exports = new SubscriptionService();



