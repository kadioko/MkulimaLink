"""
FastAPI service for MkulimaLink ML models
Provides REST API endpoints for model predictions
"""

import os
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import mlflow
import redis.asyncio as redis
from prometheus_client import make_asgi_app, Counter, Histogram

from .ml_pipeline import MLPipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter('api_requests_total', 'Total API requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('api_request_latency_seconds', 'API request latency', ['method', 'endpoint'])

# ML Pipeline instance
ml_pipeline = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global ml_pipeline

    # Startup
    logger.info("Starting ML API service")

    # Initialize ML pipeline
    config = {
        'database_url': os.getenv('DATABASE_URL'),
        'redis_url': os.getenv('REDIS_URL'),
        'models_dir': 'models',
        'cache_dir': 'cache',
    }

    try:
        ml_pipeline = MLPipeline(config)
        await ml_pipeline.load_models()
        logger.info("ML models loaded successfully")
    except Exception as e:
        logger.error(f"Failed to initialize ML pipeline: {e}")
        # Continue without models - they can be loaded later

    yield

    # Shutdown
    logger.info("Shutting down ML API service")

# Create FastAPI app
app = FastAPI(
    title="MkulimaLink ML API",
    description="Machine Learning API for agricultural intelligence",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Redis client
redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))

# Pydantic models for request/response
class PricePredictionRequest(BaseModel):
    product_name: str = Field(..., description="Name of the agricultural product")
    region: str = Field(..., description="Region where the product is located")
    current_price: float = Field(..., description="Current market price")
    historical_prices: Optional[List[float]] = Field(None, description="Historical prices for context")
    weather_data: Optional[Dict[str, Any]] = Field(None, description="Current weather conditions")

class PricePredictionResponse(BaseModel):
    product_name: str
    region: str
    current_price: float
    predicted_prices: Dict[str, float] = Field(..., description="Predictions for different time horizons")
    confidence_score: float = Field(..., ge=0, le=1, description="Model confidence score")
    trend: str = Field(..., description="Price trend direction")
    factors: Dict[str, Any] = Field(..., description="Key influencing factors")

class DiseaseDetectionRequest(BaseModel):
    image_data: str = Field(..., description="Base64 encoded image data")
    image_format: str = Field("jpeg", description="Image format (jpeg, png)")
    product_type: Optional[str] = Field(None, description="Type of agricultural product")

class DiseaseDetectionResponse(BaseModel):
    disease_detected: bool
    disease_type: Optional[str]
    severity_level: str = Field(..., description="low, medium, high")
    confidence_score: float = Field(..., ge=0, le=1)
    recommendations: List[str]
    treatment_suggestions: List[str]

class RecommendationRequest(BaseModel):
    user_id: str = Field(..., description="User identifier")
    context: Dict[str, Any] = Field(..., description="User context and preferences")
    limit: int = Field(10, ge=1, le=50, description="Number of recommendations")

class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[Dict[str, Any]]
    explanation: str

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    models_loaded: Dict[str, bool]
    cache_status: str
    database_connection: bool

# Middleware for metrics
@app.middleware("http")
async def add_metrics(request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    duration = (datetime.now() - start_time).total_seconds()

    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)

    return response

# Routes
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        db_connected = True  # Implement actual check

        # Check cache connection
        cache_status = "connected"  # Implement actual check

        # Check model status
        models_loaded = {
            'price_prediction': ml_pipeline is not None,
            'disease_detection': ml_pipeline is not None,
            'recommendations': ml_pipeline is not None,
        }

        return HealthResponse(
            status="healthy",
            timestamp=datetime.now(),
            models_loaded=models_loaded,
            cache_status=cache_status,
            database_connection=db_connected
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.post("/predict/price", response_model=PricePredictionResponse)
async def predict_price(request: PricePredictionRequest, background_tasks: BackgroundTasks):
    """Predict agricultural product prices"""
    try:
        if not ml_pipeline:
            raise HTTPException(status_code=503, detail="ML models not loaded")

        # Check cache first
        cache_key = f"price_prediction:{request.product_name}:{request.region}:{request.current_price}"
        cached_result = await redis_client.get(cache_key)

        if cached_result:
            return PricePredictionResponse.parse_raw(cached_result)

        # Make prediction
        prediction_input = {
            'product_name': request.product_name,
            'region': request.region,
            'current_price': request.current_price,
            'historical_prices': request.historical_prices,
            'weather_data': request.weather_data,
        }

        result = await ml_pipeline.predict_price(prediction_input)

        response = PricePredictionResponse(
            product_name=request.product_name,
            region=request.region,
            current_price=request.current_price,
            predicted_prices=result.get('predicted_prices', {}),
            confidence_score=result.get('confidence', 0.0),
            trend=result.get('trend', 'unknown'),
            factors=result.get('factors', {})
        )

        # Cache result for 1 hour
        await redis_client.setex(cache_key, 3600, response.json())

        # Log prediction for analytics
        background_tasks.add_task(log_prediction, 'price', request.dict(), result)

        return response

    except Exception as e:
        logger.error(f"Price prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/detect/disease", response_model=DiseaseDetectionResponse)
async def detect_disease(request: DiseaseDetectionRequest, background_tasks: BackgroundTasks):
    """Detect crop diseases from images"""
    try:
        if not ml_pipeline:
            raise HTTPException(status_code=503, detail="ML models not loaded")

        # Process image data
        image_data = request.image_data
        if not image_data:
            raise HTTPException(status_code=400, detail="Image data is required")

        # Make prediction
        result = await ml_pipeline.detect_disease(image_data)

        response = DiseaseDetectionResponse(
            disease_detected=result.get('disease_detected', False),
            disease_type=result.get('disease_type'),
            severity_level=result.get('severity_level', 'unknown'),
            confidence_score=result.get('confidence_score', 0.0),
            recommendations=result.get('recommendations', []),
            treatment_suggestions=result.get('treatment_suggestions', [])
        )

        # Log detection for analytics
        background_tasks.add_task(log_prediction, 'disease', request.dict(), result)

        return response

    except Exception as e:
        logger.error(f"Disease detection error: {e}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest, background_tasks: BackgroundTasks):
    """Get personalized product recommendations"""
    try:
        if not ml_pipeline:
            raise HTTPException(status_code=503, detail="ML models not loaded")

        # Check cache
        cache_key = f"recommendations:{request.user_id}:{hash(str(request.context))}"
        cached_result = await redis_client.get(cache_key)

        if cached_result:
            return RecommendationResponse.parse_raw(cached_result)

        # Get recommendations
        recommendations = await ml_pipeline.get_recommendations(request.user_id, request.context)

        response = RecommendationResponse(
            user_id=request.user_id,
            recommendations=recommendations[:request.limit],
            explanation="Personalized recommendations based on your farming history and preferences"
        )

        # Cache for 30 minutes
        await redis_client.setex(cache_key, 1800, response.json())

        # Log for analytics
        background_tasks.add_task(log_recommendation, request.dict(), recommendations)

        return response

    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")

@app.post("/retrain")
async def retrain_models(background_tasks: BackgroundTasks):
    """Trigger model retraining"""
    try:
        background_tasks.add_task(retrain_pipeline)
        return {"status": "Retraining started", "message": "Model retraining has been queued"}
    except Exception as e:
        logger.error(f"Retraining trigger error: {e}")
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")

# Background tasks
async def log_prediction(model_type: str, request_data: Dict[str, Any], result: Dict[str, Any]):
    """Log prediction for analytics"""
    try:
        log_data = {
            'model_type': model_type,
            'timestamp': datetime.now(),
            'request': request_data,
            'result': result,
        }

        # Log to MLflow or analytics system
        mlflow.log_param(f"{model_type}_prediction", str(log_data))

        # Could also send to analytics service
        logger.info(f"Logged {model_type} prediction")

    except Exception as e:
        logger.error(f"Failed to log prediction: {e}")

async def log_recommendation(request_data: Dict[str, Any], recommendations: List[Dict[str, Any]]):
    """Log recommendation for analytics"""
    try:
        log_data = {
            'timestamp': datetime.now(),
            'user_id': request_data['user_id'],
            'recommendations_count': len(recommendations),
            'context': request_data['context'],
        }

        logger.info(f"Logged recommendation for user {request_data['user_id']}")

    except Exception as e:
        logger.error(f"Failed to log recommendation: {e}")

async def retrain_pipeline():
    """Run full ML pipeline retraining"""
    try:
        logger.info("Starting ML pipeline retraining")

        if ml_pipeline:
            result = await ml_pipeline.run_pipeline()

            if result['status'] == 'success':
                logger.info("ML pipeline retraining completed successfully")
            else:
                logger.error(f"ML pipeline retraining failed: {result.get('error', 'Unknown error')}")

    except Exception as e:
        logger.error(f"Retraining pipeline error: {e}")

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True if os.getenv("ENVIRONMENT") == "development" else False,
    )
