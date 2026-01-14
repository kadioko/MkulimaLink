/**
 * AR/VR Models
 * Models for augmented and virtual reality product visualization
 */

const mongoose = require('mongoose');

const arvrModelSchema = new mongoose.Schema({
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
  model_files: {
    model: {
      type: Map,
      of: {
        url: String,
        size: Number,
        format: String
      }
    },
    textures: {
      type: Map,
      of: {
        url: String,
        size: Number,
        format: String
      }
    },
    animations: {
      type: Map,
      of: {
        url: String,
        size: Number,
        format: String
      }
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  view_count: {
    type: Number,
    default: 0
  },
  like_count: {
    type: Number,
    default: 0
  },
  share_count: {
    type: Number,
    default: 0
  },
  interactions: [{
    type: {
      type: String,
      enum: ['view', 'like', 'share', 'inspect', 'purchase_initiated']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  compatibility: {
    ar_supported: {
      type: Boolean,
      default: true
    },
    vr_supported: {
      type: Boolean,
      default: true
    },
    webxr_supported: {
      type: Boolean,
      default: true
    },
    mobile_ar_supported: {
      type: Boolean,
      default: true
    },
    minimum_device_specs: {
      ram_gb: {
        type: Number,
        default: 2
      },
      gpu_required: {
        type: Boolean,
        default: false
      },
      webgl_version: {
        type: Number,
        default: 2
      }
    }
  },
  optimization: {
    lod_levels: {
      type: Number,
      default: 1
    },
    compressed: {
      type: Boolean,
      default: false
    },
    texture_compression: {
      type: String,
      enum: ['none', 'webp', 'basis'],
      default: 'none'
    },
    file_size_mb: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'failed'],
    default: 'processing'
  },
  processing_error: String,
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Indexes
arvrModelSchema.index({ product: 1 });
arvrModelSchema.index({ uploaded_by: 1 });
arvrModelSchema.index({ status: 1 });
arvrModelSchema.index({ createdAt: -1 });
arvrModelSchema.index({ view_count: -1 });
arvrModelSchema.index({ like_count: -1 });
arvrModelSchema.index({ tags: 1 });

// Virtual for total interactions
arvrModelSchema.virtual('total_interactions').get(function() {
  return this.view_count + this.like_count + this.share_count;
});

// Virtual for engagement rate
arvrModelSchema.virtual('engagement_rate').get(function() {
  if (this.view_count === 0) return 0;
  return ((this.like_count + this.share_count) / this.view_count * 100).toFixed(2);
});

// Method to record interaction
arvrModelSchema.methods.recordInteraction = async function(interactionType, userId = null, metadata = {}) {
  this.interactions.push({
    type: interactionType,
    user: userId,
    metadata
  });

  // Update counters
  if (interactionType === 'view') {
    this.view_count += 1;
  } else if (interactionType === 'like') {
    this.like_count += 1;
  } else if (interactionType === 'share') {
    this.share_count += 1;
  }

  return this.save();
};

// Method to update processing status
arvrModelSchema.methods.updateProcessingStatus = async function(status, error = null) {
  this.status = status;
  if (error) {
    this.processing_error = error;
  }

  if (status === 'ready') {
    this.metadata.processing_completed_at = new Date();
  }

  return this.save();
};

// Method to add tags
arvrModelSchema.methods.addTags = async function(newTags) {
  if (!this.tags) this.tags = [];

  const uniqueTags = newTags.filter(tag =>
    !this.tags.includes(tag.toLowerCase())
  ).map(tag => tag.toLowerCase());

  this.tags.push(...uniqueTags);
  return this.save();
};

// Static method to get popular AR/VR models
arvrModelSchema.statics.getPopularModels = async function(limit = 10) {
  return this.find({ status: 'ready' })
    .sort({ view_count: -1, like_count: -1 })
    .limit(limit)
    .populate('product', 'name category price')
    .populate('uploaded_by', 'name');
};

// Static method to get trending AR/VR models
arvrModelSchema.statics.getTrendingModels = async function(days = 7, limit = 10) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        status: 'ready',
        createdAt: { $gte: cutoffDate }
      }
    },
    {
      $addFields: {
        total_engagement: { $add: ['$view_count', '$like_count', '$share_count'] },
        recency_score: {
          $divide: [
            { $subtract: [new Date(), '$createdAt'] },
            1000 * 60 * 60 * 24 // Convert to days
          ]
        }
      }
    },
    {
      $sort: {
        total_engagement: -1,
        recency_score: 1
      }
    },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'uploaded_by',
        foreignField: '_id',
        as: 'uploaded_by'
      }
    },
    {
      $unwind: '$product'
    },
    {
      $unwind: '$uploaded_by'
    }
  ]);
};

// Static method to search AR/VR models
arvrModelSchema.statics.searchModels = async function(query, filters = {}, limit = 20) {
  const searchRegex = new RegExp(query, 'i');
  const searchQuery = {
    status: 'ready',
    $or: [
      { 'metadata.title': searchRegex },
      { 'metadata.description': searchRegex },
      { tags: searchRegex }
    ]
  };

  // Apply filters
  if (filters.category) {
    // This would require joining with products - simplified for now
    searchQuery.category = filters.category;
  }

  if (filters.minFileSize) {
    searchQuery['optimization.file_size_mb'] = { $gte: filters.minFileSize };
  }

  if (filters.maxFileSize) {
    searchQuery['optimization.file_size_mb'] = {
      ...searchQuery['optimization.file_size_mb'],
      $lte: filters.maxFileSize
    };
  }

  if (filters.supportsAR !== undefined) {
    searchQuery['compatibility.ar_supported'] = filters.supportsAR;
  }

  if (filters.supportsVR !== undefined) {
    searchQuery['compatibility.vr_supported'] = filters.supportsVR;
  }

  return this.find(searchQuery)
    .sort({ view_count: -1, createdAt: -1 })
    .limit(limit)
    .populate('product', 'name category price')
    .populate('uploaded_by', 'name');
};

const ARVRModel = mongoose.model('ARVRModel', arvrModelSchema);

// Enhanced Product schema with AR/VR fields
const productARVRSchema = new mongoose.Schema({
  arvr_enabled: {
    type: Boolean,
    default: false
  },
  arvr_model: {
    type: String,
    ref: 'ARVRModel'
  },
  ar_markers: [{
    id: String,
    image_url: String,
    physical_width: {
      type: Number,
      default: 0.1
    },
    pattern_data: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed
  }],
  vr_showroom_available: {
    type: Boolean,
    default: false
  },
  ar_instructions: {
    type: String,
    maxlength: 1000
  },
  vr_tour_enabled: {
    type: Boolean,
    default: false
  }
});

// Add AR/VR fields to existing Product model
// This would typically be done by extending the existing Product schema
const ProductARVR = mongoose.model('ProductARVR', productARVRSchema);

module.exports = { ARVRModel, ProductARVR };
