const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
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
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['tigopesa', 'halopesa', 'airtel_money', 'bank_transfer', 'cash_on_delivery'],
    default: 'tigopesa'
  },
  transactionId: {
    type: String
  },
  deliveryAddress: {
    region: String,
    district: String,
    ward: String,
    street: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  deliveryDate: {
    type: Date
  },
  notes: {
    type: String
  },
  cancellationReason: {
    type: String
  },
  cancelledAt: {
    type: Date
  },
  refundAmount: {
    type: Number
  },
  refundedAt: {
    type: Date
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    ratedAt: Date
  }
}, {
  timestamps: true
});

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);



