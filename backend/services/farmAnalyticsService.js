/**
 * Farm Analytics Service
 * Provides comprehensive farm analytics, GPS mapping, satellite monitoring, and predictive forecasting
 */

const { FarmAnalytics, AnalyticsAlert } = require('../models/Analytics');
const { Product, Transaction, User } = require('../models');
const axios = require('axios');

class FarmAnalyticsService {
  constructor() {
    this.satelliteProviders = {
      sentinel_hub: {
        api_url: process.env.SENTINEL_HUB_API_URL,
        api_key: process.env.SENTINEL_HUB_API_KEY
      },
      openweather: {
        api_url: 'https://api.openweathermap.org',
        api_key: process.env.OPENWEATHER_API_KEY
      }
    };

    this.alertThresholds = {
      health_score_low: 40,
      roi_negative: 0,
      yield_below_expected: 0.7,
      high_risk_weather: 0.8,
      pest_risk_high: 0.7
    };
  }

  /**
   * Get or create farm analytics
   */
  async getOrCreateFarmAnalytics(userId, farmData) {
    try {
      let analytics = await FarmAnalytics.findOne({
        user_id: userId,
        farm_id: farmData.farm_id || userId
      });

      if (!analytics) {
        analytics = new FarmAnalytics({
          user_id: userId,
          farm_id: farmData.farm_id || userId,
          metrics: {
            total_area: farmData.total_area || 0,
            planted_area: 0,
            yield_estimate: 0,
            revenue_estimate: 0,
            expenses: 0,
            roi: 0,
            health_score: 50,
            productivity_index: 0
          },
          gps_data: {
            coordinates: farmData.coordinates || [0, 0],
            boundary: farmData.boundary || [],
            area_sqm: farmData.area_sqm || 0,
            elevation: farmData.elevation || 0,
            soil_type: farmData.soil_type || 'unknown'
          },
          satellite_data: {
            ndvi: 0,
            evi: 0,
            cloud_cover: 0,
            last_updated: new Date()
          },
          predictions: {
            yield_forecast: 0,
            confidence: 0,
            market_price_forecast: 0,
            demand_forecast: 0,
            risk_level: 'medium'
          }
        });

        await analytics.save();
      }

      return analytics;

    } catch (error) {
      console.error('Get or create farm analytics error:', error);
      throw error;
    }
  }

  /**
   * Update farm metrics
   */
  async updateFarmMetrics(userId, farmId, metricsData) {
    try {
      const analytics = await FarmAnalytics.findOne({
        user_id: userId,
        farm_id: farmId
      });

      if (!analytics) {
        throw new Error('Farm analytics not found');
      }

      // Update metrics
      if (metricsData.planted_area) analytics.metrics.planted_area = metricsData.planted_area;
      if (metricsData.expenses) analytics.metrics.expenses = metricsData.expenses;

      // Calculate derived metrics
      analytics.metrics.productivity_index = this.calculateProductivityIndex(
        metricsData.yield || 0,
        metricsData.expected_yield || 1
      );

      // Calculate ROI
      const revenue = metricsData.revenue || 0;
      const expenses = metricsData.expenses || 0;
      analytics.metrics.roi = expenses > 0 ? ((revenue - expenses) / expenses) * 100 : 0;

      // Calculate health score
      analytics.metrics.health_score = this.calculateHealthScore(metricsData);

      // Add to historical data
      analytics.historical_data.push({
        date: new Date(),
        metrics: { ...analytics.metrics },
        events: metricsData.events || []
      });

      // Keep only last 365 days of history
      if (analytics.historical_data.length > 365) {
        analytics.historical_data = analytics.historical_data.slice(-365);
      }

      await analytics.save();

      // Check for alerts
      await this.checkAndCreateAlerts(userId, farmId, analytics);

      return analytics;

    } catch (error) {
      console.error('Update farm metrics error:', error);
      throw error;
    }
  }

  /**
   * Update GPS data
   */
  async updateGPSData(userId, farmId, gpsData) {
    try {
      const analytics = await FarmAnalytics.findOne({
        user_id: userId,
        farm_id: farmId
      });

      if (!analytics) {
        throw new Error('Farm analytics not found');
      }

      analytics.gps_data = {
        coordinates: gpsData.coordinates || analytics.gps_data.coordinates,
        boundary: gpsData.boundary || analytics.gps_data.boundary,
        area_sqm: gpsData.area_sqm || this.calculateAreaFromBoundary(gpsData.boundary),
        elevation: gpsData.elevation || analytics.gps_data.elevation,
        soil_type: gpsData.soil_type || analytics.gps_data.soil_type
      };

      await analytics.save();

      return analytics;

    } catch (error) {
      console.error('Update GPS data error:', error);
      throw error;
    }
  }

  /**
   * Fetch and update satellite data
   */
  async updateSatelliteData(userId, farmId) {
    try {
      const analytics = await FarmAnalytics.findOne({
        user_id: userId,
        farm_id: farmId
      });

      if (!analytics || !analytics.gps_data.coordinates) {
        throw new Error('Farm GPS data not found');
      }

      const [longitude, latitude] = analytics.gps_data.coordinates;

      // Fetch satellite data from Sentinel Hub
      const satelliteData = await this.fetchSatelliteData(latitude, longitude);

      // Fetch weather data
      const weatherData = await this.fetchWeatherData(latitude, longitude);

      // Update satellite data
      analytics.satellite_data = {
        ndvi: satelliteData.ndvi || 0,
        evi: satelliteData.evi || 0,
        cloud_cover: satelliteData.cloud_cover || 0,
        last_updated: new Date()
      };

      // Update predictions based on satellite data
      await this.updatePredictions(analytics, satelliteData, weatherData);

      await analytics.save();

      return analytics;

    } catch (error) {
      console.error('Update satellite data error:', error);
      // Don't throw - satellite data is optional
      return null;
    }
  }

  /**
   * Get market trends for region
   */
  async getMarketTrends(region, crop, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get price data from transactions
      const transactions = await Transaction.find({
        'product.category': crop,
        'product.location.region': region,
        createdAt: { $gte: startDate }
      })
      .populate('product', 'price category')
      .sort({ createdAt: -1 });

      if (transactions.length === 0) {
        return {
          trend: 'insufficient_data',
          average_price: 0,
          min_price: 0,
          max_price: 0,
          price_change: 0
        };
      }

      const prices = transactions.map(t => t.product.price);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Calculate trend
      const firstWeekAvg = prices.slice(0, Math.ceil(prices.length / 4)).reduce((a, b) => a + b, 0) / Math.ceil(prices.length / 4);
      const lastWeekAvg = prices.slice(-Math.ceil(prices.length / 4)).reduce((a, b) => a + b, 0) / Math.ceil(prices.length / 4);
      const priceChange = ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100;

      const trend = priceChange > 5 ? 'increasing' : priceChange < -5 ? 'decreasing' : 'stable';

      return {
        trend,
        average_price: Math.round(avgPrice),
        min_price: minPrice,
        max_price: maxPrice,
        price_change: Math.round(priceChange * 100) / 100,
        transaction_count: transactions.length,
        data_points: prices.slice(0, 30) // Last 30 transactions
      };

    } catch (error) {
      console.error('Get market trends error:', error);
      throw error;
    }
  }

  /**
   * Get farm dashboard summary
   */
  async getFarmDashboard(userId, farmId) {
    try {
      const analytics = await FarmAnalytics.findOne({
        user_id: userId,
        farm_id: farmId
      });

      if (!analytics) {
        throw new Error('Farm analytics not found');
      }

      // Get recent alerts
      const recentAlerts = await AnalyticsAlert.find({
        user_id: userId,
        farm_id: farmId,
        status: 'active'
      })
      .sort({ created_at: -1 })
      .limit(5);

      // Get historical trend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const historicalData = analytics.historical_data.filter(
        h => new Date(h.date) >= thirtyDaysAgo
      );

      // Calculate trends
      const healthTrend = this.calculateTrend(historicalData.map(h => h.metrics.health_score));
      const roiTrend = this.calculateTrend(historicalData.map(h => h.metrics.roi));
      const productivityTrend = this.calculateTrend(historicalData.map(h => h.metrics.productivity_index));

      return {
        current_metrics: analytics.metrics,
        gps_data: analytics.gps_data,
        satellite_data: analytics.satellite_data,
        predictions: analytics.predictions,
        trends: {
          health_score: healthTrend,
          roi: roiTrend,
          productivity: productivityTrend
        },
        alerts: recentAlerts,
        historical_data: historicalData.slice(-30) // Last 30 days
      };

    } catch (error) {
      console.error('Get farm dashboard error:', error);
      throw error;
    }
  }

  /**
   * Get yield predictions
   */
  async getYieldPredictions(userId, farmId) {
    try {
      const analytics = await FarmAnalytics.findOne({
        user_id: userId,
        farm_id: farmId
      });

      if (!analytics) {
        throw new Error('Farm analytics not found');
      }

      // Get historical yield data
      const historicalYields = analytics.historical_data
        .filter(h => h.metrics.yield_estimate > 0)
        .map(h => ({
          date: h.date,
          yield: h.metrics.yield_estimate
        }))
        .slice(-12); // Last 12 months

      if (historicalYields.length < 3) {
        return {
          forecast: null,
          confidence: 0,
          message: 'Insufficient historical data for prediction'
        };
      }

      // Simple linear regression for prediction
      const forecast = this.predictYield(historicalYields, analytics.satellite_data);

      return {
        forecast: Math.round(forecast.predicted_yield),
        confidence: forecast.confidence,
        factors: forecast.factors,
        recommendations: forecast.recommendations
      };

    } catch (error) {
      console.error('Get yield predictions error:', error);
      throw error;
    }
  }

  /**
   * Get price forecasts
   */
  async getPriceForecast(region, crop) {
    try {
      const marketTrends = await this.getMarketTrends(region, crop, 90);

      if (marketTrends.trend === 'insufficient_data') {
        return {
          forecast: null,
          confidence: 0,
          message: 'Insufficient market data'
        };
      }

      // Simple forecast based on trend
      const currentPrice = marketTrends.average_price;
      const trend = marketTrends.price_change;

      let forecastPrice = currentPrice;
      if (trend > 0) {
        forecastPrice = currentPrice * (1 + (trend / 100) * 0.5); // 50% of trend continues
      } else if (trend < 0) {
        forecastPrice = currentPrice * (1 + (trend / 100) * 0.3); // 30% of trend continues
      }

      return {
        current_price: Math.round(currentPrice),
        forecast_price: Math.round(forecastPrice),
        confidence: 0.65,
        trend: marketTrends.trend,
        recommendation: this.getPriceRecommendation(currentPrice, forecastPrice)
      };

    } catch (error) {
      console.error('Get price forecast error:', error);
      throw error;
    }
  }

  /**
   * Get competitor benchmarking
   */
  async getBenchmarking(userId, farmId) {
    try {
      const analytics = await FarmAnalytics.findOne({
        user_id: userId,
        farm_id: farmId
      });

      if (!analytics) {
        throw new Error('Farm analytics not found');
      }

      // Get similar farms in region
      const similarFarms = await FarmAnalytics.find({
        'gps_data.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: analytics.gps_data.coordinates
            },
            $maxDistance: 50000 // 50km radius
          }
        },
        user_id: { $ne: userId }
      })
      .limit(10);

      if (similarFarms.length === 0) {
        return {
          benchmark_available: false,
          message: 'No similar farms found for benchmarking'
        };
      }

      // Calculate averages
      const avgHealthScore = similarFarms.reduce((sum, f) => sum + f.metrics.health_score, 0) / similarFarms.length;
      const avgRoi = similarFarms.reduce((sum, f) => sum + f.metrics.roi, 0) / similarFarms.length;
      const avgProductivity = similarFarms.reduce((sum, f) => sum + f.metrics.productivity_index, 0) / similarFarms.length;

      return {
        benchmark_available: true,
        your_metrics: {
          health_score: analytics.metrics.health_score,
          roi: analytics.metrics.roi,
          productivity: analytics.metrics.productivity_index
        },
        benchmark_metrics: {
          health_score: Math.round(avgHealthScore),
          roi: Math.round(avgRoi * 100) / 100,
          productivity: Math.round(avgProductivity)
        },
        comparison: {
          health_score_diff: Math.round((analytics.metrics.health_score - avgHealthScore) * 100) / 100,
          roi_diff: Math.round((analytics.metrics.roi - avgRoi) * 100) / 100,
          productivity_diff: Math.round((analytics.metrics.productivity_index - avgProductivity) * 100) / 100
        },
        similar_farms_count: similarFarms.length
      };

    } catch (error) {
      console.error('Get benchmarking error:', error);
      throw error;
    }
  }

  // Helper methods

  calculateHealthScore(metricsData) {
    const cropHealth = metricsData.crop_health || 50;
    const soilQuality = metricsData.soil_quality || 50;
    const waterStatus = metricsData.water_status || 50;
    const pestStatus = metricsData.pest_status || 50;

    return Math.round(
      (cropHealth * 0.3) +
      (soilQuality * 0.25) +
      (waterStatus * 0.25) +
      (pestStatus * 0.2)
    );
  }

  calculateProductivityIndex(yield_actual, yield_expected) {
    if (yield_expected === 0) return 0;
    return Math.round((yield_actual / yield_expected) * 100);
  }

  calculateAreaFromBoundary(boundary) {
    if (!boundary || boundary.length < 3) return 0;
    // Simplified area calculation (would use proper GIS in production)
    return boundary.length * 1000; // Mock calculation
  }

  async fetchSatelliteData(latitude, longitude) {
    try {
      // Mock satellite data (would integrate with Sentinel Hub in production)
      return {
        ndvi: 0.5 + Math.random() * 0.3,
        evi: 0.4 + Math.random() * 0.3,
        cloud_cover: Math.random() * 30
      };
    } catch (error) {
      console.error('Fetch satellite data error:', error);
      return { ndvi: 0, evi: 0, cloud_cover: 0 };
    }
  }

  async fetchWeatherData(latitude, longitude) {
    try {
      const response = await axios.get(
        `${this.satelliteProviders.openweather.api_url}/data/2.5/weather`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            appid: this.satelliteProviders.openweather.api_key
          }
        }
      );

      return {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        rainfall: response.data.rain?.['1h'] || 0,
        wind_speed: response.data.wind.speed
      };
    } catch (error) {
      console.error('Fetch weather data error:', error);
      return { temperature: 25, humidity: 60, rainfall: 0, wind_speed: 0 };
    }
  }

  async updatePredictions(analytics, satelliteData, weatherData) {
    // Update predictions based on satellite and weather data
    const ndvi = satelliteData.ndvi || 0;
    const riskLevel = this.calculateRiskLevel(weatherData);

    analytics.predictions = {
      yield_forecast: Math.round(ndvi * 1000),
      confidence: 0.65 + (satelliteData.cloud_cover < 20 ? 0.2 : 0),
      market_price_forecast: 0,
      demand_forecast: 0,
      risk_level: riskLevel
    };
  }

  calculateRiskLevel(weatherData) {
    if (weatherData.temperature > 35 || weatherData.temperature < 10) return 'high';
    if (weatherData.rainfall > 100) return 'high';
    if (weatherData.humidity > 90 || weatherData.humidity < 20) return 'medium';
    return 'low';
  }

  async checkAndCreateAlerts(userId, farmId, analytics) {
    const alerts = [];

    if (analytics.metrics.health_score < this.alertThresholds.health_score_low) {
      alerts.push({
        type: 'low_health_score',
        severity: 'high',
        message: `Farm health score is low: ${analytics.metrics.health_score}`
      });
    }

    if (analytics.metrics.roi < this.alertThresholds.roi_negative) {
      alerts.push({
        type: 'negative_roi',
        severity: 'high',
        message: 'Farm ROI is negative'
      });
    }

    if (analytics.predictions.risk_level === 'high') {
      alerts.push({
        type: 'high_weather_risk',
        severity: 'medium',
        message: 'High weather risk detected'
      });
    }

    // Create alert records
    for (const alert of alerts) {
      const existingAlert = await AnalyticsAlert.findOne({
        user_id: userId,
        farm_id: farmId,
        type: alert.type,
        status: 'active'
      });

      if (!existingAlert) {
        await AnalyticsAlert.create({
          user_id: userId,
          farm_id: farmId,
          ...alert,
          status: 'active'
        });
      }
    }
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    return Math.round(((secondAvg - firstAvg) / firstAvg) * 100 * 100) / 100;
  }

  predictYield(historicalYields, satelliteData) {
    // Simple linear regression
    const n = historicalYields.length;
    const sumX = historicalYields.reduce((sum, _, i) => sum + i, 0);
    const sumY = historicalYields.reduce((sum, h) => sum + h.yield, 0);
    const sumXY = historicalYields.reduce((sum, h, i) => sum + (i * h.yield), 0);
    const sumX2 = historicalYields.reduce((sum, _, i) => sum + (i * i), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predicted = intercept + slope * (n - 1);
    const confidence = 0.65 + (satelliteData.ndvi > 0.5 ? 0.2 : 0);

    return {
      predicted_yield: Math.max(0, predicted),
      confidence,
      factors: ['historical_trend', 'satellite_data', 'weather_conditions'],
      recommendations: this.getYieldRecommendations(predicted, satelliteData)
    };
  }

  getYieldRecommendations(predictedYield, satelliteData) {
    const recommendations = [];

    if (satelliteData.ndvi < 0.4) {
      recommendations.push('Increase fertilizer application');
    }

    if (predictedYield < 1000) {
      recommendations.push('Consider irrigation improvements');
    }

    recommendations.push('Monitor weather conditions closely');

    return recommendations;
  }

  getPriceRecommendation(currentPrice, forecastPrice) {
    if (forecastPrice > currentPrice * 1.1) {
      return 'Hold for better prices';
    } else if (forecastPrice < currentPrice * 0.9) {
      return 'Consider selling now';
    }
    return 'Market stable';
  }
}

module.exports = new FarmAnalyticsService();



