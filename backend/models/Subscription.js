/**
 * Subscription Models
 * Models for managing premium subscriptions and billing
 */

const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  plan_id: {
    type: String,
    enum: ['free', 'premium', 'enterprise'],
    default: 'free',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired'],
    default: 'active',
    index: true
  },
  billing_cycle: {
    type: String,
    enum: ['monthly', 'annual'],
    default: 'monthly'
  },
  price: {
    type: Number,
    default: 0
  },
  features: [{
    type: String
  }],
  auto_renew: {
    type: Boolean,
    default: true
  },
  started_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  expires_at: {
    type: Date,
    index: true
  },
  payment_method: {
    type: String,
    enum: ['mpesa', 'airtel', 'bank_transfer', 'stripe'],
    default: 'mpesa'
  },
  invoice_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  cancelled_at: Date,
  cancellation_reason: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ user_id: 1, status: 1 });
subscriptionSchema.index({ expires_at: 1 });
subscriptionSchema.index({ plan_id: 1 });

// Virtual for days remaining
subscriptionSchema.virtual('days_remaining').get(function() {
  if (!this.expires_at) return null;
  return Math.ceil((this.expires_at - new Date()) / (1000 * 60 * 60 * 24));
});

// Virtual for is_active
subscriptionSchema.virtual('is_active').get(function() {
  return this.status === 'active' && (!this.expires_at || this.expires_at > new Date());
});

// Method to check feature access
subscriptionSchema.methods.hasFeature = function(feature) {
  return this.features.includes(feature);
};

// Method to cancel subscription
subscriptionSchema.methods.cancel = async function(reason = null) {
  this.status = 'cancelled';
  this.cancelled_at = new Date();
  this.cancellation_reason = reason;
  this.auto_renew = false;
  return this.save();
};

// Method to pause subscription
subscriptionSchema.methods.pause = async function() {
  this.status = 'paused';
  return this.save();
};

// Method to resume subscription
subscriptionSchema.methods.resume = async function() {
  this.status = 'active';
  return this.save();
};

// Static method to get active subscription
subscriptionSchema.statics.getActive = async function(userId) {
  return this.findOne({
    user_id: userId,
    status: 'active',
    $or: [
      { expires_at: null },
      { expires_at: { $gt: new Date() } }
    ]
  });
};

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  plan_id: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'TZS'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  due_date: {
    type: Date,
    required: true
  },
  paid_at: Date,
  items: [{
    description: String,
    quantity: Number,
    unit_price: Number,
    total: Number
  }],
  payment_reference: String,
  payment_method: {
    type: String,
    enum: ['mpesa', 'airtel', 'bank_transfer', 'stripe']
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
invoiceSchema.index({ user_id: 1, created_at: -1 });
invoiceSchema.index({ status: 1, due_date: 1 });
invoiceSchema.index({ payment_reference: 1 });

// Virtual for invoice number
invoiceSchema.virtual('invoice_number').get(function() {
  return `INV-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for is_overdue
invoiceSchema.virtual('is_overdue').get(function() {
  return this.status === 'pending' && this.due_date < new Date();
});

// Method to mark as paid
invoiceSchema.methods.markAsPaid = async function(reference) {
  this.status = 'paid';
  this.paid_at = new Date();
  this.payment_reference = reference;
  return this.save();
};

// Method to mark as failed
invoiceSchema.methods.markAsFailed = async function() {
  this.status = 'failed';
  return this.save();
};

// Static method to get pending invoices
invoiceSchema.statics.getPending = async function(userId) {
  return this.find({
    user_id: userId,
    status: 'pending'
  }).sort({ due_date: 1 });
};

// Static method to get overdue invoices
invoiceSchema.statics.getOverdue = async function() {
  return this.find({
    status: 'pending',
    due_date: { $lt: new Date() }
  }).sort({ due_date: 1 });
};

// Discount Code Schema
const discountCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true
  },
  description: String,
  discount_type: {
    type: String,
    enum: ['percentage', 'fixed_amount'],
    default: 'percentage'
  },
  discount_value: {
    type: Number,
    required: true
  },
  max_uses: Number,
  uses_count: {
    type: Number,
    default: 0
  },
  applicable_plans: [{
    type: String,
    enum: ['free', 'premium', 'enterprise']
  }],
  valid_from: {
    type: Date,
    default: Date.now
  },
  valid_until: Date,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
discountCodeSchema.index({ code: 1, status: 1 });
discountCodeSchema.index({ valid_from: 1, valid_until: 1 });

// Virtual for is_valid
discountCodeSchema.virtual('is_valid').get(function() {
  const now = new Date();
  return this.status === 'active' &&
         this.valid_from <= now &&
         (!this.valid_until || this.valid_until > now) &&
         (!this.max_uses || this.uses_count < this.max_uses);
});

// Method to apply discount
discountCodeSchema.methods.apply = async function() {
  if (!this.is_valid) {
    throw new Error('Discount code is not valid');
  }
  this.uses_count += 1;
  return this.save();
};

// Models
const Subscription = mongoose.model('Subscription', subscriptionSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);
const DiscountCode = mongoose.model('DiscountCode', discountCodeSchema);

module.exports = {
  Subscription,
  Invoice,
  DiscountCode
};



