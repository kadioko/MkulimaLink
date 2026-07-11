/**
 * AI/ML Routes
 * Handles advanced ML predictions, NLP analysis, and computer vision
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const aimlService = require('../services/aimlService');
const { MLPrediction, NLPAnalysis, ComputerVisionResult, AIRecommendation } = require('../models/AIML');

// Public routes - no authentication required
router.get('/models', async (req, res) => {
  try {
    const models = aimlService.getAvailableModels();
    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch models',
      error: error.message
    });
  }
});

// Protected routes - authentication required
router.use(protect);

// Disease Detection
router.post('/detect-disease', async (req, res) => {
  try {
    const { imageData } = req.body;

    const result = await aimlService.detectCropDisease(req.user._id, imageData);

    res.json({
      success: true,
      message: 'Disease detection completed',
      data: result
    });
  } catch (error) {
    console.error('Disease detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Disease detection failed',
      error: error.message
    });
  }
});

// Soil Quality Prediction
router.post('/predict-soil-quality', async (req, res) => {
  try {
    const soilData = req.body;

    const prediction = await aimlService.predictSoilQuality(req.user._id, soilData);

    res.json({
      success: true,
      message: 'Soil quality prediction completed',
      data: prediction
    });
  } catch (error) {
    console.error('Soil quality prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Soil quality prediction failed',
      error: error.message
    });
  }
});

// Pest Outbreak Prediction
router.post('/predict-pest-outbreak', async (req, res) => {
  try {
    const farmData = req.body;

    const prediction = await aimlService.predictPestOutbreak(req.user._id, farmData);

    res.json({
      success: true,
      message: 'Pest outbreak prediction completed',
      data: prediction
    });
  } catch (error) {
    console.error('Pest outbreak prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Pest outbreak prediction failed',
      error: error.message
    });
  }
});

// NLP Text Analysis
router.post('/analyze-text', async (req, res) => {
  try {
    const { text, analysisType } = req.body;

    const analysis = await aimlService.analyzeText(req.user._id, text, analysisType);

    res.json({
      success: true,
      message: 'Text analysis completed',
      data: analysis
    });
  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Text analysis failed',
      error: error.message
    });
  }
});

// Crop Recommendations
router.post('/get-crop-recommendations', async (req, res) => {
  try {
    const farmData = req.body;

    const recommendations = await aimlService.getCropRecommendations(req.user._id, farmData);

    res.json({
      success: true,
      message: 'Crop recommendations generated',
      data: recommendations
    });
  } catch (error) {
    console.error('Crop recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate crop recommendations',
      error: error.message
    });
  }
});

// Irrigation Optimization
router.post('/optimize-irrigation', async (req, res) => {
  try {
    const farmData = req.body;

    const optimization = await aimlService.optimizeIrrigation(req.user._id, farmData);

    res.json({
      success: true,
      message: 'Irrigation optimization completed',
      data: optimization
    });
  } catch (error) {
    console.error('Irrigation optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Irrigation optimization failed',
      error: error.message
    });
  }
});

// Get Predictions History
router.get('/predictions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const predictions = await MLPrediction.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MLPrediction.countDocuments({ user_id: req.user._id });

    res.json({
      success: true,
      data: {
        predictions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch predictions',
      error: error.message
    });
  }
});

// Get NLP Analysis History
router.get('/nlp-analysis', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const analyses = await NLPAnalysis.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await NLPAnalysis.countDocuments({ user_id: req.user._id });

    res.json({
      success: true,
      data: {
        analyses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get NLP analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch NLP analysis',
      error: error.message
    });
  }
});

// Get Computer Vision Results
router.get('/cv-results', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const results = await ComputerVisionResult.find({ user_id: req.user._id })
      .sort({ processed_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ComputerVisionResult.countDocuments({ user_id: req.user._id });

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get CV results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch computer vision results',
      error: error.message
    });
  }
});

// Get AI Recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    let filter = { user_id: req.user._id };
    if (status) filter.status = status;

    const recommendations = await AIRecommendation.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AIRecommendation.countDocuments(filter);

    res.json({
      success: true,
      data: {
        recommendations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
});

// Update Recommendation Status
router.post('/recommendations/:recommendationId/status', async (req, res) => {
  try {
    const { status } = req.body;

    const recommendation = await AIRecommendation.findByIdAndUpdate(
      req.params.recommendationId,
      { status },
      { returnDocument: 'after' }
    );

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    res.json({
      success: true,
      message: 'Recommendation status updated',
      data: recommendation
    });
  } catch (error) {
    console.error('Update recommendation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recommendation status',
      error: error.message
    });
  }
});

// Get Model Metrics
router.get('/models/:modelName/metrics', async (req, res) => {
  try {
    const metrics = await aimlService.getModelMetrics(req.params.modelName);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get model metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch model metrics',
      error: error.message
    });
  }
});

module.exports = router;



