/**
 * Video Model
 * Model for product videos in the marketplace
 */

const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  original_url: {
    type: String,
    required: true
  },
  processed_url: {
    type: String,
    required: true
  },
  thumbnail_url: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  file_size: {
    type: Number, // in bytes
    required: true
  },
  format: {
    type: String,
    enum: ['mp4', 'mov', 'avi', 'webm'],
    required: true
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'processed', 'failed'],
    default: 'uploading'
  },
  views: {
    type: Number,
    default: 0
  },
  unique_views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  liked_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  viewers: [{
    type: String // User IDs or session IDs for anonymous tracking
  }],
  last_viewed_at: {
    type: Date
  },
  processing_error: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // Video quality settings
  quality: {
    resolution: {
      type: String,
      enum: ['480p', '720p', '1080p'],
      default: '720p'
    },
    bitrate: {
      type: String,
      default: '1500k'
    }
  },
  // Geographic information
  location: {
    region: String,
    district: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  // Moderation status
  moderation_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Auto-approve for now
  },
  moderated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderated_at: Date,
  moderation_notes: String
}, {
  timestamps: true
});

// Indexes
videoSchema.index({ product: 1 });
videoSchema.index({ uploaded_by: 1 });
videoSchema.index({ status: 1 });
videoSchema.index({ createdAt: -1 });
videoSchema.index({ views: -1 });
videoSchema.index({ likes: -1 });
videoSchema.index({ 'location.region': 1 });
videoSchema.index({ tags: 1 });
videoSchema.index({ moderation_status: 1 });

// Virtual for engagement rate
videoSchema.virtual('engagement_rate').get(function() {
  if (this.views === 0) return 0;
  return ((this.likes / this.views) * 100).toFixed(2);
});

// Virtual for video URL (processed)
videoSchema.virtual('video_url').get(function() {
  return this.processed_url;
});

// Method to increment views
videoSchema.methods.incrementViews = async function(userId = null, sessionId = null) {
  this.views += 1;
  this.last_viewed_at = new Date();

  // Track unique viewers
  if (!this.viewers) this.viewers = [];
  const viewerId = userId || sessionId;
  if (viewerId && !this.viewers.includes(viewerId)) {
    this.viewers.push(viewerId);
    this.unique_views = this.viewers.length;
  }

  return this.save();
};

// Method to toggle like
videoSchema.methods.toggleLike = async function(userId) {
  if (!this.liked_by) this.liked_by = [];

  const userIndex = this.liked_by.indexOf(userId);

  if (userIndex > -1) {
    // Unlike
    this.liked_by.splice(userIndex, 1);
    this.likes = Math.max(0, this.likes - 1);
    return { liked: false, likes: this.likes };
  } else {
    // Like
    this.liked_by.push(userId);
    this.likes += 1;
    return { liked: true, likes: this.likes };
  }
};

// Method to add tags
videoSchema.methods.addTags = async function(tags) {
  if (!this.tags) this.tags = [];

  const newTags = tags.filter(tag => !this.tags.includes(tag.toLowerCase()));
  this.tags.push(...newTags.map(tag => tag.toLowerCase()));

  return this.save();
};

// Method to update location
videoSchema.methods.updateLocation = async function(locationData) {
  this.location = {
    ...this.location,
    ...locationData
  };

  return this.save();
};

// Method to mark as processed
videoSchema.methods.markAsProcessed = async function(metadata = {}) {
  this.status = 'processed';
  this.metadata = {
    ...this.metadata,
    ...metadata,
    processing_completed_at: new Date()
  };

  return this.save();
};

// Method to mark processing as failed
videoSchema.methods.markAsFailed = async function(error) {
  this.status = 'failed';
  this.processing_error = error;

  return this.save();
};

// Static method to get popular videos
videoSchema.statics.getPopularVideos = async function(limit = 10) {
  return this.find({ status: 'processed', moderation_status: 'approved' })
    .sort({ views: -1, likes: -1 })
    .limit(limit)
    .populate('product', 'name category price')
    .populate('uploaded_by', 'name');
};

// Static method to get trending videos (recent with high engagement)
videoSchema.statics.getTrendingVideos = async function(days = 7, limit = 10) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.find({
    status: 'processed',
    moderation_status: 'approved',
    createdAt: { $gte: cutoffDate }
  })
  .sort({ views: -1, likes: -1 })
  .limit(limit)
  .populate('product', 'name category price')
  .populate('uploaded_by', 'name');
};

// Static method to get videos by region
videoSchema.statics.getVideosByRegion = async function(region, limit = 20) {
  return this.find({
    status: 'processed',
    moderation_status: 'approved',
    'location.region': region
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('product', 'name category price')
  .populate('uploaded_by', 'name');
};

// Static method to search videos
videoSchema.statics.searchVideos = async function(query, filters = {}, limit = 20) {
  const searchRegex = new RegExp(query, 'i');
  const searchQuery = {
    status: 'processed',
    moderation_status: 'approved',
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { tags: searchRegex }
    ]
  };

  // Apply additional filters
  if (filters.category) {
    // This would require joining with products - simplified for now
    searchQuery.category = filters.category;
  }

  if (filters.region) {
    searchQuery['location.region'] = filters.region;
  }

  if (filters.minDuration) {
    searchQuery.duration = { $gte: filters.minDuration };
  }

  if (filters.maxDuration) {
    searchQuery.duration = { ...searchQuery.duration, $lte: filters.maxDuration };
  }

  return this.find(searchQuery)
    .sort({ views: -1, createdAt: -1 })
    .limit(limit)
    .populate('product', 'name category price')
    .populate('uploaded_by', 'name');
};

const Video = mongoose.model('Video', videoSchema);

module.exports = { Video };
