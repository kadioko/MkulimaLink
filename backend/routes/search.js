const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

/**
 * Search and autocomplete endpoints
 */

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
      status: 'available'
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
      page = 1,
      limit = 20
    } = req.query;

    // Build search filter
    const filter = { status: 'available' };

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
        .populate('seller', 'name email phone location')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);

    // Add search metadata
    const results = products.map(product => ({
      ...product,
      relevanceScore: calculateRelevanceScore(product, query)
    }));

    // Sort by relevance if there's a text query
    if (query) {
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    res.json({
      products: results,
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
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
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
function calculateRelevanceScore(product, query) {
  if (!query) return 0;
  
  let score = 0;
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
  
  return score;
}

module.exports = router;
