const express = require('express');
const router = express.Router();
const ExchangeRate = require('../models/ExchangeRate');

// Get all exchange rates
router.get('/', async (req, res) => {
  try {
    const rates = await ExchangeRate.find()
      .sort({ lastUpdated: -1 })
      .lean();
    
    // Group by base currency
    const grouped = rates.reduce((acc, rate) => {
      if (!acc[rate.baseCurrency]) {
        acc[rate.baseCurrency] = {};
      }
      acc[rate.baseCurrency][rate.targetCurrency] = {
        rate: rate.rate,
        lastUpdated: rate.lastUpdated
      };
      return acc;
    }, {});
    
    res.json({
      rates: grouped,
      lastUpdated: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific exchange rate
router.get('/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;
    
    if (from === to) {
      return res.json({ rate: 1, from, to });
    }
    
    const rate = await ExchangeRate.getRate(from, to);
    
    if (!rate) {
      return res.status(404).json({ 
        error: 'Exchange rate not found',
        from,
        to
      });
    }
    
    res.json({ rate, from, to });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Convert amount
router.post('/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.body;
    
    if (amount === undefined || !from || !to) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, from, to' 
      });
    }
    
    if (from === to) {
      return res.json({
        originalAmount: amount,
        convertedAmount: amount,
        from,
        to,
        rate: 1
      });
    }
    
    const rate = await ExchangeRate.getRate(from, to);
    
    if (!rate) {
      return res.status(404).json({ 
        error: 'Exchange rate not found',
        from,
        to
      });
    }
    
    const convertedAmount = amount * rate;
    
    res.json({
      originalAmount: amount,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      from,
      to,
      rate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get supported currencies
router.get('/currencies/supported', async (req, res) => {
  const currencies = {
    TZS: { name: 'Tanzanian Shilling', symbol: 'TSh', country: 'Tanzania' },
    KES: { name: 'Kenyan Shilling', symbol: 'KSh', country: 'Kenya' },
    USD: { name: 'US Dollar', symbol: '$', country: 'United States' },
    EUR: { name: 'Euro', symbol: '€', country: 'European Union' },
    GBP: { name: 'British Pound', symbol: '£', country: 'United Kingdom' }
  };
  
  res.json({ currencies });
});

// Admin: Update exchange rate
router.post('/', async (req, res) => {
  try {
    const { baseCurrency, targetCurrency, rate, source = 'manual' } = req.body;
    
    // Upsert exchange rate
    const exchangeRate = await ExchangeRate.findOneAndUpdate(
      { baseCurrency, targetCurrency },
      { rate, source, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    
    // Also create inverse rate
    await ExchangeRate.findOneAndUpdate(
      { baseCurrency: targetCurrency, targetCurrency: baseCurrency },
      { rate: 1 / rate, source: 'calculated', lastUpdated: new Date() },
      { upsert: true, new: true }
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
