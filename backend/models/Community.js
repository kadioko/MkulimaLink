const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['cooperative', 'learning', 'regional', 'crop-specific'],
    required: true
  },
  category: {
    type: String
  },
  region: {
    type: String
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  posts: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true
    },
    images: [String],
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    comments: [{
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    tags: [String],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  memberCount: {
    type: Number,
    default: 0
  },
  rules: [String],
  avatar: String
}, {
  timestamps: true
});

communitySchema.index({ type: 1, region: 1 });
communitySchema.index({ category: 1 });
communitySchema.index({ 'members.user': 1 });

communitySchema.pre('save', function(next) {
  this.memberCount = this.members.length;
  next();
});

module.exports = mongoose.model('Community', communitySchema);



