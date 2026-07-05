const mongoose = require('mongoose');

const failedActionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['login', 'payment', 'seed', 'transaction', 'auth', 'other'],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  email: String,
  ip: String,
  requestId: String,
  reason: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

failedActionSchema.index({ type: 1, createdAt: -1 });
failedActionSchema.index({ user: 1, createdAt: -1 });
failedActionSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('FailedAction', failedActionSchema);
