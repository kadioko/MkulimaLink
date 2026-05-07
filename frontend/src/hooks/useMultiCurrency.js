import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCountryStore, COUNTRIES } from '../store/countryStore';

// Exchange rates (in production, fetch from API)
const EXCHANGE_RATES = {
  TZS: { USD: 0.00039, EUR: 0.00036, GBP: 0.00031, KES: 0.057 },
  KES: { USD: 0.0069, EUR: 0.0063, GBP: 0.0054, TZS: 17.5 },
  USD: { TZS: 2550, KES: 145, EUR: 0.92, GBP: 0.79 },
  EUR: { TZS: 2770, KES: 157, USD: 1.09, GBP: 0.86 },
  GBP: { TZS: 3220, KES: 183, USD: 1.27, EUR: 1.16 },
};

// Currency symbols and formatting
const CURRENCY_CONFIG = {
  TZS: { symbol: 'TSh', locale: 'sw-TZ', decimals: 0, position: 'before' },
  KES: { symbol: 'KSh', locale: 'sw-KE', decimals: 0, position: 'before' },
  USD: { symbol: '$', locale: 'en-US', decimals: 2, position: 'before' },
  EUR: { symbol: '€', locale: 'de-DE', decimals: 2, position: 'after' },
  GBP: { symbol: '£', locale: 'en-GB', decimals: 2, position: 'before' },
};

export const useMultiCurrency = (userCurrency = null) => {
  const { country, getCurrency } = useCountryStore();
  const [baseCurrency, setBaseCurrency] = useState(userCurrency || getCurrency());
  const [rates, setRates] = useState(EXCHANGE_RATES);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch live rates (mock implementation)
  const fetchLiveRates = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production: const response = await api.get('/api/exchange-rates');
      // setRates(response.data);
      
      // Mock: Add slight random variations to simulate live rates
      const newRates = { ...EXCHANGE_RATES };
      Object.keys(newRates).forEach(from => {
        Object.keys(newRates[from]).forEach(to => {
          const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
          newRates[from][to] = EXCHANGE_RATES[from][to] * (1 + variation);
        });
      });
      
      setRates(newRates);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh rates every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchLiveRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLiveRates]);

  // Convert amount from one currency to another
  const convert = useCallback((amount, from = baseCurrency, to = baseCurrency) => {
    if (from === to) return amount;
    
    const rate = rates[from]?.[to];
    if (!rate) return amount;
    
    return amount * rate;
  }, [rates, baseCurrency]);

  // Format amount for display
  const format = useCallback((amount, currency = baseCurrency, showSymbol = true) => {
    const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
    const formatted = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(amount);

    if (!showSymbol) return formatted;

    return config.position === 'before' 
      ? `${config.symbol}${formatted}` 
      : `${formatted} ${config.symbol}`;
  }, [baseCurrency]);

  // Convert and format in one step
  const convertAndFormat = useCallback((amount, from, to = baseCurrency) => {
    const converted = convert(amount, from, to);
    return format(converted, to);
  }, [convert, format, baseCurrency]);

  // Price range formatting
  const formatRange = useCallback((min, max, currency = baseCurrency) => {
    if (min === max) return format(min, currency);
    return `${format(min, currency)} - ${format(max, currency)}`;
  }, [format, baseCurrency]);

  // Get supported currencies for current country
  const supportedCurrencies = useMemo(() => {
    const countryData = COUNTRIES[country];
    if (!countryData) return ['USD'];
    
    return [countryData.currency, 'USD'];
  }, [country]);

  return {
    baseCurrency,
    setBaseCurrency,
    rates,
    convert,
    format,
    convertAndFormat,
    formatRange,
    supportedCurrencies,
    allCurrencies: Object.keys(CURRENCY_CONFIG),
    currencyConfig: CURRENCY_CONFIG,
    lastUpdated,
    isLoading,
    refreshRates: fetchLiveRates,
  };
};

// Hook for price history and trends
export const usePriceHistory = (productId, days = 30) => {
  const [history, setHistory] = useState([]);
  const [trend, setTrend] = useState(null); // 'up', 'down', 'stable'
  const [averagePrice, setAveragePrice] = useState(0);
  const [volatility, setVolatility] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production: const response = await api.get(`/api/products/${productId}/price-history`);
      
      // Generate mock historical data
      const data = [];
      const basePrice = 25000;
      const today = new Date();
      
      for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Simulate market trends with some randomness
        const trend = Math.sin(i / 5) * 2000;
        const noise = (Math.random() - 0.5) * 1500;
        const price = Math.max(0, basePrice + trend + noise);
        
        data.push({
          date: date.toISOString().split('T')[0],
          price: Math.round(price),
          volume: Math.floor(Math.random() * 100 + 20),
        });
      }
      
      setHistory(data);
      
      // Calculate trend
      const firstPrice = data[0].price;
      const lastPrice = data[data.length - 1].price;
      const change = ((lastPrice - firstPrice) / firstPrice) * 100;
      
      if (change > 5) setTrend('up');
      else if (change < -5) setTrend('down');
      else setTrend('stable');
      
      // Calculate average
      const avg = data.reduce((sum, d) => sum + d.price, 0) / data.length;
      setAveragePrice(Math.round(avg));
      
      // Calculate volatility (standard deviation)
      const variance = data.reduce((sum, d) => sum + Math.pow(d.price - avg, 2), 0) / data.length;
      setVolatility(Math.round(Math.sqrt(variance)));
      
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    trend,
    averagePrice,
    volatility,
    isLoading,
    refresh: fetchHistory,
  };
};

// Smart pricing recommendations
export const useSmartPricing = (productCategory, location, quality) => {
  const [suggestedPrice, setSuggestedPrice] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [marketAnalysis, setMarketAnalysis] = useState(null);

  useEffect(() => {
    // Simulate market analysis
    const basePrices = {
      'Grains': { min: 15000, max: 35000, avg: 25000 },
      'Vegetables': { min: 1000, max: 8000, avg: 3500 },
      'Fruits': { min: 800, max: 5000, avg: 2000 },
      'Livestock': { min: 200000, max: 800000, avg: 450000 },
      'Inputs': { min: 10000, max: 100000, avg: 45000 },
    };

    const base = basePrices[productCategory] || { min: 1000, max: 50000, avg: 25000 };
    
    // Adjust for quality
    const qualityMultiplier = {
      'economy': 0.7,
      'standard': 1,
      'premium': 1.4,
      'organic': 1.6,
    }[quality] || 1;

    // Adjust for location (mock regional variations)
    const locationMultiplier = {
      'Dar es Salaam': 1.1,
      'Arusha': 0.95,
      'Mwanza': 0.9,
      'Mbeya': 0.85,
    }[location] || 1;

    setSuggestedPrice(Math.round(base.avg * qualityMultiplier * locationMultiplier));
    setPriceRange({
      min: Math.round(base.min * qualityMultiplier * locationMultiplier),
      max: Math.round(base.max * qualityMultiplier * locationMultiplier),
    });

    setMarketAnalysis({
      demandLevel: Math.random() > 0.5 ? 'high' : 'medium',
      competitionLevel: Math.random() > 0.6 ? 'high' : 'low',
      bestTimeToSell: ['Morning', 'Weekend', 'Market Day'][Math.floor(Math.random() * 3)],
    });
  }, [productCategory, location, quality]);

  return {
    suggestedPrice,
    priceRange,
    marketAnalysis,
  };
};

export default useMultiCurrency;
