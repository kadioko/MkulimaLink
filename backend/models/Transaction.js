const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    required: true
  },
  sellerAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'paid', 'in_delivery', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  stockFinalized: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'cash', 'bank_transfer'],
    default: 'mpesa'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentReference: {
    type: String
  },
  idempotencyKey: {
    type: String,
    trim: true
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date
  },
  escrow: {
    status: {
      type: String,
      enum: ['none', 'held', 'released', 'refunded', 'disputed'],
      default: 'none'
    },
    amountHeld: {
      type: Number,
      default: 0
    },
    heldAt: Date,
    releasedAt: Date,
    refundedAt: Date
  },
  risk: {
    score: {
      type: Number,
      default: 0
    },
    flag: {
      type: String,
      enum: ['low', 'medium', 'high', 'blocked'],
      default: 'low'
    },
    reasons: [String],
    assessedAt: Date
  },
  deliveryDetails: {
    address: String,
    phone: String,
    notes: String,
    estimatedDelivery: Date
  },
  ratings: {
    buyerRating: {
      score: Number,
      comment: String,
      createdAt: Date
    },
    sellerRating: {
      score: Number,
      comment: String,
      createdAt: Date
    }
  },
  timeline: [{
    status: String,
    timestamp: Date,
    note: String
  }]
}, {
  timestamps: true
});

transactionSchema.index({ buyer: 1, status: 1 });
transactionSchema.index({ seller: 1, status: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ buyer: 1, createdAt: -1 });
transactionSchema.index({ seller: 1, createdAt: -1 });
transactionSchema.index({ product: 1, status: 1 });
transactionSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);
