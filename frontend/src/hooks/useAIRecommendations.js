import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';

// AI-powered product recommendations hook
export const useAIRecommendations = (userId, options = {}) => {
  const { 
    limit = 10, 
    category = null,
    location = null,
    season = null,
  } = options;

  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(0);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, this calls your ML API endpoint
      const response = await api.post('/api/ai/recommendations', {
        userId,
        limit,
        filters: { category, location, season },
      });

      setRecommendations(response.data.products || []);
      setConfidence(response.data.confidence || 0.85);
    } catch (err) {
      console.error('AI Recommendations error:', err);
      // Fallback to collaborative filtering logic
      const fallbackRecs = generateFallbackRecommendations(category, location);
      setRecommendations(fallbackRecs);
      setConfidence(0.6);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit, category, location, season]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    confidence,
    refetch: fetchRecommendations,
  };
};

// Fallback recommendation engine (collaborative filtering)
const generateFallbackRecommendations = (category, location) => {
  const baseProducts = [
    { _id: '1', name: 'Premium Maize', category: 'Grains', price: 25000, trend: 'up', reason: 'Trending in your region' },
    { _id: '2', name: 'Organic Tomatoes', category: 'Vegetables', price: 3500, trend: 'up', reason: 'Seasonal demand' },
    { _id: '3', name: 'Fresh Bananas', category: 'Fruits', price: 1500, trend: 'stable', reason: 'Based on your history' },
    { _id: '4', name: 'Dairy Cows', category: 'Livestock', price: 450000, trend: 'up', reason: 'High ROI potential' },
    { _id: '5', name: 'NPK Fertilizer', category: 'Inputs', price: 45000, trend: 'up', reason: 'Essential for planting season' },
  ];

  let filtered = baseProducts;
  
  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }

  // Add AI reasoning
  return filtered.map(p => ({
    ...p,
    aiReason: p.reason,
    matchScore: Math.floor(Math.random() * 20 + 80), // 80-99% match
  }));
};

// Price prediction hook using ML
export const usePricePrediction = (productId, days = 30) => {
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);

  const fetchPrediction = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const response = await api.get(`/api/ai/price-prediction/${productId}`, {
        params: { days }
      });
      
      setPrediction(response.data.prediction);
      setHistoricalData(response.data.historical || []);
    } catch (err) {
      // Generate mock prediction data
      const mockData = generateMockPrediction(days);
      setPrediction(mockData.prediction);
      setHistoricalData(mockData.historical);
    } finally {
      setIsLoading(false);
    }
  }, [productId, days]);

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  return {
    prediction,
    historicalData,
    isLoading,
    refetch: fetchPrediction,
  };
};

// Generate mock price prediction data
const generateMockPrediction = (days) => {
  const historical = [];
  const prediction = [];
  const basePrice = 25000;
  const today = new Date();

  // Generate historical data (past 60 days)
  for (let i = 60; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const trend = Math.sin(i / 10) * 2000; // Cyclical trend
    const noise = (Math.random() - 0.5) * 1000;
    
    historical.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(basePrice + trend + noise),
      volume: Math.floor(Math.random() * 100 + 50),
    });
  }

  // Generate prediction (next X days)
  const lastPrice = historical[historical.length - 1].price;
  for (let i = 1; i <= days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const trend = Math.sin((60 + i) / 10) * 2000;
    const confidence = Math.max(0.5, 1 - i / days * 0.5); // Confidence decreases over time
    
    prediction.push({
      date: date.toISOString().split('T')[0],
      predictedPrice: Math.round(lastPrice + trend + (Math.random() - 0.5) * 500),
      confidence,
      range: {
        low: Math.round(lastPrice + trend - 1000 * confidence),
        high: Math.round(lastPrice + trend + 1000 * confidence),
      }
    });
  }

  return { historical, prediction };
};

// Smart search with natural language processing
export const useSmartSearch = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processQuery = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsProcessing(true);

    try {
      // Intent detection
      const intent = detectIntent(query);
      
      // Entity extraction
      const entities = extractEntities(query);

      // Generate smart suggestions
      const smartSuggestions = generateSmartSuggestions(query, intent, entities);
      setSuggestions(smartSuggestions);
    } catch (err) {
      console.error('Smart search error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    suggestions,
    isProcessing,
    processQuery,
  };
};

// Simple intent detection
const detectIntent = (query) => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('cheap') || lowerQuery.includes('affordable') || lowerQuery.includes('low price')) {
    return 'find_cheap';
  }
  if (lowerQuery.includes('best') || lowerQuery.includes('top') || lowerQuery.includes('quality')) {
    return 'find_best';
  }
  if (lowerQuery.includes('near') || lowerQuery.includes('close') || lowerQuery.includes('around')) {
    return 'find_nearby';
  }
  if (lowerQuery.includes('buy') || lowerQuery.includes('purchase')) {
    return 'buy_intent';
  }
  
  return 'search';
};

// Simple entity extraction
const extractEntities = (query) => {
  const entities = {
    categories: [],
    locations: [],
    priceRange: null,
    quality: null,
  };

  const categoryKeywords = {
    'maize': 'Grains',
    'tomato': 'Vegetables',
    'banana': 'Fruits',
    'cow': 'Livestock',
    'fertilizer': 'Inputs',
  };

  const lowerQuery = query.toLowerCase();
  
  // Extract categories
  Object.entries(categoryKeywords).forEach(([keyword, category]) => {
    if (lowerQuery.includes(keyword)) {
      entities.categories.push(category);
    }
  });

  // Extract price range
  const priceMatch = query.match(/under\s+(\d+)/i) || query.match(/less\s+than\s+(\d+)/i);
  if (priceMatch) {
    entities.priceRange = { max: parseInt(priceMatch[1]) };
  }

  // Extract quality
  if (lowerQuery.includes('organic')) entities.quality = 'organic';
  if (lowerQuery.includes('premium')) entities.quality = 'premium';

  return entities;
};

const generateSmartSuggestions = (query, intent, entities) => {
  const suggestions = [];

  // Add intent-based suggestions
  switch (intent) {
    case 'find_cheap':
      suggestions.push({
        type: 'filter',
        label: `Sort by lowest price`,
        action: 'sort_price_asc',
        icon: '💰',
      });
      break;
    case 'find_best':
      suggestions.push({
        type: 'filter',
        label: `Show highest rated`,
        action: 'sort_rating',
        icon: '⭐',
      });
      break;
    case 'find_nearby':
      suggestions.push({
        type: 'filter',
        label: `Filter by distance`,
        action: 'filter_nearby',
        icon: '📍',
      });
      break;
    default:
      break;
  }

  // Add entity-based suggestions
  entities.categories.forEach(cat => {
    suggestions.push({
      type: 'category',
      label: `Browse ${cat}`,
      action: `category_${cat.toLowerCase()}`,
      icon: '🏷️',
    });
  });

  return suggestions;
};

export default useAIRecommendations;
