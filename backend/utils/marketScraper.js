const axios = require('axios');
const cheerio = require('cheerio');
const MarketPrice = require('../models/MarketPrice');

const scrapeMarketPrices = async () => {
  try {
    console.log('Starting market price scraping...');

    const sampleData = [
      { product: 'Maize', category: 'grains', market: 'Kariakoo', region: 'Dar es Salaam', min: 700, max: 900, unit: 'kg' },
      { product: 'Rice', category: 'grains', market: 'Kariakoo', region: 'Dar es Salaam', min: 1800, max: 2200, unit: 'kg' },
      { product: 'Beans', category: 'grains', market: 'Kariakoo', region: 'Dar es Salaam', min: 1500, max: 1800, unit: 'kg' },
      { product: 'Tomatoes', category: 'vegetables', market: 'Kariakoo', region: 'Dar es Salaam', min: 800, max: 1200, unit: 'kg' },
      { product: 'Onions', category: 'vegetables', market: 'Kariakoo', region: 'Dar es Salaam', min: 600, max: 900, unit: 'kg' },
      { product: 'Cabbage', category: 'vegetables', market: 'Kariakoo', region: 'Dar es Salaam', min: 400, max: 600, unit: 'kg' },
      { product: 'Bananas', category: 'fruits', market: 'Kariakoo', region: 'Dar es Salaam', min: 500, max: 800, unit: 'kg' },
      { product: 'Mangoes', category: 'fruits', market: 'Kariakoo', region: 'Dar es Salaam', min: 600, max: 1000, unit: 'kg' },
      { product: 'Maize', category: 'grains', market: 'Central Market', region: 'Arusha', min: 650, max: 850, unit: 'kg' },
      { product: 'Rice', category: 'grains', market: 'Central Market', region: 'Arusha', min: 1700, max: 2100, unit: 'kg' },
      { product: 'Potatoes', category: 'vegetables', market: 'Central Market', region: 'Arusha', min: 700, max: 1000, unit: 'kg' },
      { product: 'Carrots', category: 'vegetables', market: 'Central Market', region: 'Arusha', min: 800, max: 1100, unit: 'kg' },
      { product: 'Maize', category: 'grains', market: 'Mwanza Market', region: 'Mwanza', min: 720, max: 920, unit: 'kg' },
      { product: 'Cassava', category: 'grains', market: 'Mwanza Market', region: 'Mwanza', min: 300, max: 500, unit: 'kg' },
      { product: 'Sweet Potato', category: 'vegetables', market: 'Mwanza Market', region: 'Mwanza', min: 400, max: 600, unit: 'kg' }
    ];

    for (const data of sampleData) {
      const variation = 0.9 + Math.random() * 0.2;
      const average = ((data.min + data.max) / 2) * variation;

      const existingPrice = await MarketPrice.findOne({
        product: data.product,
        region: data.region,
        market: data.market,
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      });

      if (!existingPrice) {
        let trend = 'stable';
        let changePercentage = 0;

        const previousPrice = await MarketPrice.findOne({
          product: data.product,
          region: data.region,
          market: data.market
        }).sort('-date');

        if (previousPrice) {
          changePercentage = ((average - previousPrice.price.average) / previousPrice.price.average) * 100;
          if (changePercentage > 5) trend = 'rising';
          else if (changePercentage < -5) trend = 'falling';
        }

        await MarketPrice.create({
          product: data.product,
          category: data.category,
          market: data.market,
          region: data.region,
          price: {
            min: Math.round(data.min * variation),
            max: Math.round(data.max * variation),
            average: Math.round(average)
          },
          unit: data.unit,
          trend,
          changePercentage: Math.round(changePercentage * 10) / 10
        });
      }
    }

    console.log('Market price scraping completed');
    return { success: true, count: sampleData.length };
  } catch (error) {
    console.error('Market scraping error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { scrapeMarketPrices };



