const mongoose = require('mongoose');

const recentSearchSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  query: {
    type: String,
    trim: true
  },
  filters: mongoose.Schema.Types.Mixed,
  count: {
    type: Number,
    default: 1
  },
  lastSearchedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

recentSearchSchema.index({ user: 1, query: 1 }, { unique: true });
recentSearchSchema.index({ user: 1, lastSearchedAt: -1 });
recentSearchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

module.exports = mongoose.model('RecentSearch', recentSearchSchema);



