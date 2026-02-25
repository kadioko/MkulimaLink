const express = require('express');
const router = express.Router();
const MarketPrice = require('../models/MarketPrice');
const { scrapeMarketPrices } = require('../utils/marketScraper');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 3600 });

router.get('/', async (req, res) => {
  try {
    const { country, category, region } = req.query;
    const cacheKey = `market_root_${country}_${category}_${region}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    const pipeline = [
      { $sort: { date: -1 } },
      { $group: { _id: { product: '$product', region: '$region' }, latestPrice: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$latestPrice' } },
      { $limit: 50 }
    ];

    const matchStage = {};
    if (category) matchStage.category = category;
    if (region) matchStage.region = region;
    if (Object.keys(matchStage).length > 0) pipeline.unshift({ $match: matchStage });

    const latestPrices = await MarketPrice.aggregate(pipeline);

    const prices = latestPrices.map(p => ({
      product: p.product,
      category: p.category,
      region: p.region,
      price: p.price?.average || p.price,
      unit: p.unit,
      trend: p.trend === 'rising' ? 'up' : p.trend === 'falling' ? 'down' : 'stable',
      priceChange: p.changePercentage || 0,
      date: p.date
    }));

    const result = { prices };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/prices', async (req, res) => {
  try {
    const { product, category, region, days = 30 } = req.query;
    
    const cacheKey = `prices_${product}_${category}_${region}_${days}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const query = {};
    if (product) query.product = new RegExp(product, 'i');
    if (category) query.category = category;
    if (region) query.region = region;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    query.date = { $gte: startDate };

    const prices = await MarketPrice.find(query)
      .sort('-date')
      .limit(100);

    cache.set(cacheKey, prices);
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/prices/latest', async (req, res) => {
  try {
    const { category, region } = req.query;
    
    const pipeline = [
      { $sort: { date: -1 } },
      {
        $group: {
          _id: { product: '$product', region: '$region' },
          latestPrice: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$latestPrice' } },
      { $limit: 50 }
    ];

    if (category) {
      pipeline.unshift({ $match: { category } });
    }
    if (region) {
      pipeline.unshift({ $match: { region } });
    }

    const latestPrices = await MarketPrice.aggregate(pipeline);
    res.json(latestPrices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/prices/trends/:product', async (req, res) => {
  try {
    const { product } = req.params;
    const { region, days = 90 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const query = {
      product: new RegExp(product, 'i'),
      date: { $gte: startDate }
    };
    if (region) query.region = region;

    const trends = await MarketPrice.find(query)
      .sort('date')
      .select('date price.average region market');

    const analysis = {
      product,
      dataPoints: trends.length,
      averagePrice: trends.reduce((sum, t) => sum + t.price.average, 0) / trends.length,
      minPrice: Math.min(...trends.map(t => t.price.average)),
      maxPrice: Math.max(...trends.map(t => t.price.average)),
      trends
    };

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/prices/refresh', async (req, res) => {
  try {
    await scrapeMarketPrices();
    cache.flushAll();
    res.json({ message: 'Market prices refreshed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/regions', async (req, res) => {
  try {
    const regions = await MarketPrice.distinct('region');
    res.json(regions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await MarketPrice.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
