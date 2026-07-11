const mongoose = require('mongoose');

const trackingEventSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  description: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const deliverySchema = new mongoose.Schema({
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'picked_up', 'in_transit', 'near_destination', 'delivered', 'failed', 'returned'],
    default: 'pending'
  },
  trackingNumber: {
    type: String,
    unique: true,
    required: true
  },
  pickup: {
    address: String,
    region: String,
    district: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactName: String,
    contactPhone: String,
    scheduledTime: Date,
    actualTime: Date,
    notes: String
  },
  dropoff: {
    address: String,
    region: String,
    district: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactName: String,
    contactPhone: String,
    scheduledTime: Date,
    actualTime: Date,
    notes: String
  },
  package: {
    weight: Number,
    weightUnit: {
      type: String,
      default: 'kg'
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    description: String,
    specialInstructions: String,
    isFragile: Boolean,
    requiresColdChain: Boolean
  },
  pricing: {
    basePrice: Number,
    distancePrice: Number,
    weightPrice: Number,
    urgencyPrice: Number,
    insurancePrice: Number,
    totalPrice: Number,
    currency: {
      type: String,
      default: 'TZS'
    },
    paidBy: {
      type: String,
      enum: ['seller', 'buyer', 'split'],
      default: 'buyer'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    }
  },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    updatedAt: Date
  },
  estimatedDelivery: Date,
  actualDelivery: Date,
  distance: Number,
  duration: Number,
  trackingHistory: [trackingEventSchema],
  proof: {
    type: {
      type: String,
      enum: ['signature', 'photo', 'code']
    },
    value: String,
    timestamp: Date
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    ratedAt: Date
  },
  issues: [{
    type: {
      type: String,
      enum: ['delay', 'damage', 'wrong_item', 'missing_item', 'other']
    },
    description: String,
    reportedAt: Date,
    resolvedAt: Date,
    resolution: String
  }]
}, {
  timestamps: true
});

deliverySchema.index({ trackingNumber: 1 });
deliverySchema.index({ transaction: 1 });
deliverySchema.index({ driver: 1, status: 1 });
deliverySchema.index({ 'pickup.region': 1, 'dropoff.region': 1 });

deliverySchema.pre('save', function(next) {
  if (!this.trackingNumber) {
    this.trackingNumber = 'MKL' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  next();
});

deliverySchema.methods.addTrackingEvent = async function(status, location, description, userId) {
  this.trackingHistory.push({
    status,
    location,
    description,
    updatedBy: userId
  });
  
  this.status = status;
  
  if (location?.latitude && location?.longitude) {
    this.currentLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      updatedAt: new Date()
    };
  }
  
  if (status === 'picked_up') {
    this.pickup.actualTime = new Date();
  } else if (status === 'delivered') {
    this.dropoff.actualTime = new Date();
    this.actualDelivery = new Date();
  }
  
  await this.save();
  return this;
};

deliverySchema.statics.calculatePrice = function(distance, weight, options = {}) {
  const basePrice = 2000;
  const pricePerKm = 500;
  const pricePerKg = 200;
  
  let total = basePrice;
  total += distance * pricePerKm;
  total += weight * pricePerKg;
  
  if (options.urgent) total *= 1.5;
  if (options.insurance) total += options.insuranceValue * 0.02;
  if (options.coldChain) total *= 1.3;
  
  return {
    basePrice,
    distancePrice: distance * pricePerKm,
    weightPrice: weight * pricePerKg,
    urgencyPrice: options.urgent ? total * 0.5 : 0,
    insurancePrice: options.insurance ? options.insuranceValue * 0.02 : 0,
    totalPrice: Math.round(total)
  };
};

module.exports = mongoose.model('Delivery', deliverySchema);



