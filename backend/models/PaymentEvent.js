const mongoose = require('mongoose');

const paymentEventSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['mpesa', 'airtel', 'wallet', 'manual', 'unknown'],
    required: true
  },
  eventId: {
    type: String,
    required: true,
    trim: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  status: {
    type: String,
    enum: ['received', 'processed', 'duplicate', 'failed'],
    default: 'received'
  },
  payload: mongoose.Schema.Types.Mixed,
  processedAt: Date,
  error: String
}, {
  timestamps: true
});

paymentEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
paymentEventSchema.index({ transaction: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentEvent', paymentEventSchema);
