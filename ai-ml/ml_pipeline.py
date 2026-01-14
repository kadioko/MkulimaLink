"""
MkulimaLink ML Pipeline
Core machine learning infrastructure for agricultural intelligence
"""

import os
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MLPipeline:
    """Main ML Pipeline class for MkulimaLink"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or self._default_config()
        self.models_dir = Path(self.config['models_dir'])
        self.data_dir = Path(self.config['data_dir'])
        self.cache_dir = Path(self.config['cache_dir'])

        # Create directories
        self._create_directories()

        # Initialize components
        self.data_processor = AgriculturalDataProcessor(self.config)
        self.price_predictor = PricePredictionModel(self.config)
        self.disease_detector = CropDiseaseDetector(self.config)
        self.recommendation_engine = RecommendationEngine(self.config)

        logger.info("ML Pipeline initialized")

    def _default_config(self) -> Dict[str, Any]:
        """Default configuration for ML pipeline"""
        return {
            'models_dir': 'models',
            'data_dir': 'data',
            'cache_dir': 'cache',
            'database_url': os.getenv('DATABASE_URL', 'postgresql://localhost/mkulimalink'),
            'redis_url': os.getenv('REDIS_URL', 'redis://localhost:6379'),
            'batch_size': 32,
            'learning_rate': 0.001,
            'epochs': 100,
            'validation_split': 0.2,
            'test_split': 0.1,
            'random_seed': 42,
        }

    def _create_directories(self):
        """Create necessary directories"""
        directories = [
            self.models_dir,
            self.data_dir,
            self.cache_dir,
            self.models_dir / 'price_prediction',
            self.models_dir / 'disease_detection',
            self.models_dir / 'recommendations',
            self.data_dir / 'raw',
            self.data_dir / 'processed',
            self.data_dir / 'features',
            self.cache_dir / 'predictions',
            self.cache_dir / 'embeddings',
        ]

        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            logger.debug(f"Created directory: {directory}")

    async def collect_data(self) -> Dict[str, pd.DataFrame]:
        """Collect data from various sources"""
        logger.info("Starting data collection")

        data_sources = {
            'transactions': await self.data_processor.get_transaction_data(),
            'market_prices': await self.data_processor.get_market_prices(),
            'weather': await self.data_processor.get_weather_data(),
            'products': await self.data_processor.get_product_data(),
            'users': await self.data_processor.get_user_data(),
        }

        logger.info(f"Collected data from {len(data_sources)} sources")
        return data_sources

    async def preprocess_data(self, raw_data: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
        """Preprocess raw data for ML models"""
        logger.info("Starting data preprocessing")

        processed_data = {}

        # Preprocess each data source
        for name, data in raw_data.items():
            processed_data[name] = await self.data_processor.preprocess_data(name, data)
            logger.info(f"Preprocessed {name}: {len(processed_data[name])} records")

        # Create features for different models
        processed_data['price_features'] = await self.data_processor.create_price_features(
            processed_data['transactions'], processed_data['market_prices']
        )
        processed_data['disease_features'] = await self.data_processor.create_disease_features(
            processed_data['products']
        )
        processed_data['recommendation_features'] = await self.data_processor.create_recommendation_features(
            processed_data['users'], processed_data['transactions']
        )

        logger.info("Data preprocessing completed")
        return processed_data

    async def train_models(self, processed_data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Train all ML models"""
        logger.info("Starting model training")

        training_results = {}

        # Train price prediction model
        logger.info("Training price prediction model")
        training_results['price_prediction'] = await self.price_predictor.train(
            processed_data['price_features']
        )

        # Train disease detection model
        logger.info("Training disease detection model")
        training_results['disease_detection'] = await self.disease_detector.train(
            processed_data['disease_features']
        )

        # Train recommendation engine
        logger.info("Training recommendation engine")
        training_results['recommendations'] = await self.recommendation_engine.train(
            processed_data['recommendation_features']
        )

        logger.info("Model training completed")
        return training_results

    async def evaluate_models(self, processed_data: Dict[str, pd.DataFrame]) -> Dict[str, Dict[str, float]]:
        """Evaluate all trained models"""
        logger.info("Starting model evaluation")

        evaluation_results = {}

        # Evaluate price prediction model
        evaluation_results['price_prediction'] = await self.price_predictor.evaluate(
            processed_data['price_features']
        )

        # Evaluate disease detection model
        evaluation_results['disease_detection'] = await self.disease_detector.evaluate(
            processed_data['disease_features']
        )

        # Evaluate recommendation engine
        evaluation_results['recommendations'] = await self.recommendation_engine.evaluate(
            processed_data['recommendation_features']
        )

        logger.info("Model evaluation completed")
        return evaluation_results

    async def save_models(self):
        """Save all trained models"""
        logger.info("Saving models")

        await self.price_predictor.save_model()
        await self.disease_detector.save_model()
        await self.recommendation_engine.save_model()

        logger.info("Models saved successfully")

    async def load_models(self):
        """Load all trained models"""
        logger.info("Loading models")

        await self.price_predictor.load_model()
        await self.disease_detector.load_model()
        await self.recommendation_engine.load_model()

        logger.info("Models loaded successfully")

    async def predict_price(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict product prices"""
        return await self.price_predictor.predict(product_data)

    async def detect_disease(self, image_data: bytes) -> Dict[str, Any]:
        """Detect crop diseases from images"""
        return await self.disease_detector.predict(image_data)

    async def get_recommendations(self, user_id: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get personalized recommendations"""
        return await self.recommendation_engine.recommend(user_id, context)

    async def run_pipeline(self) -> Dict[str, Any]:
        """Run the complete ML pipeline"""
        logger.info("Starting complete ML pipeline")

        try:
            # Step 1: Data collection
            raw_data = await self.collect_data()

            # Step 2: Data preprocessing
            processed_data = await self.preprocess_data(raw_data)

            # Step 3: Model training
            training_results = await self.train_models(processed_data)

            # Step 4: Model evaluation
            evaluation_results = await self.evaluate_models(processed_data)

            # Step 5: Save models
            await self.save_models()

            pipeline_results = {
                'status': 'success',
                'timestamp': datetime.now().isoformat(),
                'data_stats': {
                    name: len(data) for name, data in processed_data.items()
                },
                'training_results': training_results,
                'evaluation_results': evaluation_results,
            }

            logger.info("ML pipeline completed successfully")
            return pipeline_results

        except Exception as e:
            logger.error(f"ML pipeline failed: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
            }

# Import components (will be created in separate files)
from .data_processor import AgriculturalDataProcessor
from .price_prediction import PricePredictionModel
from .disease_detection import CropDiseaseDetector
from .recommendations import RecommendationEngine

# Export main pipeline class
__all__ = ['MLPipeline']
