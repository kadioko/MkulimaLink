const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['tractor', 'harvester', 'planter', 'sprayer', 'irrigation', 'storage', 'transport', 'processing', 'hand_tools', 'other'],
    required: true
  },
  description: String,
  brand: String,
  model: String,
  year: Number,
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'needs_repair'],
    required: true
  },
  images: [String],
  specifications: {
    power: String,
    capacity: String,
    fuelType: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    weight: Number,
    features: [String]
  },
  availability: {
    status: {
      type: String,
      enum: ['available', 'rented', 'maintenance', 'unavailable'],
      default: 'available'
    },
    calendar: [{
      startDate: Date,
      endDate: Date,
      status: String,
      booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EquipmentBooking'
      }
    }]
  },
  pricing: {
    hourlyRate: Number,
    dailyRate: {
      type: Number,
      required: true
    },
    weeklyRate: Number,
    monthlyRate: Number,
    deposit: Number,
    currency: {
      type: String,
      default: 'TZS'
    },
    includesOperator: Boolean,
    operatorRate: Number,
    fuelIncluded: Boolean
  },
  location: {
    region: {
      type: String,
      required: true
    },
    district: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    deliveryRadius: Number,
    deliveryFee: Number
  },
  insurance: {
    required: Boolean,
    included: Boolean,
    provider: String,
    policyNumber: String
  },
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EquipmentBooking'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    }
  },
  maintenance: [{
    type: {
      type: String,
      enum: ['scheduled', 'repair', 'inspection']
    },
    description: String,
    cost: Number,
    date: Date,
    nextDue: Date,
    provider: String
  }],
  documents: [{
    type: {
      type: String,
      enum: ['registration', 'insurance', 'manual', 'certification']
    },
    name: String,
    url: String,
    expiryDate: Date
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [String]
}, {
  timestamps: true
});

const bookingSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  renter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    actualStartDate: Date,
    actualEndDate: Date,
    duration: Number,
    durationUnit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months'],
      default: 'days'
    }
  },
  pricing: {
    baseRate: Number,
    totalDays: Number,
    subtotal: Number,
    deposit: Number,
    deliveryFee: Number,
    operatorFee: Number,
    insuranceFee: Number,
    discount: Number,
    platformFee: Number,
    totalAmount: {
      type: Number,
      required: true
    }
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded'],
      default: 'pending'
    },
    method: String,
    transactions: [{
      type: {
        type: String,
        enum: ['payment', 'deposit', 'refund']
      },
      amount: Number,
      reference: String,
      date: Date
    }],
    depositReturned: Boolean,
    depositReturnDate: Date
  },
  delivery: {
    required: Boolean,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    scheduledTime: Date,
    actualTime: Date,
    returnScheduled: Date,
    returnActual: Date
  },
  operator: {
    required: Boolean,
    provided: Boolean,
    name: String,
    phone: String
  },
  purpose: String,
  farmDetails: {
    crop: String,
    farmSize: Number,
    location: String
  },
  condition: {
    beforeRental: {
      notes: String,
      images: [String],
      checkedAt: Date
    },
    afterRental: {
      notes: String,
      images: [String],
      checkedAt: Date
    },
    damages: [{
      description: String,
      cost: Number,
      images: [String]
    }]
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    refundAmount: Number
  },
  rating: {
    score: Number,
    comment: String,
    createdAt: Date
  }
}, {
  timestamps: true
});

equipmentSchema.index({ category: 1, 'availability.status': 1 });
equipmentSchema.index({ 'location.region': 1 });
equipmentSchema.index({ owner: 1 });
equipmentSchema.index({ 'pricing.dailyRate': 1 });

bookingSchema.index({ equipment: 1, status: 1 });
bookingSchema.index({ renter: 1 });
bookingSchema.index({ owner: 1 });
bookingSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });

equipmentSchema.methods.isAvailable = function(startDate, endDate) {
  return !this.availability.calendar.some(slot => 
    slot.status === 'booked' &&
    ((startDate >= slot.startDate && startDate < slot.endDate) ||
     (endDate > slot.startDate && endDate <= slot.endDate) ||
     (startDate <= slot.startDate && endDate >= slot.endDate))
  );
};

equipmentSchema.methods.calculateRentalPrice = function(startDate, endDate, options = {}) {
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  let baseRate = this.pricing.dailyRate;
  if (days >= 30 && this.pricing.monthlyRate) {
    baseRate = this.pricing.monthlyRate / 30;
  } else if (days >= 7 && this.pricing.weeklyRate) {
    baseRate = this.pricing.weeklyRate / 7;
  }
  
  let subtotal = baseRate * days;
  let operatorFee = options.withOperator && this.pricing.operatorRate ? this.pricing.operatorRate * days : 0;
  let deliveryFee = options.delivery ? (this.location.deliveryFee || 0) : 0;
  let platformFee = subtotal * 0.1;
  
  return {
    baseRate,
    days,
    subtotal,
    deposit: this.pricing.deposit || 0,
    operatorFee,
    deliveryFee,
    platformFee,
    totalAmount: subtotal + operatorFee + deliveryFee + platformFee + (this.pricing.deposit || 0)
  };
};

const Equipment = mongoose.model('Equipment', equipmentSchema);
const EquipmentBooking = mongoose.model('EquipmentBooking', bookingSchema);

module.exports = { Equipment, EquipmentBooking };



