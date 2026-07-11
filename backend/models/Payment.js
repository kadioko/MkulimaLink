/**
 * Payment Models
 * Models for multi-country payment processing and transaction tracking
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  country_code: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  payment_method: {
    type: String,
    enum: ['mpesa', 'airtel', 'mtn_money', 'bank_transfer', 'stripe', 'wise'],
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'initiated', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  transaction_id: {
    type: String,
    index: true
  },
  reference_id: String,
  payment_reference: String,
  error_message: String,
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  completed_at: Date,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ user_id: 1, country_code: 1, created_at: -1 });
paymentSchema.index({ status: 1, created_at: -1 });
paymentSchema.index({ transaction_id: 1 });

// Virtual for is_completed
paymentSchema.virtual('is_completed').get(function() {
  return this.status === 'completed';
});

// Virtual for is_failed
paymentSchema.virtual('is_failed').get(function() {
  return this.status === 'failed';
});

// Method to mark as completed
paymentSchema.methods.markCompleted = async function(transactionId) {
  this.status = 'completed';
  this.transaction_id = transactionId;
  this.completed_at = new Date();
  return this.save();
};

// Method to mark as failed
paymentSchema.methods.markFailed = async function(errorMessage) {
  this.status = 'failed';
  this.error_message = errorMessage;
  return this.save();
};

// Payment Method Schema
const paymentMethodSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  country_code: {
    type: String,
    required: true
  },
  method_type: {
    type: String,
    enum: ['mpesa', 'airtel', 'mtn_money', 'bank_account', 'card'],
    required: true
  },
  phone_number: String,
  account_number: String,
  bank_name: String,
  card_last_four: String,
  is_default: {
    type: Boolean,
    default: false
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  verification_code: String,
  verified_at: Date,
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
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
paymentMethodSchema.index({ user_id: 1, country_code: 1 });
paymentMethodSchema.index({ is_default: 1 });

// Method to verify payment method
paymentMethodSchema.methods.verify = async function(code) {
  if (this.verification_code !== code) {
    throw new Error('Invalid verification code');
  }
  this.is_verified = true;
  this.verified_at = new Date();
  return this.save();
};

// Refund Schema
const refundSchema = new mongoose.Schema({
  payment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: String,
  reason: {
    type: String,
    enum: ['user_request', 'payment_failed', 'duplicate', 'fraud', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processed', 'rejected'],
    default: 'pending'
  },
  refund_transaction_id: String,
  notes: String,
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  processed_at: Date,
  processed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
refundSchema.index({ payment_id: 1 });
refundSchema.index({ user_id: 1, created_at: -1 });
refundSchema.index({ status: 1 });

// Method to approve refund
refundSchema.methods.approve = async function(processedBy) {
  this.status = 'approved';
  this.processed_by = processedBy;
  return this.save();
};

// Method to process refund
refundSchema.methods.process = async function(transactionId) {
  this.status = 'processed';
  this.refund_transaction_id = transactionId;
  this.processed_at = new Date();
  return this.save();
};

// Transaction Fee Schema
const transactionFeeSchema = new mongoose.Schema({
  payment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  country_code: String,
  payment_method: String,
  base_amount: Number,
  fee_amount: Number,
  fee_percentage: Number,
  total_amount: Number,
  fee_type: {
    type: String,
    enum: ['transaction', 'currency_conversion', 'cross_border'],
    default: 'transaction'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
transactionFeeSchema.index({ payment_id: 1 });
transactionFeeSchema.index({ user_id: 1 });

// Models
const Payment = mongoose.model('Payment', paymentSchema);
const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
const Refund = mongoose.model('Refund', refundSchema);
const TransactionFee = mongoose.model('TransactionFee', transactionFeeSchema);

module.exports = {
  Payment,
  PaymentMethod,
  Refund,
  TransactionFee
};



