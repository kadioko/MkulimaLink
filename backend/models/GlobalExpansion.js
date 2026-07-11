/**
 * Global Expansion Models
 * Models for multi-region infrastructure and global operations
 */

const mongoose = require('mongoose');

const globalRegionSchema = new mongoose.Schema({
  region_code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  region_name: {
    type: String,
    required: true
  },
  countries: [String],
  timezone: String,
  languages: [String],
  currencies: [String],
  status: {
    type: String,
    enum: ['planning', 'active', 'suspended', 'closed'],
    default: 'active',
    index: true
  },
  launch_date: Date,
  regional_manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  infrastructure: {
    data_center_location: String,
    cdn_enabled: Boolean,
    backup_location: String
  },
  compliance_requirements: [String],
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
globalRegionSchema.index({ region_code: 1 });
globalRegionSchema.index({ status: 1 });

// Regional Metrics Schema
const regionalMetricsSchema = new mongoose.Schema({
  region_code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  active_users: {
    type: Number,
    default: 0
  },
  total_transactions: {
    type: Number,
    default: 0
  },
  total_revenue: {
    type: Number,
    default: 0
  },
  market_share: {
    type: Number,
    default: 0
  },
  growth_rate: Number,
  user_retention_rate: Number,
  average_transaction_value: Number,
  top_crops: [String],
  top_payment_methods: [String],
  last_updated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
regionalMetricsSchema.index({ region_code: 1 });
regionalMetricsSchema.index({ total_revenue: -1 });

// Currency Rate Schema
const currencyRateSchema = new mongoose.Schema({
  currency: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  rate: {
    type: Number,
    required: true
  },
  base_currency: {
    type: String,
    default: 'USD'
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  source: String
}, {
  timestamps: true
});

// Indexes
currencyRateSchema.index({ currency: 1 });
currencyRateSchema.index({ updated_at: -1 });

// Partnership Agreement Schema
const partnershipAgreementSchema = new mongoose.Schema({
  partner_name: {
    type: String,
    required: true
  },
  partner_type: {
    type: String,
    enum: ['logistics', 'payment', 'insurance', 'technology', 'financial', 'agricultural'],
    required: true,
    index: true
  },
  region_code: {
    type: String,
    required: true,
    index: true
  },
  contact_person: String,
  contact_email: String,
  contact_phone: String,
  commission_rate: {
    type: Number,
    required: true
  },
  payment_terms: {
    type: String,
    enum: ['monthly', 'quarterly', 'annually'],
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
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'terminated'],
    default: 'active',
    index: true
  },
  total_revenue: {
    type: Number,
    default: 0
  },
  total_commission: {
    type: Number,
    default: 0
  },
  agreement_document: String,
  terms_and_conditions: String,
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
partnershipAgreementSchema.index({ partner_type: 1, region_code: 1 });
partnershipAgreementSchema.index({ status: 1 });

// Regional Language Support Schema
const regionalLanguageSupportSchema = new mongoose.Schema({
  region_code: {
    type: String,
    required: true,
    index: true
  },
  language_code: {
    type: String,
    required: true
  },
  language_name: String,
  native_name: String,
  translation_coverage: {
    type: Number,
    min: 0,
    max: 100
  },
  native_speakers: Number,
  status: {
    type: String,
    enum: ['active', 'beta', 'planned'],
    default: 'active'
  },
  last_updated: Date
}, {
  timestamps: true
});

// Indexes
regionalLanguageSupportSchema.index({ region_code: 1, language_code: 1 });

// Regional Compliance Schema
const regionalComplianceSchema = new mongoose.Schema({
  region_code: {
    type: String,
    required: true,
    index: true
  },
  compliance_type: {
    type: String,
    enum: ['data_protection', 'financial', 'agricultural', 'labor', 'environmental'],
    required: true
  },
  requirement_name: String,
  description: String,
  status: {
    type: String,
    enum: ['compliant', 'non_compliant', 'in_progress', 'not_applicable'],
    default: 'in_progress'
  },
  last_audit_date: Date,
  next_audit_date: Date,
  audit_notes: String,
  responsible_team: String,
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
regionalComplianceSchema.index({ region_code: 1, compliance_type: 1 });
regionalComplianceSchema.index({ status: 1 });

// Regional Market Analysis Schema
const regionalMarketAnalysisSchema = new mongoose.Schema({
  region_code: {
    type: String,
    required: true,
    index: true
  },
  analysis_date: {
    type: Date,
    default: Date.now
  },
  market_size: Number,
  market_growth_rate: Number,
  competitor_count: Number,
  market_share: Number,
  key_opportunities: [String],
  key_challenges: [String],
  target_demographics: {
    age_range: String,
    income_level: String,
    education_level: String,
    farm_size: String
  },
  seasonal_trends: mongoose.Schema.Types.Mixed,
  crop_preferences: [String],
  technology_adoption_rate: Number,
  internet_penetration: Number,
  mobile_penetration: Number,
  analyst_notes: String
}, {
  timestamps: true
});

// Indexes
regionalMarketAnalysisSchema.index({ region_code: 1, analysis_date: -1 });

// Models
const GlobalRegion = mongoose.model('GlobalRegion', globalRegionSchema);
const RegionalMetrics = mongoose.model('RegionalMetrics', regionalMetricsSchema);
const CurrencyRate = mongoose.model('CurrencyRate', currencyRateSchema);
const PartnershipAgreement = mongoose.model('PartnershipAgreement', partnershipAgreementSchema);
const RegionalLanguageSupport = mongoose.model('RegionalLanguageSupport', regionalLanguageSupportSchema);
const RegionalCompliance = mongoose.model('RegionalCompliance', regionalComplianceSchema);
const RegionalMarketAnalysis = mongoose.model('RegionalMarketAnalysis', regionalMarketAnalysisSchema);

module.exports = {
  GlobalRegion,
  RegionalMetrics,
  CurrencyRate,
  PartnershipAgreement,
  RegionalLanguageSupport,
  RegionalCompliance,
  RegionalMarketAnalysis
};



