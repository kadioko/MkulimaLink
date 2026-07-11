const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema({
  product: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  market: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true
  },
  price: {
    min: Number,
    max: Number,
    average: Number
  },
  unit: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    default: 'web_scraping'
  },
  trend: {
    type: String,
    enum: ['rising', 'falling', 'stable'],
    default: 'stable'
  },
  changePercentage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

marketPriceSchema.index({ product: 1, region: 1, date: -1 });
marketPriceSchema.index({ category: 1, date: -1 });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);



