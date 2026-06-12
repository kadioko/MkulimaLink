const mongoose = require('mongoose');

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
    enum: ['grains', 'legumes', 'vegetables', 'fruits', 'livestock', 'dairy', 'poultry', 'seeds', 'fertilizers', 'equipment', 'other']
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
    enum: ['kg', 'ton', 'bag', 'piece', 'liter', 'dozen', 'bundle']
  },
  quantity: {
    type: Number,
    required: true,
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
    enum: ['active', 'sold', 'reserved', 'expired'],
    default: 'active'
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
    competitorAnalysis: String
  }
}, {
  timestamps: true
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ 'location.region': 1, 'location.district': 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);
