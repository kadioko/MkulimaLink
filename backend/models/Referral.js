const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralCode: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'rewarded'],
    default: 'pending'
  },
  referrerReward: {
    type: Number,
    default: 5000
  },
  referredReward: {
    type: Number,
    default: 2000
  },
  rewardPaid: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

referralSchema.index({ referralCode: 1 });
referralSchema.index({ referrer: 1, status: 1 });

module.exports = mongoose.model('Referral', referralSchema);



