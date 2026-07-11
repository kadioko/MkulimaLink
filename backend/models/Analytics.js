/**
 * Analytics Models
 * Models for farm analytics, market trends, and performance tracking
 */

const mongoose = require('mongoose');

const farmAnalyticsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  farm_id: {
    type: String,
    required: true,
    index: true
  },
  metrics: {
    total_area: {
      type: Number,
      default: 0
    },
    planted_area: {
      type: Number,
      default: 0
    },
    yield_estimate: {
      type: Number,
      default: 0
    },
    revenue_estimate: {
      type: Number,
      default: 0
    },
    expenses: {
      type: Number,
      default: 0
    },
    roi: {
      type: Number,
      default: 0
    },
    health_score: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    productivity_index: {
      type: Number,
      default: 0
    }
  },
  gps_data: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    boundary: {
      type: [[Number]], // Array of [longitude, latitude] pairs
      default: []
    },
    area_sqm: {
      type: Number,
      default: 0
    },
    elevation: {
      type: Number,
      default: 0
    },
    soil_type: {
      type: String,
      enum: ['clay', 'sandy', 'loam', 'silt', 'unknown'],
      default: 'unknown'
    }
  },
  satellite_data: {
    ndvi: {
      type: Number,
      default: 0
    },
    evi: {
      type: Number,
      default: 0
    },
    cloud_cover: {
      type: Number,
      default: 0
    },
    last_updated: {
      type: Date,
      default: Date.now
    }
  },
  predictions: {
    yield_forecast: {
      type: Number,
      default: 0
    },
    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    market_price_forecast: {
      type: Number,
      default: 0
    },
    demand_forecast: {
      type: Number,
      default: 0
    },
    risk_level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  historical_data: [{
    date: {
      type: Date,
      default: Date.now
    },
    metrics: mongoose.Schema.Types.Mixed,
    events: [String]
  }],
  last_updated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
farmAnalyticsSchema.index({ user_id: 1, farm_id: 1 });
farmAnalyticsSchema.index({ 'gps_data.coordinates': '2dsphere' });
farmAnalyticsSchema.index({ last_updated: -1 });

// Virtual for current productivity percentage
farmAnalyticsSchema.virtual('productivity_percentage').get(function() {
  return this.metrics.productivity_index;
});

// Virtual for farm status
farmAnalyticsSchema.virtual('farm_status').get(function() {
  if (this.metrics.health_score >= 70) return 'healthy';
  if (this.metrics.health_score >= 40) return 'fair';
  return 'needs_attention';
});

// Method to get summary
farmAnalyticsSchema.methods.getSummary = function() {
  return {
    farm_id: this.farm_id,
    metrics: this.metrics,
    status: this.farm_status,
    risk_level: this.predictions.risk_level,
    last_updated: this.last_updated
  };
};

// Static method to get user's farms
farmAnalyticsSchema.statics.getUserFarms = async function(userId) {
  return this.find({ user_id: userId })
    .sort({ last_updated: -1 });
};

// Analytics Alert Schema
const analyticsAlertSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  farm_id: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'low_health_score',
      'negative_roi',
      'high_weather_risk',
      'pest_risk_high',
      'water_stress',
      'soil_degradation',
      'market_opportunity',
      'price_alert'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved'],
    default: 'active',
    index: true
  },
  data: mongoose.Schema.Types.Mixed,
  acknowledged_at: Date,
  resolved_at: Date,
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
analyticsAlertSchema.index({ user_id: 1, status: 1 });
analyticsAlertSchema.index({ farm_id: 1, created_at: -1 });
analyticsAlertSchema.index({ type: 1, severity: 1 });

// Method to acknowledge alert
analyticsAlertSchema.methods.acknowledge = async function() {
  this.status = 'acknowledged';
  this.acknowledged_at = new Date();
  return this.save();
};

// Method to resolve alert
analyticsAlertSchema.methods.resolve = async function() {
  this.status = 'resolved';
  this.resolved_at = new Date();
  return this.save();
};

// Market Trends Schema
const marketTrendsSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true,
    index: true
  },
  crop: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  average_price: {
    type: Number,
    required: true
  },
  min_price: {
    type: Number,
    required: true
  },
  max_price: {
    type: Number,
    required: true
  },
  transaction_count: {
    type: Number,
    default: 0
  },
  trend: {
    type: String,
    enum: ['increasing', 'decreasing', 'stable'],
    default: 'stable'
  },
  demand_level: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  seasonal_factor: {
    type: Number,
    default: 1.0
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
marketTrendsSchema.index({ region: 1, crop: 1, date: -1 });
marketTrendsSchema.index({ date: -1 });
marketTrendsSchema.index({ trend: 1, demand_level: 1 });

// Performance Report Schema
const performanceReportSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  farm_id: {
    type: String,
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  metrics: {
    total_revenue: Number,
    total_expenses: Number,
    net_profit: Number,
    roi: Number,
    yield_actual: Number,
    yield_expected: Number,
    productivity_index: Number,
    health_score: Number
  },
  comparisons: {
    previous_period: mongoose.Schema.Types.Mixed,
    year_over_year: mongoose.Schema.Types.Mixed,
    benchmark: mongoose.Schema.Types.Mixed
  },
  recommendations: [String],
  generated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
performanceReportSchema.index({ user_id: 1, farm_id: 1, period: 1 });
performanceReportSchema.index({ start_date: 1, end_date: 1 });

// Models
const FarmAnalytics = mongoose.model('FarmAnalytics', farmAnalyticsSchema);
const AnalyticsAlert = mongoose.model('AnalyticsAlert', analyticsAlertSchema);
const MarketTrends = mongoose.model('MarketTrends', marketTrendsSchema);
const PerformanceReport = mongoose.model('PerformanceReport', performanceReportSchema);

module.exports = {
  FarmAnalytics,
  AnalyticsAlert,
  MarketTrends,
  PerformanceReport
};



