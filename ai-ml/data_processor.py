"""
Agricultural Data Processor
Handles data collection, preprocessing, and feature engineering for ML models
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
import aiohttp
import redis.asyncio as redis
from pathlib import Path

logger = logging.getLogger(__name__)

class AgriculturalDataProcessor:
    """Processes agricultural data for ML models"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.db_engine = create_engine(config['database_url'])
        self.redis_client = redis.from_url(config['redis_url'])

    async def get_transaction_data(self, days: int = 365) -> pd.DataFrame:
        """Fetch transaction data from database"""
        query = f"""
        SELECT
            t.*,
            p.name as product_name,
            p.category,
            p.unit,
            u.name as buyer_name,
            u.location as buyer_location,
            s.name as seller_name,
            s.location as seller_location
        FROM transactions t
        JOIN products p ON t.product = p._id
        JOIN users u ON t.buyer = u._id
        JOIN users s ON t.seller = s._id
        WHERE t.created_at >= NOW() - INTERVAL '{days} days'
        ORDER BY t.created_at DESC
        """

        with self.db_engine.connect() as conn:
            df = pd.read_sql_query(text(query), conn)

        logger.info(f"Fetched {len(df)} transactions")
        return df

    async def get_market_prices(self, days: int = 365) -> pd.DataFrame:
        """Fetch market price data"""
        query = f"""
        SELECT * FROM market_prices
        WHERE date >= NOW() - INTERVAL '{days} days'
        ORDER BY date DESC, commodity, region
        """

        with self.db_engine.connect() as conn:
            df = pd.read_sql_query(text(query), conn)

        logger.info(f"Fetched {len(df)} market prices")
        return df

    async def get_weather_data(self, days: int = 30) -> pd.DataFrame:
        """Fetch weather data from external API"""
        # This would integrate with weather APIs like OpenWeatherMap
        # For now, return mock data
        regions = ['Arusha', 'Dar es Salaam', 'Dodoma', 'Iringa', 'Kagera', 'Mwanza', 'Tanga']
        weather_data = []

        for region in regions:
            for i in range(days):
                date = datetime.now() - timedelta(days=i)
                weather_data.append({
                    'region': region,
                    'date': date.date(),
                    'temperature': np.random.normal(25, 5),
                    'humidity': np.random.normal(65, 15),
                    'rainfall': max(0, np.random.normal(2, 3)),
                    'wind_speed': np.random.normal(5, 2),
                })

        df = pd.DataFrame(weather_data)
        logger.info(f"Generated {len(df)} weather records")
        return df

    async def get_product_data(self) -> pd.DataFrame:
        """Fetch product data"""
        query = """
        SELECT
            p.*,
            u.name as seller_name,
            u.location as seller_location,
            u.rating as seller_rating
        FROM products p
        JOIN users u ON p.seller = u._id
        WHERE p.status = 'available'
        """

        with self.db_engine.connect() as conn:
            df = pd.read_sql_query(text(query), conn)

        logger.info(f"Fetched {len(df)} products")
        return df

    async def get_user_data(self) -> pd.DataFrame:
        """Fetch user data"""
        query = """
        SELECT
            _id,
            name,
            email,
            role,
            location,
            rating,
            created_at,
            is_premium
        FROM users
        """

        with self.db_engine.connect() as conn:
            df = pd.read_sql_query(text(query), conn)

        logger.info(f"Fetched {len(df)} users")
        return df

    async def preprocess_data(self, data_type: str, data: pd.DataFrame) -> pd.DataFrame:
        """Preprocess data based on type"""
        if data.empty:
            return data

        # Common preprocessing
        data = self._clean_data(data)
        data = self._handle_missing_values(data)
        data = self._normalize_data_types(data)

        # Type-specific preprocessing
        if data_type == 'transactions':
            data = self._preprocess_transactions(data)
        elif data_type == 'market_prices':
            data = self._preprocess_market_prices(data)
        elif data_type == 'weather':
            data = self._preprocess_weather(data)
        elif data_type == 'products':
            data = self._preprocess_products(data)
        elif data_type == 'users':
            data = self._preprocess_users(data)

        return data

    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean raw data"""
        # Remove duplicates
        df = df.drop_duplicates()

        # Remove rows with all NaN values
        df = df.dropna(how='all')

        # Reset index
        df = df.reset_index(drop=True)

        return df

    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values"""
        # For numeric columns, fill with median
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        for col in numeric_columns:
            if df[col].isnull().any():
                df[col] = df[col].fillna(df[col].median())

        # For categorical columns, fill with mode
        categorical_columns = df.select_dtypes(include=['object']).columns
        for col in categorical_columns:
            if df[col].isnull().any():
                df[col] = df[col].fillna(df[col].mode().iloc[0] if not df[col].mode().empty else 'unknown')

        return df

    def _normalize_data_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize data types"""
        # Convert date columns
        date_columns = [col for col in df.columns if 'date' in col.lower() or 'time' in col.lower()]
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')

        # Ensure numeric columns are numeric
        potential_numeric = ['price', 'quantity', 'amount', 'rating', 'temperature', 'humidity']
        for col in potential_numeric:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        return df

    def _preprocess_transactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess transaction data"""
        # Calculate derived features
        df['total_value'] = df['quantity'] * df['price']
        df['hour_of_day'] = df['created_at'].dt.hour
        df['day_of_week'] = df['created_at'].dt.dayofweek
        df['month'] = df['created_at'].dt.month

        # Extract location features
        df['buyer_region'] = df['buyer_location'].apply(lambda x: x.get('region') if isinstance(x, dict) else None)
        df['seller_region'] = df['seller_location'].apply(lambda x: x.get('region') if isinstance(x, dict) else None)

        return df

    def _preprocess_market_prices(self, df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess market price data"""
        # Sort by date and commodity
        df = df.sort_values(['commodity', 'region', 'date'])

        # Calculate price changes
        df['price_change'] = df.groupby(['commodity', 'region'])['price'].pct_change()

        # Calculate rolling statistics
        df['price_7d_avg'] = df.groupby(['commodity', 'region'])['price'].rolling(7).mean()
        df['price_30d_avg'] = df.groupby(['commodity', 'region'])['price'].rolling(30).mean()

        # Reset index after groupby operations
        df = df.reset_index(drop=True)

        return df

    def _preprocess_weather(self, df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess weather data"""
        # Calculate derived weather features
        df['is_rainy'] = df['rainfall'] > 0.1
        df['temperature_category'] = pd.cut(
            df['temperature'],
            bins=[-10, 10, 20, 30, 40],
            labels=['cold', 'cool', 'warm', 'hot']
        )

        return df

    def _preprocess_products(self, df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess product data"""
        # Extract text features
        df['name_length'] = df['name'].str.len()
        df['description_length'] = df['description'].str.len()

        # Extract location features
        df['region'] = df['location'].apply(lambda x: x.get('region') if isinstance(x, dict) else None)
        df['district'] = df['location'].apply(lambda x: x.get('district') if isinstance(x, dict) else None)

        # Calculate product metrics
        df['days_since_created'] = (datetime.now() - df['created_at']).dt.days
        df['views_per_day'] = df['views'] / (df['days_since_created'] + 1)

        return df

    def _preprocess_users(self, df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess user data"""
        # Calculate user metrics
        df['days_since_joined'] = (datetime.now() - df['created_at']).dt.days

        # Extract location features
        df['region'] = df['location'].apply(lambda x: x.get('region') if isinstance(x, dict) else None)
        df['district'] = df['location'].apply(lambda x: x.get('district') if isinstance(x, dict) else None)

        return df

    async def create_price_features(self, transactions: pd.DataFrame, market_prices: pd.DataFrame) -> pd.DataFrame:
        """Create features for price prediction model"""
        features = []

        # Group transactions by product and time
        transactions['date'] = transactions['created_at'].dt.date
        daily_prices = transactions.groupby(['product_name', 'category', 'region', 'date']).agg({
            'price': ['mean', 'min', 'max', 'std', 'count'],
            'quantity': 'sum',
            'total_value': 'sum'
        }).reset_index()

        # Flatten column names
        daily_prices.columns = ['_'.join(col).strip('_') for col in daily_prices.columns.values]

        # Merge with market prices
        if not market_prices.empty:
            daily_prices = daily_prices.merge(
                market_prices,
                left_on=['date', 'region'],
                right_on=['date', 'region'],
                how='left',
                suffixes=('_transaction', '_market')
            )

        # Create time series features
        for _, group in daily_prices.groupby(['product_name', 'region']):
            group = group.sort_values('date')
            group = self._create_time_series_features(group)
            features.append(group)

        if features:
            result = pd.concat(features, ignore_index=True)
        else:
            result = pd.DataFrame()

        logger.info(f"Created {len(result)} price prediction features")
        return result

    async def create_disease_features(self, products: pd.DataFrame) -> pd.DataFrame:
        """Create features for disease detection model"""
        # This would involve image processing and feature extraction
        # For now, return processed product data
        features = products.copy()

        # Add image-related features (placeholders)
        features['has_images'] = features['images'].notna()
        features['image_count'] = features['images'].apply(lambda x: len(x) if isinstance(x, list) else 0)

        logger.info(f"Created {len(features)} disease detection features")
        return features

    async def create_recommendation_features(self, users: pd.DataFrame, transactions: pd.DataFrame) -> pd.DataFrame:
        """Create features for recommendation engine"""
        # Create user-item interaction matrix
        interactions = transactions.groupby(['buyer', 'product']).agg({
            'quantity': 'sum',
            'total_value': 'sum',
            'created_at': 'max'
        }).reset_index()

        # Pivot to create user-item matrix
        user_item_matrix = interactions.pivot(
            index='buyer',
            columns='product',
            values='quantity'
        ).fillna(0)

        # Add user features
        user_features = users.set_index('_id')[['role', 'rating', 'region', 'is_premium']]
        user_item_matrix = user_item_matrix.join(user_features, how='left')

        logger.info(f"Created recommendation features: {user_item_matrix.shape}")
        return user_item_matrix.reset_index()

    def _create_time_series_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create time series features for price prediction"""
        if len(df) < 7:
            return df

        # Price lag features
        for lag in [1, 3, 7, 14, 30]:
            df[f'price_lag_{lag}'] = df['price_mean'].shift(lag)

        # Rolling statistics
        df['price_rolling_mean_7'] = df['price_mean'].rolling(7).mean()
        df['price_rolling_std_7'] = df['price_mean'].rolling(7).std()
        df['price_rolling_mean_30'] = df['price_mean'].rolling(30).mean()

        # Price momentum
        df['price_momentum_1d'] = df['price_mean'].pct_change(1)
        df['price_momentum_7d'] = df['price_mean'].pct_change(7)

        # Seasonal features
        df['day_of_week'] = pd.to_datetime(df['date']).dt.dayofweek
        df['month'] = pd.to_datetime(df['date']).dt.month
        df['quarter'] = pd.to_datetime(df['date']).dt.quarter

        return df
