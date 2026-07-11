const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const RecentSearch = require('../models/RecentSearch');
const { protect } = require('../middleware/auth');
const { isSellerAvailableToday } = require('../services/marketplaceIntelligence');

router.get('/', protect, async (req, res) => {
  try {
    const [recentSearches, purchases] = await Promise.all([
      RecentSearch.find({ user: req.user._id }).sort({ lastSearchedAt: -1 }).limit(10).lean(),
      Transaction.find({ buyer: req.user._id }).populate('product', 'category').sort({ createdAt: -1 }).limit(10).lean()
    ]);

    const categories = [
      ...recentSearches.map((search) => search.filters?.category).filter(Boolean),
      ...purchases.map((tx) => tx.product?.category).filter(Boolean)
    ];

    const filter = {
      status: 'active',
      seller: { $ne: req.user._id }
    };
    if (categories.length > 0) filter.category = { $in: [...new Set(categories)] };
    if (req.user.location?.region) filter['location.region'] = req.user.location.region;

    let products = await Product.find(filter)
      .populate('seller', 'name rating verified verification location')
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    if (products.length < 6) {
      products = await Product.find({ status: 'active', seller: { $ne: req.user._id } })
        .populate('seller', 'name rating verified verification location')
        .sort({ views: -1, createdAt: -1 })
        .limit(12)
        .lean();
    }

    res.json({
      success: true,
      data: products.map((product) => ({
        ...product,
        sellerAvailableToday: isSellerAvailableToday(product),
        recommendationReasons: [
          product.location?.region === req.user.location?.region ? 'near_you' : null,
          categories.includes(product.category) ? 'category_interest' : null,
          product.seller?.verified || product.seller?.verification?.state === 'verified' ? 'verified_seller' : null
        ].filter(Boolean)
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;



