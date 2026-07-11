/**
 * Localization Models
 * Models for multi-country configuration, language support, and regional data
 */

const mongoose = require('mongoose');

const countryConfigSchema = new mongoose.Schema({
  country_code: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true
  },
  country_name: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  timezone: {
    type: String,
    required: true
  },
  languages: [{
    type: String
  }],
  payment_methods: [{
    type: String,
    enum: ['mpesa', 'airtel', 'mtn_money', 'bank_transfer', 'stripe', 'wise']
  }],
  tax_rate: {
    type: Number,
    default: 0.18
  },
  kyc_level: {
    type: String,
    enum: ['none', 'basic', 'standard', 'enhanced'],
    default: 'standard'
  },
  data_residency: {
    type: String,
    enum: ['required', 'optional', 'prohibited'],
    default: 'optional'
  },
  regulations: {
    aml_kyc: {
      type: Boolean,
      default: true
    },
    transaction_reporting: {
      type: Boolean,
      default: true
    },
    data_protection: {
      type: Boolean,
      default: true
    },
    sanctions_screening: {
      type: Boolean,
      default: false
    }
  },
  transaction_limits: {
    daily_limit: Number,
    monthly_limit: Number,
    per_transaction_limit: Number
  },
  integrations: {
    payment_gateway: String,
    sms_provider: String,
    weather_service: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
countryConfigSchema.index({ country_code: 1 });
countryConfigSchema.index({ status: 1 });

// Virtual for is_active
countryConfigSchema.virtual('is_active').get(function() {
  return this.status === 'active';
});

// Localized Content Schema
const localizedContentSchema = new mongoose.Schema({
  country_code: {
    type: String,
    required: true,
    index: true
  },
  language: {
    type: String,
    required: true,
    index: true
  },
  key: {
    type: String,
    required: true,
    index: true
  },
  value: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['ui', 'email', 'sms', 'notification', 'help', 'legal'],
    default: 'ui'
  },
  version: {
    type: Number,
    default: 1
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
localizedContentSchema.index({ country_code: 1, language: 1 });
localizedContentSchema.index({ key: 1 });
localizedContentSchema.index({ category: 1 });

// Regional Prices Schema
const regionalPricesSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'TZS'
  },
  unit: {
    type: String,
    default: 'kg'
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  source: String,
  quality_grade: {
    type: String,
    enum: ['premium', 'standard', 'economy'],
    default: 'standard'
  },
  market_name: String,
  demand_level: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes
regionalPricesSchema.index({ region: 1, crop: 1, date: -1 });
regionalPricesSchema.index({ date: -1 });

// User Localization Preferences Schema
const userLocalizationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  country_code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'en'
  },
  currency: String,
  timezone: String,
  date_format: {
    type: String,
    default: 'DD/MM/YYYY'
  },
  number_format: {
    type: String,
    default: 'comma_decimal'
  },
  measurement_unit: {
    type: String,
    enum: ['metric', 'imperial'],
    default: 'metric'
  },
  temperature_unit: {
    type: String,
    enum: ['celsius', 'fahrenheit'],
    default: 'celsius'
  },
  notifications_language: String,
  sms_language: String,
  email_language: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
userLocalizationSchema.index({ user_id: 1 });
userLocalizationSchema.index({ country_code: 1 });

// Compliance Log Schema
const complianceLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  country_code: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['kyc_verification', 'transaction', 'data_access', 'export', 'deletion'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'rejected'],
    default: 'pending'
  },
  details: mongoose.Schema.Types.Mixed,
  compliance_check: {
    aml_kyc: Boolean,
    sanctions_screening: Boolean,
    transaction_limits: Boolean,
    data_residency: Boolean
  },
  result: {
    type: String,
    enum: ['approved', 'rejected', 'flagged'],
    default: 'approved'
  },
  notes: String,
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
complianceLogSchema.index({ user_id: 1, country_code: 1 });
complianceLogSchema.index({ action: 1, status: 1 });
complianceLogSchema.index({ created_at: -1 });

// Regional Partner Schema
const regionalPartnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  country_code: {
    type: String,
    required: true,
    index: true
  },
  partner_type: {
    type: String,
    enum: ['payment', 'logistics', 'insurance', 'financial', 'technology'],
    required: true
  },
  contact_email: String,
  contact_phone: String,
  api_key: String,
  api_secret: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  commission_rate: Number,
  revenue_share: Number,
  features: [String],
  integration_status: {
    type: String,
    enum: ['not_started', 'in_progress', 'testing', 'live'],
    default: 'not_started'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
regionalPartnerSchema.index({ country_code: 1, partner_type: 1 });
regionalPartnerSchema.index({ status: 1 });

// Models
const CountryConfig = mongoose.model('CountryConfig', countryConfigSchema);
const LocalizedContent = mongoose.model('LocalizedContent', localizedContentSchema);
const RegionalPrices = mongoose.model('RegionalPrices', regionalPricesSchema);
const UserLocalization = mongoose.model('UserLocalization', userLocalizationSchema);
const ComplianceLog = mongoose.model('ComplianceLog', complianceLogSchema);
const RegionalPartner = mongoose.model('RegionalPartner', regionalPartnerSchema);

module.exports = {
  CountryConfig,
  LocalizedContent,
  RegionalPrices,
  UserLocalization,
  ComplianceLog,
  RegionalPartner
};



