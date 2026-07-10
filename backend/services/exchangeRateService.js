const axios = require('axios');
const ExchangeRate = require('../models/ExchangeRate');
const logger = require('../utils/logger');

const FALLBACK_RATES = {
  'TZS:USD': 0.00039,
  'USD:TZS': 2550,
  'TZS:KES': 0.051,
  'KES:TZS': 19.6,
  'KES:USD': 0.0077,
  'USD:KES': 129.5,
  'USD:EUR': 0.92,
  'EUR:USD': 1.09,
  'USD:GBP': 0.79,
  'GBP:USD': 1.27,
};

const CURRENCIES = ['TZS', 'KES', 'USD', 'EUR', 'GBP'];

async function fetchFromAPI(base) {
  try {
    const apiKey = process.env.EXCHANGERATE_API_KEY;
    const url = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`
      : `https://api.exchangerate-api.com/v4/latest/${base}`;

    const response = await axios.get(url, { timeout: 10000 });
    return response.data?.rates || null;
  } catch (error) {
    logger.warn(`Exchange rate API fetch failed for ${base}:`, error.message);
    return null;
  }
}

function getFallbackRate(from, to) {
  return FALLBACK_RATES[`${from}:${to}`] || null;
}

async function updateRates() {
  for (const base of CURRENCIES) {
    const rates = await fetchFromAPI(base);
    if (!rates) continue;

    const bulkOps = CURRENCIES.filter((target) => target !== base && rates[target])
      .map((target) => ({
        updateOne: {
          filter: { baseCurrency: base, targetCurrency: target },
          update: {
            $set: {
              rate: rates[target],
              source: 'api',
              lastUpdated: new Date()
            }
          },
          upsert: true
        }
      }));

    if (bulkOps.length > 0) {
      await ExchangeRate.bulkWrite(bulkOps);
      logger.info(`Updated ${bulkOps.length} exchange rates for ${base}`);
    }
  }
}

async function getRate(from, to) {
  if (from === to) return 1;

  const cached = await ExchangeRate.getRate(from, to);
  if (cached) return cached;

  const fallback = getFallbackRate(from, to);
  if (fallback) {
    await ExchangeRate.findOneAndUpdate(
      { baseCurrency: from, targetCurrency: to },
      { rate: fallback, source: 'manual', lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    return fallback;
  }

  await updateRates();
  return ExchangeRate.getRate(from, to);
}

async function getRatesForBase(base) {
  const rates = {};
  for (const target of CURRENCIES) {
    rates[target] = await getRate(base, target);
  }
  return rates;
}

async function convert(amount, from, to) {
  const rate = await getRate(from, to);
  if (!rate) throw new Error(`Exchange rate not found for ${from} to ${to}`);
  return amount * rate;
}

module.exports = {
  updateRates,
  getRate,
  getRatesForBase,
  convert,
  FALLBACK_RATES
};
