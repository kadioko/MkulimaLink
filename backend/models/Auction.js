const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  autoBid: {
    type: Boolean,
    default: false
  },
  maxAutoBid: {
    type: Number,
    default: null
  }
});

const auctionSchema = new mongoose.Schema({
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
  startingBid: {
    type: Number,
    required: true,
    min: 0
  },
  currentBid: {
    type: Number,
    default: 0
  },
  minIncrement: {
    type: Number,
    default: 500,
    min: 1
  },
  reservePrice: {
    type: Number,
    default: null
  },
  bids: [bidSchema],
  status: {
    type: String,
    enum: ['upcoming', 'active', 'ended', 'cancelled'],
    default: 'upcoming'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  category: String,
  location: {
    region: String,
    country: { type: String, default: 'TZ' }
  },
  totalBids: {
    type: Number,
    default: 0
  },
  bidderCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ category: 1, status: 1 });
auctionSchema.index({ location: 1 });

// Method to check if auction is active
auctionSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         now >= this.startTime && 
         now <= this.endTime;
};

// Method to get highest bidder
auctionSchema.methods.getHighestBidder = function() {
  if (this.bids.length === 0) return null;
  return this.bids.sort((a, b) => b.amount - a.amount)[0];
};

// Pre-save middleware to update counts
auctionSchema.pre('save', function(next) {
  this.totalBids = this.bids.length;
  const uniqueBidders = new Set(this.bids.map(b => b.bidder.toString()));
  this.bidderCount = uniqueBidders.size;
  next();
});

module.exports = mongoose.model('Auction', auctionSchema);
