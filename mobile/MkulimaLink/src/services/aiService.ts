/**
 * AI/ML Service Integration for MkulimaLink Mobile App
 * Provides hooks and services to consume AI predictions
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api/ml'; // Change for production

interface PricePredictionRequest {
  product_name: string;
  region: string;
  current_price: float;
  historical_prices?: number[];
  weather_data?: {
    temperature?: number;
    humidity?: number;
    rainfall?: number;
  };
}

interface PricePredictionResponse {
  product_name: string;
  region: string;
  current_price: number;
  predicted_prices: {
    '1d': number;
    '7d': number;
    '30d': number;
  };
  confidence_score: number;
  trend: 'upward' | 'downward' | 'stable';
  factors: {
    weather_impact: number;
    season_effect: number;
    market_demand: number;
    supply_changes: number;
  };
}

interface DiseaseDetectionRequest {
  image_data: string; // Base64 encoded image
  image_format: 'jpeg' | 'png';
  product_type?: string;
}

interface DiseaseDetectionResponse {
  disease_detected: boolean;
  disease_type?: string;
  severity_level: 'low' | 'medium' | 'high';
  confidence_score: number;
  recommendations: string[];
  treatment_suggestions: string[];
}

interface RecommendationRequest {
  user_id: string;
  context: {
    location?: string;
    farming_type?: string;
    budget_range?: [number, number];
    preferred_products?: string[];
  };
  limit?: number;
}

interface RecommendationResponse {
  user_id: string;
  recommendations: Array<{
    product_id: string;
    product_name: string;
    price: number;
    region: string;
    seller_rating: number;
    reason: string;
    confidence: number;
  }>;
  explanation: string;
}

// API Service Class
class AIService {
  private static instance: AIService;
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds for AI predictions
  });

  private constructor() {
    this.setupInterceptors();
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private setupInterceptors() {
    // Request interceptor for authentication
    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('AI API Error:', error);
        throw error;
      }
    );
  }

  async predictPrice(request: PricePredictionRequest): Promise<PricePredictionResponse> {
    try {
      const response = await this.api.post('/predict/price', request);

      // Cache prediction for offline access
      await this.cachePrediction('price', request, response.data);

      return response.data;
    } catch (error) {
      console.error('Price prediction failed:', error);
      throw error;
    }
  }

  async detectDisease(request: DiseaseDetectionRequest): Promise<DiseaseDetectionResponse> {
    try {
      const response = await this.api.post('/detect/disease', request);

      // Cache result for future reference
      await this.cachePrediction('disease', request, response.data);

      return response.data;
    } catch (error) {
      console.error('Disease detection failed:', error);
      throw error;
    }
  }

  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      const response = await this.api.post('/recommend', request);

      // Cache recommendations
      await this.cachePrediction('recommendations', request, response.data);

      return response.data;
    } catch (error) {
      console.error('Recommendations failed:', error);
      throw error;
    }
  }

  private async cachePrediction(type: string, request: any, response: any) {
    try {
      const cacheKey = `ai_cache_${type}_${Date.now()}`;
      const cacheData = {
        type,
        request,
        response,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache AI prediction:', error);
    }
  }

  async getCachedPredictions(type?: string): Promise<any[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        key.startsWith('ai_cache_') &&
        (!type || key.includes(`_${type}_`))
      );

      const cachedPredictions = [];

      for (const key of cacheKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (Date.now() < parsed.expiresAt) {
              cachedPredictions.push(parsed);
            } else {
              // Remove expired cache
              await AsyncStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted cache
          await AsyncStorage.removeItem(key);
        }
      }

      return cachedPredictions;
    } catch (error) {
      console.warn('Failed to get cached predictions:', error);
      return [];
    }
  }

  async clearCache(type?: string) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        key.startsWith('ai_cache_') &&
        (!type || key.includes(`_${type}_`))
      );

      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Failed to clear AI cache:', error);
    }
  }
}

// Create singleton instance
export const aiService = AIService.getInstance();

// React Hooks for AI Integration
export const usePricePrediction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predictPrice = useCallback(async (request: PricePredictionRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.predictPrice(request);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Prediction failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    predictPrice,
    loading,
    error,
  };
};

export const useDiseaseDetection = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectDisease = useCallback(async (request: DiseaseDetectionRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.detectDisease(request);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Detection failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    detectDisease,
    loading,
    error,
  };
};

export const useAIRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = useCallback(async (request: RecommendationRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.getRecommendations(request);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Recommendations failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getRecommendations,
    loading,
    error,
  };
};

export const useAICache = () => {
  const getCachedPredictions = useCallback(async (type?: string) => {
    return await aiService.getCachedPredictions(type);
  }, []);

  const clearCache = useCallback(async (type?: string) => {
    await aiService.clearCache(type);
  }, []);

  return {
    getCachedPredictions,
    clearCache,
  };
};

// AI Dashboard Hook
export const useAIDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    pricePredictions: [],
    diseaseDetections: [],
    recommendations: [],
    lastUpdated: null as Date | null,
  });

  const refreshDashboard = useCallback(async () => {
    try {
      const cachedData = await aiService.getCachedPredictions();

      const pricePredictions = cachedData.filter(item => item.type === 'price');
      const diseaseDetections = cachedData.filter(item => item.type === 'disease');
      const recommendations = cachedData.filter(item => item.type === 'recommendations');

      setDashboardData({
        pricePredictions,
        diseaseDetections,
        recommendations,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Failed to refresh AI dashboard:', error);
    }
  }, []);

  return {
    dashboardData,
    refreshDashboard,
  };
};

// Export types
export type {
  PricePredictionRequest,
  PricePredictionResponse,
  DiseaseDetectionRequest,
  DiseaseDetectionResponse,
  RecommendationRequest,
  RecommendationResponse,
};
