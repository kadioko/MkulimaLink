const express = require('express');
const router = express.Router();
const { protect, checkPremium } = require('../middleware/auth');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const MarketPrice = require('../models/MarketPrice');
const Wishlist = require('../models/Wishlist');
const { predictYield, generateRecommendations } = require('../utils/aiModels');

router.post('/yield-prediction', protect, checkPremium, async (req, res) => {
  try {
    const { cropType, farmSize, soilType, region, plantingDate, weatherData } = req.body;

    const prediction = await predictYield({
      cropType,
      farmSize,
      soilType,
      region,
      plantingDate,
      weatherData
    });

    res.json({
      cropType,
      predictedYield: prediction.yield,
      confidence: prediction.confidence,
      factors: prediction.factors,
      recommendations: prediction.recommendations,
      estimatedRevenue: prediction.estimatedRevenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/price-prediction', protect, checkPremium, async (req, res) => {
  try {
    const { product, region, quantity, targetDate } = req.body;

    const historicalPrices = await MarketPrice.find({
      product: new RegExp(product, 'i'),
      region
    }).sort('-date').limit(90);

    if (historicalPrices.length < 10) {
      return res.status(400).json({ 
        message: 'Insufficient historical data for accurate prediction' 
      });
    }

    const avgPrice = historicalPrices.reduce((sum, p) => sum + p.price.average, 0) / historicalPrices.length;
    const trend = historicalPrices[0].price.average > historicalPrices[historicalPrices.length - 1].price.average ? 'rising' : 'falling';
    
    const seasonalFactor = Math.sin((new Date(targetDate).getMonth() / 12) * Math.PI * 2) * 0.15 + 1;
    const trendFactor = trend === 'rising' ? 1.05 : 0.95;
    
    const predictedPrice = avgPrice * seasonalFactor * trendFactor;
    const estimatedRevenue = predictedPrice * quantity;

    res.json({
      product,
      region,
      currentPrice: historicalPrices[0].price.average,
      predictedPrice: Math.round(predictedPrice),
      confidence: 0.75 + Math.random() * 0.15,
      trend,
      estimatedRevenue: Math.round(estimatedRevenue),
      bestTimeToSell: new Date(targetDate),
      recommendation: trend === 'rising' ? 'Wait for better prices' : 'Sell soon before prices drop further'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get AI-powered product recommendations for user
router.post('/recommendations', protect, async (req, res) => {
  try {
    const { limit = 10, filters = {} } = req.body;
    const userId = req.user._id;
    const safeLimit = Math.min(Number(limit) || 10, 30);
    
    // Get user's wishlist for preference analysis
    const wishlist = await Wishlist.findOne({ user: userId }).populate('items.product', 'category');
    const wishlistCategories = wishlist ? 
      [...new Set(wishlist.items.map(item => item.product?.category).filter(Boolean))] : 
      [];
    
    // Get user's purchase history
    const userTransactions = await Transaction.find({ buyer: userId })
      .populate('product')
      .sort('-createdAt')
      .limit(20);
    
    const purchasedCategories = [...new Set(
      userTransactions.map(t => t.product?.category).filter(Boolean)
    )];
    
    // Build query based on user preferences and filters
    const query = { status: 'active' };
    
    if (filters.category) {
      query.category = filters.category;
    } else if (wishlistCategories.length > 0 || purchasedCategories.length > 0) {
      // Recommend from categories user likes
      const preferredCategories = [...new Set([...wishlistCategories, ...purchasedCategories])];
      query.category = { $in: preferredCategories };
    }
    
    if (filters.location) {
      query['location.region'] = filters.location;
    }
    
    if (filters.season) {
      // Add seasonal product filtering logic
      const seasonalCategories = getSeasonalCategories(filters.season);
      if (!filters.category) {
        query.category = { $in: seasonalCategories };
      }
    }
    
    // Get products with AI scoring
    let products = await Product.find(query)
      .populate('seller', 'name profilePicture verified rating location')
      .limit(safeLimit * 3); // Get more for ranking

    const marketAverages = await MarketPrice.aggregate([
      { $match: { category: { $in: [...new Set(products.map(p => p.category))] } } },
      { $sort: { date: -1 } },
      { $group: { _id: { category: '$category', region: '$region' }, avgPrice: { $avg: '$price.average' } } }
    ]);

    const marketLookup = marketAverages.reduce((acc, row) => {
      acc[`${row._id.category}:${row._id.region}`] = row.avgPrice;
      return acc;
    }, {});
    
    // Score products based on AI factors
    const scoredProducts = products.map(product => {
      let score = 50; // Base score
      
      // Factor 1: Quality (premium = higher score)
      if (product.quality === 'premium') score += 20;
      if (product.organic) score += 12;
      
      // Factor 2: Seller verification
      if (product.seller?.verified) score += 10;
      if (product.seller?.rating >= 4.5) score += 8;
      
      // Factor 3: Views/popularity
      score += Math.min((product.views || 0) * 0.5, 15);
      
      // Factor 4: Price competitiveness
      const marketAverage = marketLookup[`${product.category}:${product.location?.region}`];
      if (marketAverage && product.price <= marketAverage * 0.95) score += 14;
      else if (marketAverage && product.price <= marketAverage * 1.05) score += 8;
      
      // Factor 5: Recency
      const daysListed = (Date.now() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24);
      if (daysListed < 7) score += 10; // Fresh listings
      
      return {
        ...product.toObject(),
        aiScore: Math.min(Math.round(score), 100),
        matchReason: generateMatchReason(product, wishlistCategories, purchasedCategories),
        aiSignals: {
          verifiedSeller: !!product.seller?.verified,
          sellerRating: product.seller?.rating || 0,
          marketAverage: marketAverage ? Math.round(marketAverage) : null,
          pricePosition: marketAverage ? (product.price < marketAverage ? 'below_market' : product.price > marketAverage ? 'above_market' : 'at_market') : 'unknown',
          freshnessDays: Math.round(daysListed),
        }
      };
    });
    
    // Sort by AI score and take top results
    const recommendations = scoredProducts
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, safeLimit);
    
    res.json({
      products: recommendations,
      confidence: recommendations.length ? 0.88 : 0.4,
      totalAvailable: products.length,
      filters: { category: filters.category, location: filters.location }
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper function for seasonal categories
function getSeasonalCategories(season) {
  const seasonalMap = {
    'rainy': ['vegetables', 'fruits', 'grains'],
    'dry': ['grains', 'seeds', 'fertilizers'],
    'planting': ['seeds', 'fertilizers', 'equipment'],
    'harvest': ['grains', 'vegetables', 'fruits']
  };
  return seasonalMap[season] || ['grains', 'vegetables', 'fruits'];
}

// Generate human-readable match reason
function generateMatchReason(product, wishlistCategories, purchasedCategories) {
  if (wishlistCategories.includes(product.category)) {
    return 'Based on your wishlist';
  }
  if (purchasedCategories.includes(product.category)) {
    return 'Similar to your previous purchases';
  }
  if (product.quality === 'premium') {
    return 'Premium quality product';
  }
  if (product.organic) {
    return 'Organic certified';
  }
  return 'Trending in your region';
}

router.post('/buyer-matching', protect, async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId).populate('seller');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const recentBuyers = await Transaction.find({
      status: 'completed'
    })
    .populate('product')
    .populate('buyer', 'name phone location rating')
    .sort('-createdAt')
    .limit(100);

    const matches = recentBuyers
      .filter(t => {
        if (!t.product || !t.buyer) return false;
        const categoryMatch = t.product.category === product.category;
        const locationMatch = t.buyer.location && product.location && 
                             t.buyer.location.region === product.location.region;
        return categoryMatch || locationMatch;
      })
      .map(t => ({
        buyer: t.buyer,
        matchScore: calculateMatchScore(t, product),
        lastPurchase: t.createdAt,
        totalPurchases: recentBuyers.filter(rt => rt.buyer && rt.buyer._id.toString() === t.buyer._id.toString()).length
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    res.json({ matches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function calculateMatchScore(transaction, product) {
  let score = 0;
  
  if (transaction.product && transaction.product.category === product.category) score += 40;
  if (transaction.buyer && transaction.buyer.location && product.location &&
      transaction.buyer.location.region === product.location.region) score += 30;
  if (transaction.buyer && transaction.buyer.rating >= 4) score += 20;
  if (transaction.status === 'completed') score += 10;
  
  return score;
}

router.get('/insights/market', protect, checkPremium, async (req, res) => {
  try {
    const { category, region } = req.query;

    const query = {};
    if (category) query.category = category;
    if (region) query.region = region;

    const recentPrices = await MarketPrice.find(query)
      .sort('-date')
      .limit(30);

    const products = await Product.find({ 
      category, 
      status: 'active',
      'location.region': region 
    });

    const insights = {
      marketDemand: products.length > 20 ? 'High' : products.length > 10 ? 'Medium' : 'Low',
      averagePrice: recentPrices.reduce((sum, p) => sum + p.price.average, 0) / recentPrices.length,
      priceVolatility: calculateVolatility(recentPrices),
      competitionLevel: products.length,
      recommendations: generateRecommendations({ category, region, products, prices: recentPrices })
    };

    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function calculateVolatility(prices) {
  if (prices.length < 2) return 0;
  
  const values = prices.map(p => p.price.average);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return (stdDev / mean) * 100;
}

router.post('/recommendations/crop', protect, checkPremium, async (req, res) => {
  try {
    const { region, farmSize, soilType, budget } = req.body;

    const recommendations = [
      {
        crop: 'Maize',
        suitability: 85,
        expectedYield: farmSize * 2.5,
        estimatedRevenue: farmSize * 2.5 * 800,
        growingPeriod: '90-120 days',
        waterRequirement: 'Medium',
        marketDemand: 'High'
      },
      {
        crop: 'Rice',
        suitability: 78,
        expectedYield: farmSize * 3.0,
        estimatedRevenue: farmSize * 3.0 * 1200,
        growingPeriod: '120-150 days',
        waterRequirement: 'High',
        marketDemand: 'High'
      },
      {
        crop: 'Beans',
        suitability: 72,
        expectedYield: farmSize * 1.2,
        estimatedRevenue: farmSize * 1.2 * 1500,
        growingPeriod: '60-90 days',
        waterRequirement: 'Low',
        marketDemand: 'Medium'
      }
    ];

    res.json({ recommendations, region, farmSize });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
