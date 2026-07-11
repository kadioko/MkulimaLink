/**
 * Monetization Models
 * Models for premium subscriptions, advertising, and data marketplace
 */

const mongoose = require('mongoose');

const premiumSubscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tier_id: {
    type: String,
    enum: ['farmer_premium', 'business_premium', 'enterprise'],
    required: true
  },
  tier_name: String,
  price: Number,
  period: {
    type: String,
    enum: ['month', 'year'],
    default: 'month'
  },
  features: [String],
  payment_method: {
    type: String,
    enum: ['mpesa', 'airtel', 'bank_transfer', 'stripe'],
    default: 'mpesa'
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired'],
    default: 'active',
    index: true
  },
  started_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  expires_at: {
    type: Date,
    index: true
  },
  auto_renew: {
    type: Boolean,
    default: true
  },
  cancelled_at: Date,
  cancellation_reason: String,
  invoice_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }
}, {
  timestamps: true
});

// Indexes
premiumSubscriptionSchema.index({ user_id: 1, status: 1 });
premiumSubscriptionSchema.index({ expires_at: 1 });
premiumSubscriptionSchema.index({ tier_id: 1 });

// Virtual for days remaining
premiumSubscriptionSchema.virtual('days_remaining').get(function() {
  if (!this.expires_at) return null;
  return Math.ceil((this.expires_at - new Date()) / (1000 * 60 * 60 * 24));
});

// Virtual for is_active
premiumSubscriptionSchema.virtual('is_active').get(function() {
  return this.status === 'active' && this.expires_at > new Date();
});

// Advertising Campaign Schema
const advertisingCampaignSchema = new mongoose.Schema({
  advertiser_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  campaign_name: {
    type: String,
    required: true
  },
  ad_type: {
    type: String,
    enum: ['banner', 'featured_listing', 'sponsored_search', 'category_sponsor', 'regional'],
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  daily_budget: Number,
  spent: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  },
  targeting: {
    regions: [String],
    categories: [String],
    user_types: [String],
    demographics: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active',
    index: true
  },
  started_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  expires_at: {
    type: Date,
    index: true
  },
  creative_url: String,
  landing_url: String
}, {
  timestamps: true
});

// Indexes
advertisingCampaignSchema.index({ advertiser_id: 1, status: 1 });
advertisingCampaignSchema.index({ ad_type: 1 });
advertisingCampaignSchema.index({ expires_at: 1 });

// Virtual for CTR
advertisingCampaignSchema.virtual('ctr').get(function() {
  return this.impressions > 0 ? (this.clicks / this.impressions) * 100 : 0;
});

// Virtual for CPC
advertisingCampaignSchema.virtual('cpc').get(function() {
  return this.clicks > 0 ? this.spent / this.clicks : 0;
});

// Virtual for ROI
advertisingCampaignSchema.virtual('roi').get(function() {
  return this.conversions > 0 ? ((this.conversions * 100 - this.spent) / this.spent) * 100 : 0;
});

// Data Product Schema
const dataProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  description: String,
  creator_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['market_reports', 'price_trends', 'demand_forecasts', 'competitor_analysis', 'regional_insights'],
    required: true,
    index: true
  },
  price: {
    type: Number,
    required: true
  },
  data_type: {
    type: String,
    enum: ['report', 'dataset', 'analysis', 'forecast'],
    default: 'report'
  },
  access_level: {
    type: String,
    enum: ['free', 'premium', 'enterprise'],
    default: 'premium'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
    index: true
  },
  downloads: {
    type: Number,
    default: 0
  },
  sales_count: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews_count: {
    type: Number,
    default: 0
  },
  purchases: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    purchased_at: Date,
    price: Number
  }],
  preview_url: String,
  data_url: String,
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
dataProductSchema.index({ creator_id: 1 });
dataProductSchema.index({ category: 1, status: 1 });
dataProductSchema.index({ sales_count: -1, rating: -1 });

// Virtual for revenue
dataProductSchema.virtual('total_revenue').get(function() {
  return this.purchases.reduce((sum, p) => sum + (p.price || 0), 0);
});

// Revenue Log Schema
const revenueSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  revenue_type: {
    type: String,
    enum: ['subscription', 'advertising', 'data_product', 'transaction_fee', 'commission', 'other'],
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'TZS'
  },
  reference: String,
  description: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
revenueSchema.index({ user_id: 1, created_at: -1 });
revenueSchema.index({ revenue_type: 1, created_at: -1 });
revenueSchema.index({ created_at: -1 });

// Discount Code Schema
const discountCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true
  },
  description: String,
  discount_type: {
    type: String,
    enum: ['percentage', 'fixed_amount'],
    default: 'percentage'
  },
  discount_value: {
    type: Number,
    required: true
  },
  max_uses: Number,
  uses_count: {
    type: Number,
    default: 0
  },
  applicable_tiers: [{
    type: String,
    enum: ['farmer_premium', 'business_premium', 'enterprise']
  }],
  valid_from: {
    type: Date,
    default: Date.now
  },
  valid_until: Date,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
discountCodeSchema.index({ code: 1, status: 1 });
discountCodeSchema.index({ valid_from: 1, valid_until: 1 });

// Virtual for is_valid
discountCodeSchema.virtual('is_valid').get(function() {
  const now = new Date();
  return this.status === 'active' &&
         this.valid_from <= now &&
         (!this.valid_until || this.valid_until > now) &&
         (!this.max_uses || this.uses_count < this.max_uses);
});

// Method to apply discount
discountCodeSchema.methods.apply = async function() {
  if (!this.is_valid) {
    throw new Error('Discount code is not valid');
  }
  this.uses_count += 1;
  return this.save();
};

// Partner Revenue Schema
const partnerRevenueSchema = new mongoose.Schema({
  partner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  partner_type: {
    type: String,
    enum: ['logistics', 'insurance', 'financial', 'technology', 'supplier'],
    required: true
  },
  revenue_type: {
    type: String,
    enum: ['commission', 'revenue_share', 'referral'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  rate: Number,
  reference_id: String,
  period: {
    start_date: Date,
    end_date: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid'],
    default: 'pending'
  },
  paid_at: Date,
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
partnerRevenueSchema.index({ partner_id: 1, created_at: -1 });
partnerRevenueSchema.index({ status: 1 });
partnerRevenueSchema.index({ partner_type: 1 });

// Models
const PremiumSubscription = mongoose.model('PremiumSubscription', premiumSubscriptionSchema);
const AdvertisingCampaign = mongoose.model('AdvertisingCampaign', advertisingCampaignSchema);
const DataProduct = mongoose.model('DataProduct', dataProductSchema);
const Revenue = mongoose.model('Revenue', revenueSchema);
const DiscountCode = mongoose.model('DiscountCode', discountCodeSchema);
const PartnerRevenue = mongoose.model('PartnerRevenue', partnerRevenueSchema);

module.exports = {
  PremiumSubscription,
  AdvertisingCampaign,
  DataProduct,
  Revenue,
  DiscountCode,
  PartnerRevenue
};



