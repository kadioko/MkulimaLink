const mongoose = require('mongoose');

// Enhanced Insurance Policy Schema (extends existing)
const insurancePolicySchema = new mongoose.Schema({
  // Keep existing fields for backward compatibility
  policyholder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // New standardized user field
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['crop', 'livestock', 'equipment', 'transit', 'weather'],
    required: true
  },
  policyNumber: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'cancelled', 'claimed'],
    default: 'pending'
  },
  coverage: {
    cropType: String,
    farmSize: Number,
    farmLocation: {
      region: String,
      district: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    coverageAmount: {
      type: Number,
      required: true
    },
    deductible: {
      type: Number,
      default: 0
    },
    coveredRisks: [{
      type: String,
      enum: ['drought', 'flood', 'pest', 'disease', 'hail', 'frost', 'fire', 'theft', 'accident']
    }]
  },
  premium: {
    amount: {
      type: Number,
      required: true
    },
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'annually', 'seasonal'],
      default: 'seasonal'
    },
    nextDueDate: Date,
    payments: [{
      amount: Number,
      date: Date,
      reference: String,
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed']
      }
    }]
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    season: String
  },
  claims: [{
    claimNumber: String,
    type: String,
    description: String,
    amount: Number,
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected', 'paid'],
      default: 'submitted'
    },
    evidence: [{
      type: String,
      url: String,
      description: String
    }],
    submittedAt: Date,
    reviewedAt: Date,
    approvedAmount: Number,
    paidAt: Date,
    rejectionReason: String,
    notes: String
  }],
  documents: [{
    type: {
      type: String,
      enum: ['policy', 'receipt', 'claim_form', 'evidence', 'other']
    },
    url: String,
    name: String,
    uploadedAt: Date
  }],
  weatherData: {
    linkedStation: String,
    thresholds: {
      rainfall: {
        min: Number,
        max: Number
      },
      temperature: {
        min: Number,
        max: Number
      }
    },
    automaticTrigger: Boolean
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100
  },
  partner: {
    name: String,
    code: String,
    contactEmail: String
  },
  // Enhanced fields for comprehensive insurance management
  product_id: String, // e.g., 'aic_crop_yield', 'apa_multi_peril'
  premium_payment_term: {
    type: String,
    enum: ['monthly', 'annual'],
    default: 'annual'
  },
  currency: {
    type: String,
    default: 'KES',
    enum: ['KES', 'UGX', 'TZS', 'RWF']
  },
  renewal_date: Date,
  farm_details: {
    farming_practices: {
      type: String,
      enum: ['conventional', 'organic', 'conservation', 'integrated'],
      default: 'conventional'
    },
    irrigation_type: {
      type: String,
      enum: ['rainfed', 'irrigated', 'drip', 'sprinkler'],
      default: 'rainfed'
    },
    historical_yield: Number,
    expected_yield: Number,
    soil_type: String,
    risk_zone: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
      default: 'medium'
    }
  },
  beneficiary_details: {
    name: String,
    phone: String,
    relationship: {
      type: String,
      enum: ['self', 'spouse', 'child', 'relative', 'business_partner'],
      default: 'self'
    },
    id_number: String,
    bank_details: {
      bank_name: String,
      account_number: String,
      branch: String
    }
  },
  premium_calculation: {
    annual_premium: Number,
    monthly_premium: Number,
    premium_rate: Number,
    calculation_method: {
      type: String,
      enum: ['provider_api', 'local_fallback'],
      default: 'local_fallback'
    },
    factors: mongoose.Schema.Types.Mixed
  },
  payment_schedule: [{
    due_date: Date,
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'cancelled'],
      default: 'pending'
    },
    payment_date: Date,
    payment_reference: String
  }],
  claims_history: [{
    claim_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InsuranceClaim'
    },
    incident_date: Date,
    claim_amount: Number,
    payout_amount: Number,
    status: String
  }],
  // Provider integration
  provider_policy_id: String,
  provider_data: mongoose.Schema.Types.Mixed,
  // Audit trail
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  activated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  activated_at: Date,
  cancelled_at: Date,
  cancellation_reason: String
}, {
  timestamps: true
});

// Indexes
insurancePolicySchema.index({ policyholder: 1, status: 1 });
insurancePolicySchema.index({ user: 1, status: 1 });
insurancePolicySchema.index({ policyNumber: 1 });
insurancePolicySchema.index({ type: 1, 'period.endDate': 1 });
insurancePolicySchema.index({ product_id: 1 });
insurancePolicySchema.index({ status: 1, 'period.endDate': 1 });

// Virtuals for enhanced functionality
insurancePolicySchema.virtual('days_remaining').get(function() {
  if (this.status !== 'active') return 0;
  const today = new Date();
  const diffTime = this.period.endDate - today;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

insurancePolicySchema.virtual('next_premium_due').get(function() {
  if (this.payment_schedule && this.payment_schedule.length > 0) {
    const pendingPayment = this.payment_schedule.find(p => p.status === 'pending');
    return pendingPayment ? pendingPayment.due_date : null;
  }
  return this.premium.nextDueDate;
});

insurancePolicySchema.virtual('total_premiums_paid').get(function() {
  if (this.payment_schedule && this.payment_schedule.length > 0) {
    return this.payment_schedule
      .filter(p => p.status === 'paid')
      .reduce((sum, payment) => sum + payment.amount, 0);
  }
  return this.premium.payments
    ? this.premium.payments
        .filter(p => p.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0)
    : 0;
});

// Pre-save middleware
insurancePolicySchema.pre('save', function(next) {
  // Backward compatibility: set policyholder from user if not set
  if (!this.policyholder && this.user) {
    this.policyholder = this.user;
  }

  // Generate policy number if not exists
  if (!this.policyNumber) {
    this.policyNumber = 'INS' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  // Set default coverage amount from enhanced field
  if (!this.coverage.coverageAmount && this.coverageAmount) {
    this.coverage.coverageAmount = this.coverageAmount;
  }

  next();
});

// Enhanced premium calculation
insurancePolicySchema.statics.calculatePremium = function(type, coverageAmount, options = {}) {
  const baseRates = {
    crop: 0.05,
    livestock: 0.04,
    equipment: 0.03,
    transit: 0.02,
    weather: 0.06
  };

  let rate = baseRates[type] || 0.05;

  // Enhanced risk factors
  if (options.region === 'high_risk') rate *= 1.3;
  if (options.previousClaims > 0) rate *= 1 + (options.previousClaims * 0.1);
  if (options.farmSize > 10) rate *= 0.95;
  if (options.organicCertified) rate *= 0.9;
  if (options.risk_zone === 'high') rate *= 1.2;
  if (options.risk_zone === 'very_high') rate *= 1.4;
  if (options.farming_practices === 'organic') rate *= 0.9;

  const premium = coverageAmount * rate;

  return {
    annualPremium: Math.round(premium),
    monthlyPremium: Math.round(premium / 12),
    seasonalPremium: Math.round(premium / 2),
    rate: rate * 100,
    coverageAmount,
    deductible: Math.round(coverageAmount * 0.1),
    calculation_method: 'local_fallback',
    factors: {
      base_rate: baseRates[type],
      risk_adjustments: options
    }
  };
};

// Enhanced claim submission
insurancePolicySchema.methods.submitClaim = async function(claimData) {
  const claimNumber = 'CLM' + Date.now().toString(36).toUpperCase();

  const newClaim = {
    claimNumber,
    ...claimData,
    status: 'submitted',
    submittedAt: new Date()
  };

  this.claims.push(newClaim);

  // Also add to claims_history for enhanced tracking
  if (!this.claims_history) this.claims_history = [];
  this.claims_history.push({
    incident_date: claimData.incident_date || new Date(),
    claim_amount: claimData.amount,
    status: 'submitted'
  });

  await this.save();
  return this.claims[this.claims.length - 1];
};

// Enhanced methods for provider integration
insurancePolicySchema.methods.isEligibleForClaim = function(incidentDate, incidentType) {
  if (this.status !== 'active') return false;

  const incident = new Date(incidentDate);
  if (incident < this.period.startDate || incident > this.period.endDate) return false;

  // Check if incident type is covered
  return this.coverage.coveredRisks && this.coverage.coveredRisks.includes(incidentType);
};

insurancePolicySchema.methods.calculateClaimPayout = function(incidentType, lossAmount) {
  const coveragePercentage = 0.8; // 80% coverage
  const maxPayout = this.coverage.coverageAmount * coveragePercentage;
  const payout = Math.min(lossAmount - this.coverage.deductible, maxPayout);

  return Math.max(0, payout);
};

insurancePolicySchema.methods.renewPolicy = async function(newEndDate, newPremium) {
  this.period.endDate = newEndDate;
  this.renewal_date = new Date();

  // Generate new payment schedule
  if (!this.payment_schedule) this.payment_schedule = [];
  const schedule = this.generatePaymentSchedule(newPremium, this.premium_payment_term || 'annual');
  this.payment_schedule.push(...schedule);

  await this.save();
  return this;
};

insurancePolicySchema.methods.generatePaymentSchedule = function(premiumAmount, term) {
  const schedule = [];
  const now = new Date();

  if (term === 'annual') {
    schedule.push({
      due_date: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      amount: premiumAmount,
      status: 'pending'
    });
  } else if (term === 'monthly') {
    for (let i = 1; i <= 12; i++) {
      schedule.push({
        due_date: new Date(now.getFullYear(), now.getMonth() + i, now.getDate()),
        amount: premiumAmount,
        status: 'pending'
      });
    }
  }

  return schedule;
};

// Insurance Claim Schema (separate model for better organization)
const insuranceClaimSchema = new mongoose.Schema({
  policy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InsurancePolicy',
    required: true
  },
  claimNumber: {
    type: String,
    unique: true,
    required: true
  },
  incident_type: {
    type: String,
    required: true,
    enum: ['drought', 'flood', 'pest', 'disease', 'fire', 'hail', 'storm', 'theft', 'other']
  },
  incident_date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  location: {
    region: String,
    district: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  estimated_loss: {
    type: Number,
    required: true,
    min: 0
  },
  approved_amount: {
    type: Number,
    default: 0
  },
  payout_amount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'rejected', 'paid'],
    default: 'submitted'
  },
  evidence: [{
    type: String,
    url: String,
    description: String
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  approvedAmount: Number, // Keep for backward compatibility
  paidAt: Date,
  payout_date: Date, // Enhanced field
  rejectionReason: String,
  notes: String,
  // Enhanced fields
  assessment_details: {
    assessed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assessment_date: Date,
    findings: String,
    assessed_loss: Number,
    supporting_evidence: [String]
  },
  supporting_documents: [{
    type: {
      type: String,
      enum: ['photo', 'document', 'report', 'receipt']
    },
    url: String,
    description: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  witness_details: [{
    name: String,
    phone: String,
    statement: String,
    verified: {
      type: Boolean,
      default: false
    }
  }],
  payout_reference: String,
  bank_details: {
    bank_name: String,
    account_number: String,
    account_holder: String
  },
  // Provider integration
  provider_claim_id: String,
  provider_data: mongoose.Schema.Types.Mixed,
  // Audit trail
  submitted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processed_at: Date
}, {
  timestamps: true
});

// Indexes for claims
insuranceClaimSchema.index({ policy: 1, status: 1 });
insuranceClaimSchema.index({ claimNumber: 1 });
insuranceClaimSchema.index({ status: 1, incident_date: -1 });
insuranceClaimSchema.index({ submitted_by: 1 });

// Virtual for claim age
insuranceClaimSchema.virtual('days_since_submission').get(function() {
  const now = new Date();
  const submission = this.submittedAt;
  const diffTime = now - submission;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save for claim number generation
insuranceClaimSchema.pre('save', function(next) {
  if (!this.claimNumber) {
    this.claimNumber = 'CLM' + Date.now().toString(36).toUpperCase();
  }

  // Backward compatibility
  if (!this.approvedAmount && this.approved_amount) {
    this.approvedAmount = this.approved_amount;
  }
  if (!this.paidAt && this.payout_date) {
    this.paidAt = this.payout_date;
  }

  next();
});

// Models
const Insurance = mongoose.model('Insurance', insurancePolicySchema);
const InsurancePolicy = mongoose.model('InsurancePolicy', insurancePolicySchema);
const InsuranceClaim = mongoose.model('InsuranceClaim', insuranceClaimSchema);

module.exports = { Insurance, InsurancePolicy, InsuranceClaim };
