/**
 * Monetization Service
 * Manages premium subscriptions, advertising, and revenue optimization
 */

const { PremiumSubscription, AdvertisingCampaign, DataProduct, Revenue } = require('../models/Monetization');
const { User } = require('../models');

class MonetizationService {
  constructor() {
    this.premiumTiers = {
      farmer_premium: {
        id: 'farmer_premium',
        name: 'Farmer Premium',
        price: 10000,
        period: 'month',
        features: [
          'advanced_analytics',
          'priority_support',
          'exclusive_deals',
          'expert_consultations_discount',
          'course_access',
          'data_export'
        ],
        description: 'Perfect for serious farmers'
      },
      business_premium: {
        id: 'business_premium',
        name: 'Business Premium',
        price: 50000,
        period: 'month',
        features: [
          'all_farmer_features',
          'api_access',
          'bulk_operations',
          'dedicated_support',
          'custom_reports',
          'team_management',
          'advanced_analytics'
        ],
        description: 'For agricultural businesses'
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: null,
        period: 'month',
        features: [
          'all_business_features',
          'custom_integration',
          'white_label',
          'sla_guarantee',
          'dedicated_account_manager',
          'priority_development'
        ],
        description: 'Custom enterprise solutions'
      }
    };

    this.adFormats = ['banner', 'featured_listing', 'sponsored_search', 'category_sponsor', 'regional'];
    this.dataProductCategories = ['market_reports', 'price_trends', 'demand_forecasts', 'competitor_analysis', 'regional_insights'];
  }

  /**
   * Create premium subscription
   */
  async createSubscription(userId, tierId, paymentMethod = 'mpesa') {
    try {
      const tier = this.premiumTiers[tierId];
      if (!tier) {
        throw new Error('Invalid subscription tier');
      }

      // Cancel existing subscription
      await PremiumSubscription.updateMany(
        { user_id: userId, status: 'active' },
        { status: 'cancelled', cancelled_at: new Date() }
      );

      const subscription = new PremiumSubscription({
        user_id: userId,
        tier_id: tierId,
        tier_name: tier.name,
        price: tier.price,
        period: tier.period,
        features: tier.features,
        payment_method: paymentMethod,
        status: 'active',
        started_at: new Date(),
        expires_at: this.calculateExpiryDate(tier.period),
        auto_renew: true
      });

      await subscription.save();

      // Update user subscription
      const user = await User.findById(userId);
      user.subscription_tier = tierId;
      user.subscription_id = subscription._id;
      await user.save();

      // Log revenue
      await this.logRevenue(userId, 'subscription', tier.price, tierId);

      return subscription;
    } catch (error) {
      console.error('Create subscription error:', error);
      throw error;
    }
  }

  /**
   * Check feature access
   */
  async hasFeatureAccess(userId, feature) {
    try {
      const subscription = await PremiumSubscription.findOne({
        user_id: userId,
        status: 'active',
        expires_at: { $gt: new Date() }
      });

      if (!subscription) {
        return false;
      }

      return subscription.features.includes(feature);
    } catch (error) {
      console.error('Check feature access error:', error);
      return false;
    }
  }

  /**
   * Create advertising campaign
   */
  async createAdCampaign(advertiserId, campaignData) {
    try {
      const { campaign_name, ad_type, budget, daily_budget, targeting, duration_days } = campaignData;

      if (!this.adFormats.includes(ad_type)) {
        throw new Error('Invalid ad type');
      }

      const campaign = new AdvertisingCampaign({
        advertiser_id: advertiserId,
        campaign_name,
        ad_type,
        budget,
        daily_budget: daily_budget || budget / duration_days,
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        targeting: targeting || {},
        status: 'active',
        started_at: new Date(),
        expires_at: new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000)
      });

      await campaign.save();

      // Log revenue
      await this.logRevenue(advertiserId, 'advertising', budget, ad_type);

      return campaign;
    } catch (error) {
      console.error('Create ad campaign error:', error);
      throw error;
    }
  }

  /**
   * Get ad campaign analytics
   */
  async getAdAnalytics(campaignId) {
    try {
      const campaign = await AdvertisingCampaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
      const cpc = campaign.clicks > 0 ? campaign.spent / campaign.clicks : 0;
      const conversionRate = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0;
      const roi = campaign.conversions > 0 ? ((campaign.conversions * 100 - campaign.spent) / campaign.spent) * 100 : 0;

      return {
        campaign_id: campaign._id,
        campaign_name: campaign.campaign_name,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        conversions: campaign.conversions,
        spent: campaign.spent,
        budget: campaign.budget,
        ctr: ctr.toFixed(2),
        cpc: cpc.toFixed(2),
        conversion_rate: conversionRate.toFixed(2),
        roi: roi.toFixed(2),
        status: campaign.status
      };
    } catch (error) {
      console.error('Get ad analytics error:', error);
      throw error;
    }
  }

  /**
   * Create data product
   */
  async createDataProduct(creatorId, productData) {
    try {
      const { title, description, category, price, data_type, access_level } = productData;

      if (!this.dataProductCategories.includes(category)) {
        throw new Error('Invalid data category');
      }

      const product = new DataProduct({
        title,
        description,
        creator_id: creatorId,
        category,
        price,
        data_type: data_type || 'report',
        access_level: access_level || 'premium',
        status: 'active',
        downloads: 0,
        rating: 0,
        reviews_count: 0
      });

      await product.save();

      return product;
    } catch (error) {
      console.error('Create data product error:', error);
      throw error;
    }
  }

  /**
   * Purchase data product
   */
  async purchaseDataProduct(userId, productId) {
    try {
      const product = await DataProduct.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Check if already purchased
      const existingPurchase = await DataProduct.findOne({
        _id: productId,
        'purchases.user_id': userId
      });

      if (existingPurchase) {
        throw new Error('Already purchased this product');
      }

      // Add purchase
      product.purchases.push({
        user_id: userId,
        purchased_at: new Date(),
        price: product.price
      });

      product.sales_count = (product.sales_count || 0) + 1;
      await product.save();

      // Log revenue
      await this.logRevenue(userId, 'data_product', product.price, productId.toString());

      return product;
    } catch (error) {
      console.error('Purchase data product error:', error);
      throw error;
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(userId, period = '30d') {
    try {
      let startDate = new Date();
      if (period === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
      else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
      else if (period === '1y') startDate.setFullYear(startDate.getFullYear() - 1);

      const revenues = await Revenue.find({
        user_id: userId,
        created_at: { $gte: startDate }
      }).sort({ created_at: -1 });

      const byType = {};
      let totalRevenue = 0;

      for (const revenue of revenues) {
        byType[revenue.revenue_type] = (byType[revenue.revenue_type] || 0) + revenue.amount;
        totalRevenue += revenue.amount;
      }

      return {
        total_revenue: totalRevenue,
        period,
        by_type: byType,
        transaction_count: revenues.length,
        average_transaction: totalRevenue / (revenues.length || 1)
      };
    } catch (error) {
      console.error('Get revenue analytics error:', error);
      throw error;
    }
  }

  /**
   * Get platform revenue
   */
  async getPlatformRevenue(period = '30d') {
    try {
      let startDate = new Date();
      if (period === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
      else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
      else if (period === '1y') startDate.setFullYear(startDate.getFullYear() - 1);

      const revenues = await Revenue.find({
        created_at: { $gte: startDate }
      });

      const byType = {};
      let totalRevenue = 0;

      for (const revenue of revenues) {
        byType[revenue.revenue_type] = (byType[revenue.revenue_type] || 0) + revenue.amount;
        totalRevenue += revenue.amount;
      }

      // Calculate daily average
      const days = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
      const dailyAverage = totalRevenue / days;

      return {
        total_revenue: totalRevenue,
        period,
        by_type: byType,
        daily_average: dailyAverage,
        transaction_count: revenues.length,
        active_subscriptions: await PremiumSubscription.countDocuments({ status: 'active' }),
        active_campaigns: await AdvertisingCampaign.countDocuments({ status: 'active' })
      };
    } catch (error) {
      console.error('Get platform revenue error:', error);
      throw error;
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics() {
    try {
      const subscriptions = await PremiumSubscription.aggregate([
        {
          $group: {
            _id: '$tier_id',
            count: { $sum: 1 },
            total_revenue: { $sum: '$price' }
          }
        }
      ]);

      const activeSubscriptions = await PremiumSubscription.countDocuments({ status: 'active' });
      const churnedSubscriptions = await PremiumSubscription.countDocuments({ status: 'cancelled' });

      return {
        active_subscriptions: activeSubscriptions,
        churned_subscriptions: churnedSubscriptions,
        by_tier: subscriptions,
        churn_rate: churnedSubscriptions / (activeSubscriptions + churnedSubscriptions) || 0
      };
    } catch (error) {
      console.error('Get subscription analytics error:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId, reason = null) {
    try {
      const subscription = await PremiumSubscription.findOne({
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

      // Revert user to free tier
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
   * Apply discount code
   */
  async applyDiscountCode(userId, code) {
    try {
      const discounts = {
        'ANNUAL2024': { type: 'percentage', value: 17 }, // 2 months free
        'REFER10': { type: 'percentage', value: 10 },
        'NONPROFIT50': { type: 'percentage', value: 50 }
      };

      const discount = discounts[code];
      if (!discount) {
        throw new Error('Invalid discount code');
      }

      return discount;
    } catch (error) {
      console.error('Apply discount code error:', error);
      throw error;
    }
  }

  /**
   * Get top data products
   */
  async getTopDataProducts(limit = 10) {
    try {
      const products = await DataProduct.find({ status: 'active' })
        .populate('creator_id', 'name avatar')
        .sort({ sales_count: -1, rating: -1 })
        .limit(limit);

      return products;
    } catch (error) {
      console.error('Get top data products error:', error);
      throw error;
    }
  }

  /**
   * Search data products
   */
  async searchDataProducts(query, category = null, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      let filter = {
        status: 'active',
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      };

      if (category) {
        filter.category = category;
      }

      const products = await DataProduct.find(filter)
        .populate('creator_id', 'name avatar')
        .sort({ sales_count: -1 })
        .skip(skip)
        .limit(limit);

      const total = await DataProduct.countDocuments(filter);

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Search data products error:', error);
      throw error;
    }
  }

  // Helper methods

  calculateExpiryDate(period) {
    const date = new Date();
    if (period === 'month') {
      date.setMonth(date.getMonth() + 1);
    } else if (period === 'year') {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date;
  }

  async logRevenue(userId, revenueType, amount, reference) {
    try {
      const revenue = new Revenue({
        user_id: userId,
        revenue_type: revenueType,
        amount,
        reference,
        created_at: new Date()
      });

      await revenue.save();
    } catch (error) {
      console.error('Log revenue error:', error);
    }
  }

  getPremiumTiers() {
    return Object.values(this.premiumTiers).map(tier => ({
      id: tier.id,
      name: tier.name,
      price: tier.price,
      period: tier.period,
      features: tier.features.length,
      description: tier.description
    }));
  }

  getAdFormats() {
    return this.adFormats;
  }

  getDataCategories() {
    return this.dataProductCategories;
  }
}

module.exports = new MonetizationService();



