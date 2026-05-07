const mongoose = require('mongoose');

const pricePointSchema = new mongoose.Schema({
  price: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['listing', 'sale', 'market', 'auction'],
    default: 'listing'
  }
}, { _id: false });

const priceHistorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  region: String,
  country: { type: String, default: 'TZ' },
  history: [pricePointSchema],
  statistics: {
    averagePrice: Number,
    minPrice: Number,
    maxPrice: Number,
    volatility: Number,
    trend: {
      type: String,
      enum: ['up', 'down', 'stable'],
      default: 'stable'
    },
    lastCalculated: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
priceHistorySchema.index({ product: 1, 'history.timestamp': -1 });
priceHistorySchema.index({ category: 1, region: 1, 'history.timestamp': -1 });
priceHistorySchema.index({ country: 1 });

// Method to add price point
priceHistorySchema.methods.addPricePoint = async function(price, volume = 0, source = 'listing') {
  this.history.push({
    price,
    volume,
    source,
    timestamp: new Date()
  });
  
  // Keep only last 90 days of daily data for efficiency
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  this.history = this.history.filter(h => h.timestamp >= cutoffDate);
  
  await this.calculateStatistics();
  return await this.save();
};

// Calculate statistics
priceHistorySchema.methods.calculateStatistics = function() {
  if (this.history.length === 0) return;
  
  const prices = this.history.map(h => h.price);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  // Calculate volatility (standard deviation)
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length;
  const volatility = Math.sqrt(variance);
  
  // Determine trend
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const change = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  let trend = 'stable';
  if (change > 5) trend = 'up';
  else if (change < -5) trend = 'down';
  
  this.statistics = {
    averagePrice: Math.round(avg),
    minPrice: min,
    maxPrice: max,
    volatility: Math.round(volatility),
    trend,
    lastCalculated: new Date()
  };
};

// Static method to get price history for a product
priceHistorySchema.statics.getHistory = async function(productId, days = 30) {
  const history = await this.findOne({ product: productId });
  if (!history) return null;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return {
    ...history.toObject(),
    history: history.history.filter(h => h.timestamp >= cutoffDate)
  };
};

// Get market trends for a category
priceHistorySchema.statics.getMarketTrends = async function(category, region, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const histories = await this.find({
    category,
    region,
    'history.timestamp': { $gte: cutoffDate }
  });
  
  const allPrices = histories.flatMap(h => h.history.map(p => p.price));
  
  if (allPrices.length === 0) return null;
  
  const avg = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
  
  return {
    category,
    region,
    averagePrice: Math.round(avg),
    minPrice: Math.min(...allPrices),
    maxPrice: Math.max(...allPrices),
    sampleCount: allPrices.length,
    period: days
  };
};

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
