const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  query: {
    q: String,
    category: String,
    region: String,
    district: String,
    minPrice: Number,
    maxPrice: Number,
    lat: Number,
    lng: Number,
    radiusKm: Number
  },
  notify: {
    type: Boolean,
    default: true
  },
  lastMatchedAt: Date
}, {
  timestamps: true
});

savedSearchSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SavedSearch', savedSearchSchema);
