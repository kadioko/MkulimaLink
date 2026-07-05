const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const SavedSearch = require('../models/SavedSearch');
const RecentSearch = require('../models/RecentSearch');
const { protect } = require('../middleware/auth');
const { getPriceRecommendation, isSellerAvailableToday } = require('../services/marketplaceIntelligence');

/**
 * Search and autocomplete endpoints
 */

const toRadians = (value) => (value * Math.PI) / 180;

const getDistanceKm = (fromLat, fromLng, toLat, toLng) => {
  if ([fromLat, fromLng, toLat, toLng].some((value) => value === undefined || value === null || Number.isNaN(Number(value)))) {
    return null;
  }

  const earthRadiusKm = 6371;
  const dLat = toRadians(Number(toLat) - Number(fromLat));
  const dLng = toRadians(Number(toLng) - Number(fromLng));
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(Number(fromLat))) * Math.cos(toRadians(Number(toLat))) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Autocomplete suggestions
router.get('/autocomplete', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    const regex = new RegExp(query, 'i');
    const suggestions = [];

    // Product suggestions
    const products = await Product.find({
      name: regex,
      status: 'active'
    })
    .select('name category')
    .limit(5)
    .lean();

    products.forEach(product => {
      suggestions.push({
        text: product.name,
        type: 'product',
        category: product.category,
        url: `/products/${product._id}`
      });
    });

    // Category suggestions
    const categories = await Product.distinct('category');
    const matchingCategories = categories.filter(cat => 
      cat.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3);

    matchingCategories.forEach(category => {
      suggestions.push({
        text: category,
        type: 'category',
        url: `/products?category=${encodeURIComponent(category)}`
      });
    });

    // Region suggestions
    const regions = await Product.distinct('location.region');
    const matchingRegions = regions.filter(region => 
      region.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3);

    matchingRegions.forEach(region => {
      suggestions.push({
        text: region,
        type: 'region',
        url: `/products?region=${encodeURIComponent(region)}`
      });
    });

    // Sort by relevance (exact matches first)
    suggestions.sort((a, b) => {
      const aExact = a.text.toLowerCase() === query.toLowerCase();
      const bExact = b.text.toLowerCase() === query.toLowerCase();
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.text.localeCompare(b.text);
    });

    res.json({ suggestions: suggestions.slice(0, limit) });
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/saved', protect, async (req, res) => {
  try {
    const searches = await SavedSearch.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: searches });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch saved searches' });
  }
});

router.post('/saved', protect, async (req, res) => {
  try {
    const { name, query, notify = true } = req.body;
    const savedSearch = await SavedSearch.create({ user: req.user._id, name, query, notify });
    res.status(201).json({ success: true, data: savedSearch });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save search' });
  }
});

router.delete('/saved/:id', protect, async (req, res) => {
  try {
    await SavedSearch.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Saved search deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete saved search' });
  }
});

router.get('/recent', protect, async (req, res) => {
  try {
    const searches = await RecentSearch.find({ user: req.user._id }).sort({ lastSearchedAt: -1 }).limit(20);
    res.json({ success: true, data: searches });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent searches' });
  }
});

router.post('/recent', protect, async (req, res) => {
  try {
    const { query, filters } = req.body;
    const search = await RecentSearch.findOneAndUpdate(
      { user: req.user._id, query: query || '' },
      { $set: { filters, lastSearchedAt: new Date() }, $inc: { count: 1 } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: search });
  } catch (error) {
    res.status(500).json({ error: 'Failed to store recent search' });
  }
});

// Advanced search
router.get('/', async (req, res) => {
  try {
    const {
      q: query,
      category,
      region,
      district,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      lat,
      lng,
      radiusKm,
      page = 1,
      limit = 20
    } = req.query;

    // Build search filter
    const filter = { status: 'active' };

    // Text search
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Location filters
    if (region) {
      filter['location.region'] = region;
    }

    if (district) {
      filter['location.district'] = district;
    }

    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute search with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name email phone location rating verified verification')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);

    // Add search metadata
    const results = await Promise.all(products
      .map(async product => {
        const distanceKm = getDistanceKm(
          lat,
          lng,
          product.location?.coordinates?.latitude,
          product.location?.coordinates?.longitude
        );
        const priceRecommendation = await getPriceRecommendation({
          category: product.category,
          region: product.location?.region,
          unit: product.unit,
          price: product.price
        });
        return {
          ...product,
          distanceKm,
          sellerBadge: product.seller?.verification?.state === 'verified' || product.seller?.verified ? 'verified' : 'unverified',
          sellerAvailableToday: isSellerAvailableToday(product),
          priceRecommendation,
          relevanceScore: calculateRelevanceScore(product, query, { category, region, distanceKm, priceRecommendation })
        };
      }));

    const filteredResults = results
      .filter(product => !radiusKm || (product.distanceKm !== null && product.distanceKm <= Number(radiusKm)));

    // Sort by relevance if there's a text query
    if (query) {
      filteredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    res.json({
      products: filteredResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: {
        query,
        category,
        region,
        district,
        minPrice,
        maxPrice,
        lat,
        lng,
        radiusKm,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Similar products
router.get('/similar/:productId', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const product = await Product.findById(req.params.productId).lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const products = await Product.find({
      _id: { $ne: product._id },
      status: 'active',
      $or: [
        { category: product.category },
        { 'location.region': product.location?.region },
        { name: { $regex: product.name.split(' ')[0], $options: 'i' } }
      ]
    })
      .populate('seller', 'name phone location rating verified verification')
      .limit(Number(limit) * 2)
      .lean();

    const results = products
      .map(candidate => ({
        ...candidate,
        sellerBadge: candidate.seller?.verification?.state === 'verified' || candidate.seller?.verified ? 'verified' : 'unverified',
        sellerAvailableToday: isSellerAvailableToday(candidate),
        relevanceScore: calculateRelevanceScore(candidate, product.name, {
          category: product.category,
          region: product.location?.region
        })
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, Number(limit));

    res.json({ products: results });
  } catch (error) {
    console.error('Similar products error:', error);
    res.status(500).json({ error: 'Failed to fetch similar products' });
  }
});

// Search suggestions for admin
router.get('/admin/suggestions', protect, async (req, res) => {
  try {
    const { type, query } = req.query;
    
    let results = [];
    
    switch (type) {
      case 'users':
        results = await User.find({
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { phone: { $regex: query, $options: 'i' } }
          ]
        })
        .select('name email phone role')
        .limit(10)
        .lean();
        break;
        
      case 'products':
        results = await Product.find({
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
          ]
        })
        .select('name category seller price')
        .populate('seller', 'name')
        .limit(10)
        .lean();
        break;
        
      default:
        results = [];
    }
    
    res.json({ results });
  } catch (error) {
    console.error('Admin search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Popular searches
router.get('/popular', async (req, res) => {
  try {
    // This would typically come from analytics data
    // For now, return hardcoded popular searches
    const popularSearches = [
      { query: 'tomatoes', count: 1234, type: 'product' },
      { query: 'vegetables', count: 987, type: 'category' },
      { query: 'dar es salaam', count: 856, type: 'region' },
      { query: 'maize', count: 743, type: 'product' },
      { query: 'fruits', count: 621, type: 'category' },
      { query: 'arusha', count: 512, type: 'region' },
      { query: 'onions', count: 489, type: 'product' },
      { query: 'livestock', count: 432, type: 'category' }
    ];

    res.json({ popularSearches });
  } catch (error) {
    console.error('Popular searches error:', error);
    res.status(500).json({ error: 'Failed to fetch popular searches' });
  }
});

// Search analytics (admin only)
router.get('/analytics', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // This would typically come from your analytics system
    // For now, return mock data
    const analytics = {
      totalSearches: 15420,
      uniqueSearchers: 3287,
      topQueries: [
        { query: 'tomatoes', count: 1234, conversions: 89 },
        { query: 'vegetables', count: 987, conversions: 67 },
        { query: 'maize', count: 743, conversions: 45 }
      ],
      searchTrends: [
        { date: '2026-01-01', searches: 432 },
        { date: '2026-01-02', searches: 456 },
        { date: '2026-01-03', searches: 398 }
      ],
      categoryBreakdown: [
        { category: 'vegetables', searches: 5432 },
        { category: 'fruits', searches: 3210 },
        { category: 'grains', searches: 2876 }
      ]
    };

    res.json(analytics);
  } catch (error) {
    console.error('Search analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch search analytics' });
  }
});

// Helper function to calculate relevance score
function calculateRelevanceScore(product, query, context = {}) {
  let score = 0;
  if (!query) {
    if (context.category && product.category === context.category) score += 25;
    if (context.region && product.location?.region === context.region) score += 20;
    return score;
  }
  
  const queryLower = query.toLowerCase();
  
  // Exact name match
  if (product.name.toLowerCase() === queryLower) {
    score += 100;
  }
  // Name starts with query
  else if (product.name.toLowerCase().startsWith(queryLower)) {
    score += 80;
  }
  // Name contains query
  else if (product.name.toLowerCase().includes(queryLower)) {
    score += 60;
  }
  
  // Description contains query
  if (product.description && product.description.toLowerCase().includes(queryLower)) {
    score += 30;
  }
  
  // Category matches
  if (product.category && product.category.toLowerCase().includes(queryLower)) {
    score += 40;
  }

  if (context.category && product.category === context.category) {
    score += 25;
  }

  if (context.region && product.location?.region === context.region) {
    score += 20;
  }

  if (product.createdAt) {
    const ageDays = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 20 - Math.floor(ageDays));
  }

  if (product.seller?.rating) {
    score += Number(product.seller.rating) * 4;
  }

  if (product.seller?.verified || product.seller?.verification?.state === 'verified') {
    score += 12;
  }

  if (product.fulfillment?.delivery) {
    score += 6;
  }

  if (isSellerAvailableToday(product)) {
    score += 8;
  }

  if (context.priceRecommendation && Math.abs(context.priceRecommendation.deltaPercent) <= 15) {
    score += 10;
  }

  if (typeof context.distanceKm === 'number') {
    score += Math.max(0, 20 - Math.floor(context.distanceKm / 10));
  }
  
  return score;
}

module.exports = router;
