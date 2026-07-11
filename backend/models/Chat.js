const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'location', 'product', 'offer'],
    default: 'text'
  },
  attachments: [{
    url: String,
    type: String,
    name: String
  }],
  productRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  offer: {
    amount: Number,
    quantity: Number,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'countered'],
      default: 'pending'
    }
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group', 'support'],
    default: 'direct'
  },
  name: String,
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  messages: [messageSchema],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

chatSchema.index({ participants: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });
chatSchema.index({ product: 1 });

chatSchema.methods.addMessage = async function(senderId, content, type = 'text', extras = {}) {
  const message = {
    sender: senderId,
    content,
    type,
    ...extras,
    readBy: [{ user: senderId }]
  };
  
  this.messages.push(message);
  this.lastMessage = {
    content: content.substring(0, 100),
    sender: senderId,
    timestamp: new Date()
  };

  this.participants.forEach(participantId => {
    if (participantId.toString() !== senderId.toString()) {
      const currentCount = this.unreadCount.get(participantId.toString()) || 0;
      this.unreadCount.set(participantId.toString(), currentCount + 1);
    }
  });

  await this.save();
  return this.messages[this.messages.length - 1];
};

chatSchema.methods.markAsRead = async function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  
  this.messages.forEach(message => {
    if (!message.readBy.some(r => r.user.toString() === userId.toString())) {
      message.readBy.push({ user: userId });
    }
  });
  
  await this.save();
};

module.exports = mongoose.model('Chat', chatSchema);



