const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: String,
    required: true
  },
  category: String,
  region: String,
  market: String,
  condition: {
    type: {
      type: String,
      enum: ['below', 'above', 'change'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    percentage: Number
  },
  currentPrice: Number,
  lastCheckedPrice: Number,
  status: {
    type: String,
    enum: ['active', 'triggered', 'paused', 'expired'],
    default: 'active'
  },
  notifications: {
    sms: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    }
  },
  frequency: {
    type: String,
    enum: ['instant', 'daily', 'weekly'],
    default: 'instant'
  },
  triggerHistory: [{
    price: Number,
    triggeredAt: Date,
    notificationSent: Boolean
  }],
  expiresAt: Date,
  notes: String
}, {
  timestamps: true
});

priceAlertSchema.index({ user: 1, status: 1 });
priceAlertSchema.index({ product: 1, region: 1 });
priceAlertSchema.index({ status: 1, 'condition.type': 1 });

priceAlertSchema.methods.checkTrigger = function(currentPrice) {
  let triggered = false;
  
  switch (this.condition.type) {
    case 'below':
      triggered = currentPrice <= this.condition.value;
      break;
    case 'above':
      triggered = currentPrice >= this.condition.value;
      break;
    case 'change':
      if (this.lastCheckedPrice) {
        const changePercent = Math.abs((currentPrice - this.lastCheckedPrice) / this.lastCheckedPrice) * 100;
        triggered = changePercent >= this.condition.percentage;
      }
      break;
  }
  
  if (triggered) {
    this.triggerHistory.push({
      price: currentPrice,
      triggeredAt: new Date(),
      notificationSent: false
    });
    this.status = 'triggered';
  }
  
  this.currentPrice = currentPrice;
  this.lastCheckedPrice = currentPrice;
  
  return triggered;
};

const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    default: 'My Watchlist'
  },
  items: [{
    type: {
      type: String,
      enum: ['product', 'seller', 'category', 'market'],
      required: true
    },
    referenceId: mongoose.Schema.Types.ObjectId,
    name: String,
    category: String,
    region: String,
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: String,
    priceHistory: [{
      price: Number,
      date: Date
    }],
    alerts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PriceAlert'
    }]
  }],
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

watchlistSchema.index({ user: 1 });

const PriceAlert = mongoose.model('PriceAlert', priceAlertSchema);
const Watchlist = mongoose.model('Watchlist', watchlistSchema);

module.exports = { PriceAlert, Watchlist };



