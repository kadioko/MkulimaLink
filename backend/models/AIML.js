/**
 * AI/ML Models
 * Models for advanced machine learning predictions and analysis
 */

const mongoose = require('mongoose');

const aiModelSchema = new mongoose.Schema({
  model_name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  model_type: {
    type: String,
    enum: ['classification', 'regression', 'time_series', 'computer_vision', 'nlp'],
    required: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 1
  },
  precision: Number,
  recall: Number,
  f1_score: Number,
  training_data_size: Number,
  training_date: Date,
  last_updated: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'retraining', 'deprecated'],
    default: 'active'
  },
  hyperparameters: mongoose.Schema.Types.Mixed,
  performance_metrics: mongoose.Schema.Types.Mixed,
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
aiModelSchema.index({ model_name: 1 });
aiModelSchema.index({ status: 1 });
aiModelSchema.index({ last_updated: -1 });

// ML Prediction Schema
const mlPredictionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  model_name: {
    type: String,
    required: true,
    index: true
  },
  input_data: mongoose.Schema.Types.Mixed,
  prediction_type: {
    type: String,
    enum: [
      'soil_quality',
      'pest_outbreak',
      'disease',
      'yield',
      'price',
      'weather',
      'irrigation',
      'crop_recommendation',
      'market_demand',
      'harvest_timing'
    ],
    required: true,
    index: true
  },
  output: mongoose.Schema.Types.Mixed,
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  actual_value: mongoose.Schema.Types.Mixed,
  accuracy_verified: Boolean,
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
mlPredictionSchema.index({ user_id: 1, created_at: -1 });
mlPredictionSchema.index({ model_name: 1, created_at: -1 });
mlPredictionSchema.index({ prediction_type: 1 });

// NLP Analysis Schema
const nlpAnalysisSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text_input: {
    type: String,
    required: true
  },
  analysis_type: {
    type: String,
    enum: [
      'sentiment_analysis',
      'text_classification',
      'named_entity_recognition',
      'question_answering',
      'text_summarization',
      'language_translation'
    ],
    required: true,
    index: true
  },
  results: mongoose.Schema.Types.Mixed,
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  language: String,
  tokens_count: Number,
  processing_time_ms: Number,
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
nlpAnalysisSchema.index({ user_id: 1, created_at: -1 });
nlpAnalysisSchema.index({ analysis_type: 1 });

// Computer Vision Result Schema
const computerVisionResultSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  model_name: {
    type: String,
    required: true
  },
  image_data: {
    url: String,
    size: Number,
    format: String,
    upload_date: Date
  },
  detection_type: {
    type: String,
    enum: [
      'disease',
      'pest',
      'weed',
      'crop_stage',
      'soil_condition',
      'field_monitoring'
    ],
    required: true,
    index: true
  },
  results: {
    primary_detection: String,
    confidence: Number,
    all_detections: mongoose.Schema.Types.Mixed,
    bounding_boxes: [mongoose.Schema.Types.Mixed],
    recommendations: [String]
  },
  processed_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
computerVisionResultSchema.index({ user_id: 1, processed_at: -1 });
computerVisionResultSchema.index({ detection_type: 1 });

// Model Training Log Schema
const modelTrainingLogSchema = new mongoose.Schema({
  model_name: {
    type: String,
    required: true,
    index: true
  },
  training_start: {
    type: Date,
    default: Date.now
  },
  training_end: Date,
  training_duration_minutes: Number,
  dataset_size: Number,
  training_samples: Number,
  validation_samples: Number,
  test_samples: Number,
  metrics: {
    accuracy: Number,
    precision: Number,
    recall: Number,
    f1_score: Number,
    loss: Number,
    val_loss: Number
  },
  hyperparameters: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['started', 'in_progress', 'completed', 'failed'],
    default: 'started'
  },
  error_message: String,
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
modelTrainingLogSchema.index({ model_name: 1, created_at: -1 });
modelTrainingLogSchema.index({ status: 1 });

// AI Recommendation Schema
const aiRecommendationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recommendation_type: {
    type: String,
    enum: [
      'crop_selection',
      'pest_management',
      'disease_treatment',
      'irrigation_optimization',
      'fertilizer_application',
      'harvest_timing',
      'market_strategy'
    ],
    required: true,
    index: true
  },
  title: String,
  description: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  action_items: [String],
  expected_impact: String,
  estimated_benefit: mongoose.Schema.Types.Mixed,
  implementation_difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'implemented'],
    default: 'pending'
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
aiRecommendationSchema.index({ user_id: 1, created_at: -1 });
aiRecommendationSchema.index({ recommendation_type: 1, status: 1 });

// Models
const AIModel = mongoose.model('AIModel', aiModelSchema);
const MLPrediction = mongoose.model('MLPrediction', mlPredictionSchema);
const NLPAnalysis = mongoose.model('NLPAnalysis', nlpAnalysisSchema);
const ComputerVisionResult = mongoose.model('ComputerVisionResult', computerVisionResultSchema);
const ModelTrainingLog = mongoose.model('ModelTrainingLog', modelTrainingLogSchema);
const AIRecommendation = mongoose.model('AIRecommendation', aiRecommendationSchema);

module.exports = {
  AIModel,
  MLPrediction,
  NLPAnalysis,
  ComputerVisionResult,
  ModelTrainingLog,
  AIRecommendation
};



