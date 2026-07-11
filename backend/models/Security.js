/**
 * Security Models
 * Models for zero-trust architecture, fraud detection, and compliance
 */

const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  event_type: {
    type: String,
    enum: [
      'login_success',
      'login_failed',
      'identity_verification_failed',
      'device_verification_failed',
      'location_verification_failed',
      'permission_denied',
      'high_risk_access_attempt',
      'access_granted',
      'fraud_blocked',
      'fraud_flagged',
      'suspicious_activity',
      'data_export',
      'password_change',
      'mfa_enabled',
      'mfa_disabled'
    ],
    required: true,
    index: true
  },
  details: mongoose.Schema.Types.Mixed,
  ip_address: String,
  user_agent: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
securityEventSchema.index({ user_id: 1, timestamp: -1 });
securityEventSchema.index({ event_type: 1, timestamp: -1 });
securityEventSchema.index({ ip_address: 1 });

// Fraud Alert Schema
const fraudAlertSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  transaction_data: {
    amount: Number,
    recipient_id: String,
    location: mongoose.Schema.Types.Mixed,
    device_id: String,
    timestamp: Date
  },
  fraud_indicators: [String],
  fraud_score: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['flagged', 'blocked', 'reviewed', 'approved', 'rejected'],
    default: 'flagged',
    index: true
  },
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  review_notes: String,
  reviewed_at: Date,
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
fraudAlertSchema.index({ user_id: 1, status: 1 });
fraudAlertSchema.index({ fraud_score: -1 });
fraudAlertSchema.index({ created_at: -1 });

// Compliance Record Schema
const complianceRecordSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true
  },
  compliance_checks: {
    aml_kyc: Boolean,
    transaction_reporting: Boolean,
    data_protection: Boolean,
    sanctions_screening: Boolean,
    audit_logging: Boolean
  },
  compliant: {
    type: Boolean,
    default: true,
    index: true
  },
  violations: [String],
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
complianceRecordSchema.index({ user_id: 1, timestamp: -1 });
complianceRecordSchema.index({ compliant: 1, timestamp: -1 });

// Encryption Key Schema
const encryptionKeySchema = new mongoose.Schema({
  data_type: {
    type: String,
    enum: ['general', 'payment', 'personal', 'medical', 'financial'],
    required: true,
    index: true
  },
  key: {
    type: String,
    required: true
  },
  algorithm: {
    type: String,
    default: 'aes-256-gcm'
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  rotated_at: Date,
  expires_at: Date
}, {
  timestamps: true
});

// Indexes
encryptionKeySchema.index({ data_type: 1, active: 1 });

// Device Trust Schema
const deviceTrustSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  device_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  device_name: String,
  device_type: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet', 'other']
  },
  os: String,
  browser: String,
  trusted: {
    type: Boolean,
    default: false
  },
  last_used: Date,
  first_seen: {
    type: Date,
    default: Date.now
  },
  ip_address: String,
  location: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
deviceTrustSchema.index({ user_id: 1, trusted: 1 });
deviceTrustSchema.index({ device_id: 1 });

// Two-Factor Authentication Schema
const twoFactorAuthSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  enabled: {
    type: Boolean,
    default: false
  },
  method: {
    type: String,
    enum: ['sms', 'email', 'authenticator', 'biometric'],
    default: 'sms'
  },
  secret: String,
  backup_codes: [String],
  verified: {
    type: Boolean,
    default: false
  },
  last_used: Date,
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
twoFactorAuthSchema.index({ user_id: 1 });

// Security Policy Schema
const securityPolicySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  description: String,
  rules: [{
    rule_name: String,
    condition: String,
    action: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  }],
  enabled: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
securityPolicySchema.index({ enabled: 1 });

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  resource_type: String,
  resource_id: String,
  changes: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  ip_address: String,
  user_agent: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
auditLogSchema.index({ user_id: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource_type: 1, resource_id: 1 });

// Models
const SecurityEvent = mongoose.model('SecurityEvent', securityEventSchema);
const FraudAlert = mongoose.model('FraudAlert', fraudAlertSchema);
const ComplianceRecord = mongoose.model('ComplianceRecord', complianceRecordSchema);
const EncryptionKey = mongoose.model('EncryptionKey', encryptionKeySchema);
const DeviceTrust = mongoose.model('DeviceTrust', deviceTrustSchema);
const TwoFactorAuth = mongoose.model('TwoFactorAuth', twoFactorAuthSchema);
const SecurityPolicy = mongoose.model('SecurityPolicy', securityPolicySchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = {
  SecurityEvent,
  FraudAlert,
  ComplianceRecord,
  EncryptionKey,
  DeviceTrust,
  TwoFactorAuth,
  SecurityPolicy,
  AuditLog
};



