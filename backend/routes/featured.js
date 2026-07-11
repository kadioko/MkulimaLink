const express = require('express');
const router = express.Router();
const FeaturedListing = require('../models/FeaturedListing');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const PACKAGES = {
  basic: { price: 5000, duration: 7, position: 'category' },
  premium: { price: 15000, duration: 14, position: 'top' },
  platinum: { price: 35000, duration: 30, position: 'carousel' }
};

router.post('/create', protect, async (req, res) => {
  try {
    const { productId, package } = req.body;

    if (!PACKAGES[package]) {
      return res.status(400).json({ message: 'Invalid package selected' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const existingFeatured = await FeaturedListing.findOne({
      product: productId,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (existingFeatured) {
      return res.status(400).json({ message: 'Product is already featured' });
    }

    const packageDetails = PACKAGES[package];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + packageDetails.duration);

    const featured = await FeaturedListing.create({
      product: productId,
      seller: req.user._id,
      package,
      price: packageDetails.price,
      duration: packageDetails.duration,
      startDate,
      endDate,
      position: packageDetails.position,
      status: 'active'
    });

    res.status(201).json({
      message: 'Product featured successfully!',
      featured,
      paymentAmount: packageDetails.price
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const { position, category } = req.query;

    const query = {
      status: 'active',
      endDate: { $gt: new Date() }
    };

    if (position) query.position = position;

    let featured = await FeaturedListing.find(query)
      .populate({
        path: 'product',
        populate: { path: 'seller', select: 'name rating location' }
      })
      .sort({ createdAt: -1 })
      .limit(20);

    if (category) {
      featured = featured.filter(f => f.product && f.product.category === category);
    }

    res.json(featured);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my-listings', protect, async (req, res) => {
  try {
    const listings = await FeaturedListing.find({ seller: req.user._id })
      .populate('product', 'name images price')
      .sort('-createdAt');

    const stats = {
      totalSpent: listings.reduce((sum, l) => sum + l.price, 0),
      totalImpressions: listings.reduce((sum, l) => sum + l.impressions, 0),
      totalClicks: listings.reduce((sum, l) => sum + l.clicks, 0),
      totalConversions: listings.reduce((sum, l) => sum + l.conversions, 0),
      totalRevenue: listings.reduce((sum, l) => sum + l.revenue, 0)
    };

    res.json({ listings, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/track-impression', async (req, res) => {
  try {
    const featured = await FeaturedListing.findById(req.params.id);
    if (featured && featured.status === 'active') {
      featured.impressions += 1;
      await featured.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/track-click', async (req, res) => {
  try {
    const featured = await FeaturedListing.findById(req.params.id);
    if (featured && featured.status === 'active') {
      featured.clicks += 1;
      await featured.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/track-conversion', async (req, res) => {
  try {
    const { revenue } = req.body;
    const featured = await FeaturedListing.findById(req.params.id);
    
    if (featured && featured.status === 'active') {
      featured.conversions += 1;
      featured.revenue += revenue || 0;
      await featured.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/packages', (req, res) => {
  res.json(PACKAGES);
});

module.exports = router;



