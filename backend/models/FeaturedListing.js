const mongoose = require('mongoose');

const featuredListingSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  package: {
    type: String,
    enum: ['basic', 'premium', 'platinum'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  position: {
    type: String,
    enum: ['top', 'sidebar', 'carousel', 'category'],
    default: 'top'
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
  revenue: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'paused'],
    default: 'active'
  },
  paymentReference: {
    type: String
  }
}, {
  timestamps: true
});

featuredListingSchema.index({ product: 1, status: 1 });
featuredListingSchema.index({ endDate: 1, status: 1 });
featuredListingSchema.index({ seller: 1, createdAt: -1 });

featuredListingSchema.virtual('ctr').get(function() {
  return this.impressions > 0 ? (this.clicks / this.impressions) * 100 : 0;
});

featuredListingSchema.virtual('conversionRate').get(function() {
  return this.clicks > 0 ? (this.conversions / this.clicks) * 100 : 0;
});

module.exports = mongoose.model('FeaturedListing', featuredListingSchema);



