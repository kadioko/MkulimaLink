const MarketPrice = require('../models/MarketPrice');
const Product = require('../models/Product');

const generateAIInsights = async (product) => {
  try {
    const similarProducts = await Product.find({
      category: product.category,
      status: 'active',
      _id: { $ne: product._id }
    }).limit(20);

    const marketPrices = await MarketPrice.find({
      category: product.category,
      region: product.location?.region
    }).sort('-date').limit(30);

    const avgMarketPrice = marketPrices.length > 0
      ? marketPrices.reduce((sum, p) => sum + p.price.average, 0) / marketPrices.length
      : product.price;

    const competitorCount = similarProducts.length;
    const avgCompetitorPrice = similarProducts.length > 0
      ? similarProducts.reduce((sum, p) => sum + p.price, 0) / similarProducts.length
      : product.price;

    let marketDemand = 'Medium';
    if (competitorCount > 15) marketDemand = 'High';
    else if (competitorCount < 5) marketDemand = 'Low';

    let priceRecommendation = avgMarketPrice;
    if (product.quality === 'premium') {
      priceRecommendation *= 1.15;
    } else if (product.quality === 'economy') {
      priceRecommendation *= 0.85;
    }

    const bestTimeToSell = new Date();
    bestTimeToSell.setDate(bestTimeToSell.getDate() + Math.floor(Math.random() * 14));

    let competitorAnalysis = `${competitorCount} similar products found. `;
    if (product.price < avgCompetitorPrice * 0.9) {
      competitorAnalysis += 'Your price is competitive. ';
    } else if (product.price > avgCompetitorPrice * 1.1) {
      competitorAnalysis += 'Consider lowering price to match market. ';
    } else {
      competitorAnalysis += 'Price is well-positioned. ';
    }

    return {
      marketDemand,
      priceRecommendation: Math.round(priceRecommendation),
      bestTimeToSell,
      competitorAnalysis
    };
  } catch (error) {
    console.error('AI insights generation error:', error);
    return {
      marketDemand: 'Unknown',
      priceRecommendation: product.price,
      bestTimeToSell: new Date(),
      competitorAnalysis: 'Unable to generate analysis'
    };
  }
};

module.exports = { generateAIInsights };



