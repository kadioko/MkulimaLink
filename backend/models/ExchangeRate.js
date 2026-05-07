const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  baseCurrency: {
    type: String,
    required: true,
    enum: ['TZS', 'KES', 'USD', 'EUR', 'GBP']
  },
  targetCurrency: {
    type: String,
    required: true,
    enum: ['TZS', 'KES', 'USD', 'EUR', 'GBP']
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  source: {
    type: String,
    default: 'api',
    enum: ['api', 'manual', 'calculated']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  volatility: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for currency pairs
exchangeRateSchema.index({ baseCurrency: 1, targetCurrency: 1 }, { unique: true });
exchangeRateSchema.index({ lastUpdated: 1 });

// Static method to get exchange rate
exchangeRateSchema.statics.getRate = async function(from, to) {
  if (from === to) return 1;
  
  const rate = await this.findOne({
    baseCurrency: from,
    targetCurrency: to
  }).sort({ lastUpdated: -1 });
  
  return rate ? rate.rate : null;
};

// Static method to convert amount
exchangeRateSchema.statics.convert = async function(amount, from, to) {
  const rate = await this.getRate(from, to);
  if (!rate) throw new Error(`Exchange rate not found for ${from} to ${to}`);
  return amount * rate;
};

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);
