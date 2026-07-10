const mongoose = require('mongoose');
const { CATEGORIES, UNITS } = require('../config/marketplaceMeta');
const { getCategoryExpiryDate } = require('../services/marketplaceIntelligence');

const productSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: CATEGORIES
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: UNITS
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  images: [{
    url: String,
    pestDetection: {
      detected: Boolean,
      confidence: Number,
      pestType: String,
      recommendations: [String]
    }
  }],
  location: {
    region: String,
    district: String,
    ward: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  harvestDate: {
    type: Date
  },
  quality: {
    type: String,
    enum: ['premium', 'standard', 'economy'],
    default: 'standard'
  },
  organic: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'reserved', 'sold', 'expired'],
    default: 'active'
  },
  expiresAt: {
    type: Date
  },
  availability: {
    days: [String],
    hours: String,
    notes: String
  },
  fulfillment: {
    pickup: {
      type: Boolean,
      default: true
    },
    delivery: {
      type: Boolean,
      default: false
    },
    deliveryRadiusKm: Number,
    deliveryFee: Number
  },
  risk: {
    score: {
      type: Number,
      default: 0
    },
    flag: {
      type: String,
      enum: ['low', 'medium', 'high', 'blocked'],
      default: 'low'
    },
    reasons: [String],
    assessedAt: Date
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  aiInsights: {
    marketDemand: String,
    priceRecommendation: Number,
    bestTimeToSell: Date,
    competitorAnalysis: String,
    farmerInsights: [String]
  }
}, {
  timestamps: true
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ 'location.region': 1, 'location.district': 1 });
productSchema.index({ 'location.region': 1, category: 1, status: 1 });
productSchema.index({ category: 1, 'location.region': 1 });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ organic: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ status: 1, expiresAt: 1 });

productSchema.pre('save', function setDefaultExpiry() {
  if (!this.expiresAt && this.status === 'active') {
    this.expiresAt = getCategoryExpiryDate(this.category);
  }
});

productSchema.statics.expireOldListings = function expireOldListings(now = new Date()) {
  return this.updateMany(
    { status: 'active', expiresAt: { $lte: now } },
    { $set: { status: 'expired' } }
  );
};

module.exports = mongoose.model('Product', productSchema);
