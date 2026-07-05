const MarketPrice = require('../models/MarketPrice');
const Transaction = require('../models/Transaction');
const { CATEGORY_EXPIRY_DAYS } = require('../config/marketplaceMeta');

const getCategoryExpiryDate = (category, now = new Date()) => {
  const days = CATEGORY_EXPIRY_DAYS[category] || Number.parseInt(process.env.LISTING_EXPIRY_DAYS || '45', 10);
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
};

const getSellerVerificationState = (seller) => seller?.verification?.state || (seller?.verified ? 'verified' : 'unverified');

const isSellerAvailableToday = (product, now = new Date()) => {
  const days = product.availability?.days;
  if (!Array.isArray(days) || days.length === 0) return true;

  const today = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  return days.map((day) => String(day).toLowerCase()).includes(today);
};

const getPriceRecommendation = async ({ category, region, unit, price }) => {
  if (!category || !region) return null;

  const marketPrice = await MarketPrice.findOne({
    category,
    region,
    ...(unit ? { unit } : {})
  }).sort({ date: -1 }).lean();

  if (!marketPrice?.price?.average) return null;

  const average = marketPrice.price.average;
  const suggestedMin = Math.round(average * 0.9);
  const suggestedMax = Math.round(average * 1.1);
  const deltaPercent = price ? Math.round(((Number(price) - average) / average) * 100) : 0;

  return {
    marketAverage: average,
    suggestedRange: { min: suggestedMin, max: suggestedMax },
    confidence: marketPrice.source === 'seed' ? 'demo' : 'medium',
    trend: marketPrice.trend || 'stable',
    changePercentage: marketPrice.changePercentage || 0,
    deltaPercent,
    message: price
      ? `Your price is ${Math.abs(deltaPercent)}% ${deltaPercent >= 0 ? 'above' : 'below'} the regional average.`
      : `Suggested ${unit || 'unit'} price is ${suggestedMin}-${suggestedMax}.`
  };
};

const scoreToFlag = (score) => {
  if (score >= 80) return 'blocked';
  if (score >= 55) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
};

const calculateProductRisk = async (product) => {
  const seller = product.seller;
  let score = 0;
  const reasons = [];

  const sellerCreatedAt = seller?.createdAt ? new Date(seller.createdAt) : null;
  if (sellerCreatedAt && Date.now() - sellerCreatedAt.getTime() < 14 * 24 * 60 * 60 * 1000) {
    score += 20;
    reasons.push('new_seller');
  }

  if (getSellerVerificationState(seller) !== 'verified') {
    score += 25;
    reasons.push('seller_not_verified');
  }

  if (Number(product.quantity) > 1000) {
    score += 15;
    reasons.push('unusually_high_quantity');
  }

  const priceRecommendation = await getPriceRecommendation({
    category: product.category,
    region: product.location?.region,
    unit: product.unit,
    price: product.price
  });

  if (priceRecommendation && Math.abs(priceRecommendation.deltaPercent) >= 50) {
    score += 20;
    reasons.push('price_far_from_market_average');
  }

  if (seller?.location?.region && product.location?.region && seller.location.region !== product.location.region) {
    score += 10;
    reasons.push('seller_product_region_mismatch');
  }

  return {
    score: Math.min(score, 100),
    flag: scoreToFlag(score),
    reasons
  };
};

const calculateTransactionRisk = async (transaction) => {
  let score = 0;
  const reasons = [];
  const sellerId = transaction.seller?._id || transaction.seller;

  const cancelledCount = await Transaction.countDocuments({
    seller: sellerId,
    status: 'cancelled',
    createdAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
  });

  if (cancelledCount >= 3) {
    score += 25;
    reasons.push('seller_repeated_cancellations');
  }

  if (Number(transaction.totalAmount) >= 1000000) {
    score += 20;
    reasons.push('high_value_transaction');
  }

  if (transaction.product?.risk?.flag === 'high' || transaction.product?.risk?.flag === 'blocked') {
    score += 20;
    reasons.push('risky_product');
  }

  return {
    score: Math.min(score, 100),
    flag: scoreToFlag(score),
    reasons
  };
};

const buildFarmerInsights = async (product) => {
  const insights = [];
  const recommendation = await getPriceRecommendation({
    category: product.category,
    region: product.location?.region,
    unit: product.unit,
    price: product.price
  });

  if (recommendation) {
    insights.push(recommendation.message);
    if (recommendation.trend === 'rising') {
      insights.push(`Demand is rising in ${product.location?.region}.`);
    }
  }

  if (['vegetables', 'fruits', 'dairy'].includes(product.category)) {
    insights.push('Fresh listings in this category usually perform best in the first week.');
  }

  return insights;
};

module.exports = {
  getCategoryExpiryDate,
  getSellerVerificationState,
  isSellerAvailableToday,
  getPriceRecommendation,
  calculateProductRisk,
  calculateTransactionRisk,
  buildFarmerInsights
};
