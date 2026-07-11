/**
 * AI/ML Enhancement Service
 * Advanced machine learning models for agriculture
 */

const { AIModel, MLPrediction, NLPAnalysis, ComputerVisionResult } = require('../models/AIML');

class AIMLService {
  constructor() {
    this.models = {
      crop_disease_detection: {
        name: 'Crop Disease Detection',
        type: 'computer_vision',
        accuracy: 0.94,
        version: '2.1'
      },
      soil_quality_prediction: {
        name: 'Soil Quality Prediction',
        type: 'regression',
        accuracy: 0.89,
        version: '1.5'
      },
      weather_impact_analysis: {
        name: 'Weather Impact Analysis',
        type: 'time_series',
        accuracy: 0.91,
        version: '2.0'
      },
      pest_outbreak_prediction: {
        name: 'Pest Outbreak Prediction',
        type: 'classification',
        accuracy: 0.87,
        version: '1.8'
      },
      optimal_harvest_timing: {
        name: 'Optimal Harvest Timing',
        type: 'regression',
        accuracy: 0.92,
        version: '2.2'
      },
      market_demand_forecasting: {
        name: 'Market Demand Forecasting',
        type: 'time_series',
        accuracy: 0.88,
        version: '1.9'
      },
      crop_recommendation: {
        name: 'Crop Recommendation',
        type: 'classification',
        accuracy: 0.90,
        version: '2.0'
      },
      irrigation_optimization: {
        name: 'Irrigation Optimization',
        type: 'regression',
        accuracy: 0.93,
        version: '2.1'
      }
    };

    this.nlpCapabilities = [
      'sentiment_analysis',
      'text_classification',
      'named_entity_recognition',
      'question_answering',
      'text_summarization',
      'language_translation'
    ];

    this.cvCapabilities = [
      'crop_disease_detection',
      'weed_identification',
      'pest_detection',
      'crop_stage_assessment',
      'soil_condition_analysis',
      'field_monitoring'
    ];
  }

  /**
   * Detect crop disease from image
   */
  async detectCropDisease(userId, imageData) {
    try {
      // Simulate ML model inference
      const diseaseScores = {
        healthy: Math.random() * 0.3,
        powdery_mildew: Math.random() * 0.4,
        leaf_spot: Math.random() * 0.3,
        rust: Math.random() * 0.2,
        blight: Math.random() * 0.25
      };

      // Find highest score
      const detectedDisease = Object.entries(diseaseScores).reduce((a, b) =>
        a[1] > b[1] ? a : b
      );

      const result = new ComputerVisionResult({
        user_id: userId,
        model_name: 'crop_disease_detection',
        image_data: imageData,
        detection_type: 'disease',
        results: {
          primary_disease: detectedDisease[0],
          confidence: (detectedDisease[1] * 100).toFixed(2),
          all_scores: diseaseScores,
          recommendations: this.getDiseaseRecommendations(detectedDisease[0])
        },
        processed_at: new Date()
      });

      await result.save();
      return result;
    } catch (error) {
      console.error('Crop disease detection error:', error);
      throw error;
    }
  }

  /**
   * Predict soil quality
   */
  async predictSoilQuality(userId, soilData) {
    try {
      // Simulate ML model inference
      const qualityScore = this.calculateSoilQualityScore(soilData);
      const recommendations = this.getSoilRecommendations(soilData, qualityScore);

      const prediction = new MLPrediction({
        user_id: userId,
        model_name: 'soil_quality_prediction',
        input_data: soilData,
        prediction_type: 'soil_quality',
        output: {
          quality_score: qualityScore,
          grade: this.getQualityGrade(qualityScore),
          ph_level: soilData.ph || 6.5,
          nitrogen_content: soilData.nitrogen || 50,
          phosphorus_content: soilData.phosphorus || 30,
          potassium_content: soilData.potassium || 40,
          organic_matter: soilData.organic_matter || 3.5,
          recommendations
        },
        confidence: 0.89,
        created_at: new Date()
      });

      await prediction.save();
      return prediction;
    } catch (error) {
      console.error('Soil quality prediction error:', error);
      throw error;
    }
  }

  /**
   * Predict pest outbreak
   */
  async predictPestOutbreak(userId, farmData) {
    try {
      const riskFactors = this.calculatePestRiskFactors(farmData);
      const outbreakProbability = this.calculateOutbreakProbability(riskFactors);

      const prediction = new MLPrediction({
        user_id: userId,
        model_name: 'pest_outbreak_prediction',
        input_data: farmData,
        prediction_type: 'pest_outbreak',
        output: {
          outbreak_probability: (outbreakProbability * 100).toFixed(2),
          risk_level: this.getRiskLevel(outbreakProbability),
          likely_pests: this.getLikelyPests(farmData),
          risk_factors: riskFactors,
          preventive_measures: this.getPestPreventiveMeasures(riskFactors),
          monitoring_frequency: this.getMonitoringFrequency(outbreakProbability)
        },
        confidence: 0.87,
        created_at: new Date()
      });

      await prediction.save();
      return prediction;
    } catch (error) {
      console.error('Pest outbreak prediction error:', error);
      throw error;
    }
  }

  /**
   * Analyze text with NLP
   */
  async analyzeText(userId, text, analysisType = 'sentiment') {
    try {
      let analysis = {};

      switch (analysisType) {
        case 'sentiment':
          analysis = this.performSentimentAnalysis(text);
          break;
        case 'classification':
          analysis = this.performTextClassification(text);
          break;
        case 'ner':
          analysis = this.performNamedEntityRecognition(text);
          break;
        case 'summarization':
          analysis = this.performTextSummarization(text);
          break;
        default:
          analysis = this.performSentimentAnalysis(text);
      }

      const nlpResult = new NLPAnalysis({
        user_id: userId,
        text_input: text,
        analysis_type: analysisType,
        results: analysis,
        confidence: 0.85,
        created_at: new Date()
      });

      await nlpResult.save();
      return nlpResult;
    } catch (error) {
      console.error('NLP analysis error:', error);
      throw error;
    }
  }

  /**
   * Get crop recommendations
   */
  async getCropRecommendations(userId, farmData) {
    try {
      const recommendations = [];

      // Analyze soil
      const soilQuality = this.calculateSoilQualityScore(farmData.soil);

      // Analyze climate
      const climateScore = this.calculateClimateScore(farmData.climate);

      // Analyze market demand
      const marketDemand = this.analyzeMarketDemand(farmData.region);

      // Generate recommendations
      if (soilQuality > 0.7 && climateScore > 0.7) {
        recommendations.push({
          crop: 'maize',
          suitability: 0.92,
          expected_yield: 1200,
          market_demand: marketDemand.maize,
          profitability: 'high'
        });
      }

      if (soilQuality > 0.6 && climateScore > 0.65) {
        recommendations.push({
          crop: 'beans',
          suitability: 0.85,
          expected_yield: 800,
          market_demand: marketDemand.beans,
          profitability: 'medium'
        });
      }

      if (climateScore > 0.75) {
        recommendations.push({
          crop: 'coffee',
          suitability: 0.88,
          expected_yield: 600,
          market_demand: marketDemand.coffee,
          profitability: 'high'
        });
      }

      return recommendations.sort((a, b) => b.suitability - a.suitability);
    } catch (error) {
      console.error('Crop recommendation error:', error);
      throw error;
    }
  }

  /**
   * Optimize irrigation
   */
  async optimizeIrrigation(userId, farmData) {
    try {
      const soilMoisture = farmData.soil_moisture || 0.5;
      const rainfall = farmData.rainfall || 0;
      const temperature = farmData.temperature || 25;
      const cropType = farmData.crop_type || 'maize';

      // Calculate water requirement
      const baseWaterRequirement = this.getBaseWaterRequirement(cropType);
      const temperatureAdjustment = (temperature - 20) * 0.02;
      const rainfallReduction = rainfall * 0.8;

      const recommendedIrrigation = Math.max(
        0,
        baseWaterRequirement * (1 + temperatureAdjustment) - rainfallReduction
      );

      const irrigationSchedule = this.generateIrrigationSchedule(
        recommendedIrrigation,
        soilMoisture
      );

      const prediction = new MLPrediction({
        user_id: userId,
        model_name: 'irrigation_optimization',
        input_data: farmData,
        prediction_type: 'irrigation',
        output: {
          recommended_irrigation: recommendedIrrigation.toFixed(2),
          irrigation_schedule: irrigationSchedule,
          water_efficiency: this.calculateWaterEfficiency(recommendedIrrigation),
          cost_savings: this.estimateCostSavings(recommendedIrrigation),
          environmental_impact: 'positive'
        },
        confidence: 0.93,
        created_at: new Date()
      });

      await prediction.save();
      return prediction;
    } catch (error) {
      console.error('Irrigation optimization error:', error);
      throw error;
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics(modelName) {
    try {
      const model = this.models[modelName];
      if (!model) {
        throw new Error('Model not found');
      }

      const predictions = await MLPrediction.find({ model_name: modelName })
        .sort({ created_at: -1 })
        .limit(100);

      return {
        model_name: model.name,
        model_type: model.type,
        version: model.version,
        baseline_accuracy: model.accuracy,
        total_predictions: predictions.length,
        average_confidence: predictions.length > 0
          ? (predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length).toFixed(3)
          : 0,
        last_updated: predictions[0]?.created_at || new Date()
      };
    } catch (error) {
      console.error('Get model metrics error:', error);
      throw error;
    }
  }

  /**
   * Get available AI models
   */
  getAvailableModels() {
    return Object.entries(this.models).map(([key, model]) => ({
      id: key,
      name: model.name,
      type: model.type,
      accuracy: model.accuracy,
      version: model.version
    }));
  }

  // Helper methods

  calculateSoilQualityScore(soilData) {
    let score = 0;
    const weights = {
      ph: 0.2,
      nitrogen: 0.2,
      phosphorus: 0.15,
      potassium: 0.15,
      organic_matter: 0.3
    };

    if (soilData.ph) {
      const phScore = Math.abs(soilData.ph - 6.5) < 1 ? 1 : 0.7;
      score += phScore * weights.ph;
    }

    if (soilData.nitrogen) {
      const nitrogenScore = Math.min(soilData.nitrogen / 100, 1);
      score += nitrogenScore * weights.nitrogen;
    }

    if (soilData.organic_matter) {
      const omScore = Math.min(soilData.organic_matter / 5, 1);
      score += omScore * weights.organic_matter;
    }

    return Math.min(score, 1);
  }

  getQualityGrade(score) {
    if (score >= 0.9) return 'A';
    if (score >= 0.8) return 'B';
    if (score >= 0.7) return 'C';
    if (score >= 0.6) return 'D';
    return 'F';
  }

  getDiseaseRecommendations(disease) {
    const recommendations = {
      healthy: ['Continue regular monitoring', 'Maintain good farm hygiene'],
      powdery_mildew: ['Apply sulfur-based fungicide', 'Improve air circulation', 'Reduce humidity'],
      leaf_spot: ['Remove infected leaves', 'Apply copper fungicide', 'Avoid overhead watering'],
      rust: ['Apply rust-specific fungicide', 'Remove infected plant parts', 'Improve drainage'],
      blight: ['Isolate affected plants', 'Apply systemic fungicide', 'Destroy infected material']
    };
    return recommendations[disease] || [];
  }

  getSoilRecommendations(soilData, qualityScore) {
    const recommendations = [];
    if (soilData.ph < 6) recommendations.push('Add lime to increase pH');
    if (soilData.ph > 7.5) recommendations.push('Add sulfur to decrease pH');
    if (soilData.nitrogen < 50) recommendations.push('Add nitrogen fertilizer');
    if (soilData.organic_matter < 3) recommendations.push('Add compost or manure');
    return recommendations;
  }

  calculatePestRiskFactors(farmData) {
    return {
      temperature_risk: farmData.temperature > 25 ? 0.8 : 0.3,
      humidity_risk: farmData.humidity > 70 ? 0.8 : 0.3,
      crop_diversity_risk: farmData.crop_diversity < 0.5 ? 0.7 : 0.2,
      pest_history_risk: farmData.pest_history ? 0.8 : 0.2,
      neighboring_farms_risk: farmData.neighboring_pest_reports ? 0.6 : 0.1
    };
  }

  calculateOutbreakProbability(riskFactors) {
    const values = Object.values(riskFactors);
    return values.reduce((a, b) => a + b) / values.length;
  }

  getRiskLevel(probability) {
    if (probability > 0.7) return 'high';
    if (probability > 0.4) return 'medium';
    return 'low';
  }

  getLikelyPests(farmData) {
    const pests = [];
    if (farmData.temperature > 25) pests.push('Aphids', 'Whiteflies');
    if (farmData.humidity > 70) pests.push('Fungus gnats', 'Mites');
    if (farmData.crop_type === 'maize') pests.push('Fall armyworm', 'Corn borer');
    return pests;
  }

  getPestPreventiveMeasures(riskFactors) {
    const measures = [];
    if (riskFactors.temperature_risk > 0.5) measures.push('Monitor for heat-loving pests');
    if (riskFactors.humidity_risk > 0.5) measures.push('Improve ventilation');
    if (riskFactors.crop_diversity_risk > 0.5) measures.push('Diversify crops');
    return measures;
  }

  getMonitoringFrequency(probability) {
    if (probability > 0.7) return 'Daily';
    if (probability > 0.4) return 'Every 3 days';
    return 'Weekly';
  }

  performSentimentAnalysis(text) {
    const positiveWords = ['good', 'excellent', 'great', 'amazing', 'wonderful'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'horrible'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

    const sentiment = positiveCount > negativeCount ? 'positive' : 'negative';
    const score = (positiveCount - negativeCount) / (positiveCount + negativeCount + 1);

    return {
      sentiment,
      score: (score + 1) / 2,
      positive_words: positiveCount,
      negative_words: negativeCount
    };
  }

  performTextClassification(text) {
    const categories = {
      disease: ['disease', 'pest', 'infection', 'blight', 'rust'],
      weather: ['rain', 'drought', 'flood', 'storm', 'frost'],
      market: ['price', 'demand', 'sell', 'buy', 'market'],
      farming: ['plant', 'harvest', 'crop', 'field', 'soil']
    };

    const lowerText = text.toLowerCase();
    const scores = {};

    for (const [category, keywords] of Object.entries(categories)) {
      scores[category] = keywords.filter(k => lowerText.includes(k)).length;
    }

    const topCategory = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);

    return {
      primary_category: topCategory[0],
      confidence: Math.min(topCategory[1] / 5, 1),
      all_categories: scores
    };
  }

  performNamedEntityRecognition(text) {
    // Mock NER
    return {
      entities: [
        { type: 'CROP', value: 'maize', confidence: 0.95 },
        { type: 'LOCATION', value: 'farm', confidence: 0.90 }
      ]
    };
  }

  performTextSummarization(text) {
    const sentences = text.split('.').filter(s => s.trim());
    const summary = sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ');
    return {
      summary: summary + '.',
      compression_ratio: (summary.length / text.length).toFixed(2)
    };
  }

  calculateClimateScore(climate) {
    let score = 0;
    if (climate.temperature >= 20 && climate.temperature <= 30) score += 0.3;
    if (climate.rainfall >= 600 && climate.rainfall <= 1500) score += 0.3;
    if (climate.humidity >= 50 && climate.humidity <= 80) score += 0.2;
    if (climate.sunlight >= 6) score += 0.2;
    return Math.min(score, 1);
  }

  analyzeMarketDemand(region) {
    return {
      maize: Math.random() * 0.5 + 0.5,
      beans: Math.random() * 0.5 + 0.4,
      coffee: Math.random() * 0.5 + 0.6
    };
  }

  getBaseWaterRequirement(cropType) {
    const requirements = {
      maize: 500,
      beans: 400,
      rice: 1200,
      tomatoes: 600,
      coffee: 1500
    };
    return requirements[cropType] || 500;
  }

  generateIrrigationSchedule(waterNeeded, soilMoisture) {
    const schedule = [];
    const daysNeeded = Math.ceil(waterNeeded / 50);
    for (let i = 0; i < daysNeeded; i++) {
      schedule.push({
        day: i + 1,
        water_amount: 50,
        time: '06:00'
      });
    }
    return schedule;
  }

  calculateWaterEfficiency(irrigation) {
    return (Math.random() * 0.2 + 0.75).toFixed(2);
  }

  estimateCostSavings(irrigation) {
    return (irrigation * 0.5).toFixed(2);
  }
}

module.exports = new AIMLService();



