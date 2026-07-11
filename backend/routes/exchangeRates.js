const express = require('express');
const router = express.Router();
const ExchangeRate = require('../models/ExchangeRate');
const exchangeRateService = require('../services/exchangeRateService');
const { success, error } = require('../utils/apiResponse');

// Get all exchange rates
router.get('/', async (req, res) => {
  try {
    const { base = 'TZS' } = req.query;
    const rates = await exchangeRateService.getRatesForBase(base);
    return success(res, rates, 'Exchange rates retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// Get supported currencies (must come before /:from/:to)
router.get('/currencies/supported', async (req, res) => {
  const currencies = {
    TZS: { name: 'Tanzanian Shilling', symbol: 'TSh', country: 'Tanzania' },
    KES: { name: 'Kenyan Shilling', symbol: 'KSh', country: 'Kenya' },
    USD: { name: 'US Dollar', symbol: '$', country: 'United States' },
    EUR: { name: 'Euro', symbol: '€', country: 'European Union' },
    GBP: { name: 'British Pound', symbol: '£', country: 'United Kingdom' }
  };

  return success(res, currencies, 'Supported currencies retrieved');
});

// Get specific exchange rate
router.get('/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;

    if (from === to) {
      return success(res, { rate: 1, from, to }, 'Exchange rate retrieved');
    }

    const rate = await exchangeRateService.getRate(from, to);

    if (!rate) {
      return error(res, 'Exchange rate not found', 404);
    }

    return success(res, { rate, from, to }, 'Exchange rate retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// Convert amount
router.post('/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.body;

    if (amount === undefined || !from || !to) {
      return error(res, 'Missing required fields: amount, from, to', 400);
    }

    if (from === to) {
      return success(res, {
        originalAmount: amount,
        convertedAmount: amount,
        from,
        to,
        rate: 1
      }, 'Amount converted');
    }

    const convertedAmount = await exchangeRateService.convert(amount, from, to);
    const rate = await exchangeRateService.getRate(from, to);

    return success(res, {
      originalAmount: amount,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      from,
      to,
      rate
    }, 'Amount converted');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

// Admin: Update exchange rate
router.post('/', async (req, res) => {
  try {
    const { baseCurrency, targetCurrency, rate, source = 'manual' } = req.body;
    
    // Upsert exchange rate
    const exchangeRate = await ExchangeRate.findOneAndUpdate(
      { baseCurrency, targetCurrency },
      { rate, source, lastUpdated: new Date() },
      { upsert: true, returnDocument: 'after' }
    );
    
    // Also create inverse rate
    await ExchangeRate.findOneAndUpdate(
      { baseCurrency: targetCurrency, targetCurrency: baseCurrency },
      { rate: 1 / rate, source: 'calculated', lastUpdated: new Date() },
      { upsert: true, returnDocument: 'after' }
    );
    
    res.json({ success: true, rate: exchangeRate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch convert multiple amounts
router.post('/convert/batch', async (req, res) => {
  try {
    const { items, targetCurrency } = req.body;
    // items = [{ amount, currency }]
    
    const results = await Promise.all(
      items.map(async (item) => {
        try {
          const rate = await ExchangeRate.getRate(item.currency, targetCurrency);
          return {
            original: item,
            converted: rate ? item.amount * rate : null,
            rate
          };
        } catch (err) {
          return {
            original: item,
            error: err.message
          };
        }
      })
    );
    
    res.json({ results, targetCurrency });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



