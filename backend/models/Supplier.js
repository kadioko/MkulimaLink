const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['seeds', 'fertilizer', 'pesticides', 'equipment', 'livestock', 'packaging', 'transport', 'other'],
    required: true
  },
  description: String,
  logo: String,
  images: [String],
  products: [{
    name: String,
    category: String,
    description: String,
    price: Number,
    unit: String,
    minOrder: Number,
    inStock: Boolean,
    image: String
  }],
  location: {
    region: String,
    district: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contact: {
    phone: String,
    email: String,
    whatsapp: String,
    website: String
  },
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  deliveryOptions: {
    selfPickup: Boolean,
    localDelivery: Boolean,
    nationalDelivery: Boolean,
    deliveryFee: Number,
    freeDeliveryMinimum: Number
  },
  paymentMethods: [String],
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  certifications: [{
    name: String,
    issuer: String,
    validUntil: Date,
    document: String
  }],
  isVerified: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  stats: {
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    responseRate: { type: Number, default: 100 },
    avgResponseTime: { type: Number, default: 0 }
  },
  tags: [String]
}, {
  timestamps: true
});

supplierSchema.index({ type: 1, 'location.region': 1 });
supplierSchema.index({ businessName: 'text', description: 'text' });
supplierSchema.index({ 'ratings.average': -1 });

module.exports = mongoose.model('Supplier', supplierSchema);



