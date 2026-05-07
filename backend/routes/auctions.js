const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all active auctions
router.get('/active', async (req, res) => {
  try {
    const { category, region, country = 'TZ' } = req.query;
    const query = { 
      status: 'active',
      endTime: { $gt: new Date() }
    };
    
    if (category) query.category = category;
    if (region) query['location.region'] = region;
    if (country) query['location.country'] = country;
    
    const auctions = await Auction.find(query)
      .populate('product', 'name images category')
      .populate('seller', 'name profilePicture')
      .populate('bids.bidder', 'name')
      .sort({ endTime: 1 });
    
    // Add computed fields
    const auctionsWithStats = auctions.map(auction => ({
      ...auction.toObject(),
      timeLeft: Math.max(0, Math.floor((auction.endTime - new Date()) / 1000)),
      isEndingSoon: (auction.endTime - new Date()) < 5 * 60 * 1000, // 5 minutes
      currentBidder: auction.bids.length > 0 ? auction.bids[auction.bids.length - 1].bidder : null
    }));
    
    res.json(auctionsWithStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single auction
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('product')
      .populate('seller', 'name profilePicture location')
      .populate('bids.bidder', 'name profilePicture')
      .populate('winner', 'name');
    
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    
    const auctionObj = auction.toObject();
    auctionObj.timeLeft = Math.max(0, Math.floor((auction.endTime - new Date()) / 1000));
    auctionObj.timeLeftFormatted = formatTimeLeft(auctionObj.timeLeft);
    
    res.json(auctionObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new auction (seller only)
router.post('/', 
  auth,
  [
    body('productId').isMongoId(),
    body('startingBid').isFloat({ min: 0 }),
    body('minIncrement').optional().isFloat({ min: 1 }),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('reservePrice').optional().isFloat({ min: 0 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { productId, startingBid, minIncrement, startTime, endTime, reservePrice } = req.body;
      
      // Verify product exists and belongs to user
      const product = await Product.findOne({
        _id: productId,
        seller: req.user.id
      });
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found or not yours' });
      }
      
      const auction = new Auction({
        product: productId,
        seller: req.user.id,
        startingBid,
        currentBid: 0,
        minIncrement: minIncrement || 500,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        reservePrice,
        status: new Date(startTime) <= new Date() ? 'active' : 'upcoming',
        category: product.category,
        location: product.location
      });
      
      await auction.save();
      await auction.populate('product');
      
      res.status(201).json(auction);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Place bid
router.post('/:id/bid', auth, async (req, res) => {
  try {
    const { amount, autoBid = false, maxAutoBid = null } = req.body;
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    
    if (!auction.isActive()) {
      return res.status(400).json({ error: 'Auction is not active' });
    }
    
    if (auction.seller.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot bid on your own auction' });
    }
    
    const minBid = auction.currentBid > 0 
      ? auction.currentBid + auction.minIncrement 
      : auction.startingBid;
    
    if (amount < minBid) {
      return res.status(400).json({ 
        error: `Bid must be at least ${minBid}`,
        minBid
      });
    }
    
    // Check if user already has highest bid
    const highestBid = auction.getHighestBidder();
    if (highestBid && highestBid.bidder.toString() === req.user.id) {
      return res.status(400).json({ error: 'You already have the highest bid' });
    }
    
    // Add bid
    auction.bids.push({
      bidder: req.user.id,
      amount,
      autoBid,
      maxAutoBid
    });
    
    auction.currentBid = amount;
    
    // Check for auto-bids
    if (auction.bids.length > 1) {
      const outbidBid = highestBid;
      if (outbidBid && outbidBid.autoBid && outbidBid.maxAutoBid > amount) {
        const counterBid = Math.min(outbidBid.maxAutoBid, amount + auction.minIncrement);
        auction.bids.push({
          bidder: outbidBid.bidder,
          amount: counterBid,
          autoBid: true,
          maxAutoBid: outbidBid.maxAutoBid
        });
        auction.currentBid = counterBid;
      }
    }
    
    await auction.save();
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(`auction_${auction._id}`).emit('bid_placed', {
      auctionId: auction._id,
      bid: auction.bids[auction.bids.length - 1],
      currentBid: auction.currentBid
    });
    
    res.json({
      success: true,
      currentBid: auction.currentBid,
      bidCount: auction.bids.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Watch/unwatch auction
router.post('/:id/watch', auth, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    
    const userId = req.user.id;
    const isWatching = auction.watchers.includes(userId);
    
    if (isWatching) {
      auction.watchers = auction.watchers.filter(id => id.toString() !== userId);
    } else {
      auction.watchers.push(userId);
    }
    
    await auction.save();
    res.json({ watching: !isWatching, watcherCount: auction.watchers.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function
function formatTimeLeft(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

module.exports = router;
