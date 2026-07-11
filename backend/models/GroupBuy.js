const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentReference: String,
  joinedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: Date
});

const groupBuySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['buying', 'selling'],
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    name: {
      type: String,
      required: true
    },
    category: String,
    description: String,
    image: String,
    unit: String,
    specifications: mongoose.Schema.Types.Mixed
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pricing: {
    originalPrice: Number,
    groupPrice: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'TZS'
    },
    savings: Number,
    savingsPercentage: Number
  },
  quantity: {
    minimum: {
      type: Number,
      required: true
    },
    maximum: Number,
    current: {
      type: Number,
      default: 0
    },
    unit: String
  },
  participants: [participantSchema],
  status: {
    type: String,
    enum: ['draft', 'open', 'minimum_reached', 'closed', 'processing', 'completed', 'cancelled', 'failed'],
    default: 'draft'
  },
  timeline: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    paymentDeadline: Date,
    deliveryDate: Date
  },
  location: {
    region: String,
    district: String,
    pickupPoint: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  delivery: {
    method: {
      type: String,
      enum: ['pickup', 'delivery', 'both'],
      default: 'pickup'
    },
    fee: Number,
    notes: String
  },
  milestones: [{
    percentage: Number,
    discount: Number,
    reached: Boolean,
    reachedAt: Date
  }],
  rules: {
    maxParticipants: Number,
    minQuantityPerPerson: Number,
    maxQuantityPerPerson: Number,
    requiresApproval: Boolean,
    allowCancellation: Boolean,
    cancellationDeadline: Date
  },
  communications: [{
    type: {
      type: String,
      enum: ['update', 'reminder', 'milestone', 'completion']
    },
    message: String,
    sentAt: Date
  }],
  financials: {
    totalCollected: {
      type: Number,
      default: 0
    },
    platformFee: {
      type: Number,
      default: 0
    },
    organizerCommission: {
      type: Number,
      default: 0
    }
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: Number,
    comment: String,
    createdAt: Date
  }],
  tags: [String],
  visibility: {
    type: String,
    enum: ['public', 'private', 'community'],
    default: 'public'
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  }
}, {
  timestamps: true
});

groupBuySchema.index({ status: 1, 'timeline.endDate': 1 });
groupBuySchema.index({ organizer: 1 });
groupBuySchema.index({ 'location.region': 1, status: 1 });
groupBuySchema.index({ 'product.category': 1 });

groupBuySchema.methods.addParticipant = async function(userId, quantity) {
  const existingParticipant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    existingParticipant.quantity += quantity;
    existingParticipant.amount = existingParticipant.quantity * this.pricing.groupPrice;
  } else {
    this.participants.push({
      user: userId,
      quantity,
      amount: quantity * this.pricing.groupPrice
    });
  }
  
  this.quantity.current = this.participants.reduce((sum, p) => sum + p.quantity, 0);
  
  if (this.quantity.current >= this.quantity.minimum && this.status === 'open') {
    this.status = 'minimum_reached';
  }
  
  this.checkMilestones();
  
  await this.save();
  return this;
};

groupBuySchema.methods.checkMilestones = function() {
  const progress = (this.quantity.current / this.quantity.minimum) * 100;
  
  this.milestones.forEach(milestone => {
    if (progress >= milestone.percentage && !milestone.reached) {
      milestone.reached = true;
      milestone.reachedAt = new Date();
    }
  });
};

groupBuySchema.methods.calculateSavings = function() {
  const originalTotal = this.quantity.current * this.pricing.originalPrice;
  const groupTotal = this.quantity.current * this.pricing.groupPrice;
  
  return {
    totalSavings: originalTotal - groupTotal,
    savingsPerUnit: this.pricing.originalPrice - this.pricing.groupPrice,
    savingsPercentage: ((this.pricing.originalPrice - this.pricing.groupPrice) / this.pricing.originalPrice) * 100
  };
};

module.exports = mongoose.model('GroupBuy', groupBuySchema);



