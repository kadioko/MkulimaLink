"""
Feature Engineering for Agricultural Data
Advanced feature engineering for ML models in agriculture
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA
import talib  # Technical Analysis Library
import holidays

logger = logging.getLogger(__name__)

class AgriculturalFeatureEngineer:
    """Advanced feature engineering for agricultural ML models"""

    def __init__(self):
        self.scalers = {}
        self.encoders = {}
        self.vectorizers = {}
        self.pca_models = {}

        # Tanzanian holidays
        self.tz_holidays = holidays.TZ()

    def create_temporal_features(self, df: pd.DataFrame, date_column: str = 'date') -> pd.DataFrame:
        """Create temporal features from date columns"""
        logger.info("Creating temporal features")

        df = df.copy()
        date_col = pd.to_datetime(df[date_column])

        # Basic temporal features
        df['day_of_week'] = date_col.dt.dayofweek
        df['day_of_month'] = date_col.dt.day
        df['month'] = date_col.dt.month
        df['quarter'] = date_col.dt.quarter
        df['year'] = date_col.dt.year
        df['week_of_year'] = date_col.dt.isocalendar().week

        # Seasonal features
        df['is_weekend'] = date_col.dt.dayofweek.isin([5, 6]).astype(int)
        df['is_month_start'] = date_col.dt.is_month_start.astype(int)
        df['is_month_end'] = date_col.dt.is_month_end.astype(int)

        # Holiday features
        df['is_holiday'] = date_col.dt.date.apply(lambda x: x in self.tz_holidays).astype(int)
        df['days_to_holiday'] = date_col.dt.date.apply(self._days_to_next_holiday)
        df['days_from_holiday'] = date_col.dt.date.apply(self._days_from_last_holiday)

        # Agricultural season features
        df['agricultural_season'] = df['month'].apply(self._get_agricultural_season)
        df['is_planting_season'] = df['month'].apply(lambda x: x in [3, 4, 10, 11]).astype(int)
        df['is_harvest_season'] = df['month'].apply(lambda x: x in [5, 6, 12, 1]).astype(int)

        return df

    def _days_to_next_holiday(self, date) -> int:
        """Calculate days to next holiday"""
        for days in range(30):  # Look ahead 30 days
            check_date = date + timedelta(days=days)
            if check_date in self.tz_holidays:
                return days
        return 30

    def _days_from_last_holiday(self, date) -> int:
        """Calculate days from last holiday"""
        for days in range(30):  # Look back 30 days
            check_date = date - timedelta(days=days)
            if check_date in self.tz_holidays:
                return days
        return 30

    def _get_agricultural_season(self, month: int) -> str:
        """Get agricultural season based on month"""
        if month in [12, 1, 2]:
            return 'long_rains'  # Masika
        elif month in [3, 4, 5]:
            return 'long_dry'  # Kiimbu
        elif month in [6, 7, 8, 9]:
            return 'short_rains'  # Vuli
        else:
            return 'short_dry'  # Mwaka

    def create_price_features(self, df: pd.DataFrame, price_column: str = 'price') -> pd.DataFrame:
        """Create advanced price-based features"""
        logger.info("Creating price-based features")

        df = df.copy()

        # Lag features
        for lag in [1, 3, 7, 14, 30]:
            df[f'price_lag_{lag}'] = df.groupby(['product_name', 'region'])[price_column].shift(lag)

        # Rolling statistics
        windows = [3, 7, 14, 30]
        for window in windows:
            df[f'price_rolling_mean_{window}'] = df.groupby(['product_name', 'region'])[price_column].rolling(window).mean()
            df[f'price_rolling_std_{window}'] = df.groupby(['product_name', 'region'])[price_column].rolling(window).std()
            df[f'price_rolling_min_{window}'] = df.groupby(['product_name', 'region'])[price_column].rolling(window).min()
            df[f'price_rolling_max_{window}'] = df.groupby(['product_name', 'region'])[price_column].rolling(window).max()

        # Price momentum and volatility
        df['price_momentum_1d'] = df.groupby(['product_name', 'region'])[price_column].pct_change(1)
        df['price_momentum_7d'] = df.groupby(['product_name', 'region'])[price_column].pct_change(7)
        df['price_volatility_7d'] = df.groupby(['product_name', 'region'])['price_momentum_1d'].rolling(7).std()
        df['price_volatility_30d'] = df.groupby(['product_name', 'region'])['price_momentum_1d'].rolling(30).std()

        # Price acceleration (second derivative)
        df['price_acceleration'] = df.groupby(['product_name', 'region'])['price_momentum_1d'].diff()

        # Technical indicators (using TA-Lib)
        try:
            df['price_sma_7'] = df.groupby(['product_name', 'region'])[price_column].transform(lambda x: talib.SMA(x.values, timeperiod=7))
            df['price_rsi_14'] = df.groupby(['product_name', 'region'])[price_column].transform(lambda x: talib.RSI(x.values, timeperiod=14))
            df['price_macd'], df['price_macd_signal'], df['price_macd_hist'] = zip(*df.groupby(['product_name', 'region'])[price_column].transform(
                lambda x: talib.MACD(x.values, fastperiod=12, slowperiod=26, signalperiod=9)
            ).apply(lambda x: x if isinstance(x, tuple) else (np.nan, np.nan, np.nan)))
        except Exception as e:
            logger.warning(f"Could not create technical indicators: {e}")

        # Reset index after groupby operations
        df = df.reset_index(drop=True)

        return df

    def create_weather_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create weather-based features"""
        logger.info("Creating weather-based features")

        df = df.copy()

        # Temperature features
        df['temperature_category'] = pd.cut(
            df['temperature'],
            bins=[-10, 10, 20, 25, 30, 35, 40],
            labels=['very_cold', 'cold', 'cool', 'warm', 'hot', 'very_hot']
        )

        # Humidity features
        df['humidity_category'] = pd.cut(
            df['humidity'],
            bins=[0, 30, 50, 70, 90, 100],
            labels=['very_dry', 'dry', 'moderate', 'humid', 'very_humid']
        )

        # Rainfall features
        df['is_rainy_day'] = (df['rainfall'] > 0.1).astype(int)
        df['rainfall_category'] = pd.cut(
            df['rainfall'],
            bins=[0, 0.1, 5, 15, 30, 100],
            labels=['no_rain', 'light', 'moderate', 'heavy', 'very_heavy']
        )

        # Wind features
        df['wind_category'] = pd.cut(
            df['wind_speed'],
            bins=[0, 5, 10, 15, 20, 50],
            labels=['calm', 'light', 'moderate', 'strong', 'very_strong']
        )

        # Weather interaction features
        df['temperature_humidity_index'] = df['temperature'] * (df['humidity'] / 100)
        df['rain_wind_index'] = df['rainfall'] * df['wind_speed']

        # Rolling weather features
        weather_cols = ['temperature', 'humidity', 'rainfall', 'wind_speed']
        for col in weather_cols:
            df[f'{col}_7d_avg'] = df.groupby('region')[col].rolling(7).mean()
            df[f'{col}_7d_std'] = df.groupby('region')[col].rolling(7).std()

        # Reset index after groupby operations
        df = df.reset_index(drop=True)

        return df

    def create_location_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create location-based features"""
        logger.info("Creating location-based features")

        df = df.copy()

        # Region encoding
        region_encoder = LabelEncoder()
        df['region_encoded'] = region_encoder.fit_transform(df['region'])
        self.encoders['region'] = region_encoder

        # District encoding
        if 'district' in df.columns:
            district_encoder = LabelEncoder()
            df['district_encoded'] = district_encoder.fit_transform(df['district'].fillna('unknown'))
            self.encoders['district'] = district_encoder

        # Distance features (simplified - in real implementation would use actual coordinates)
        region_centers = {
            'Arusha': (-3.3869, 36.6828),
            'Dar es Salaam': (-6.7924, 39.2083),
            'Dodoma': (-6.1630, 35.7516),
            'Iringa': (-7.7667, 35.7000),
            'Kagera': (-2.5000, 31.0000),
            'Mwanza': (-2.5167, 32.9000),
            'Tanga': (-5.0667, 39.1000),
        }

        df['region_lat'] = df['region'].map(lambda x: region_centers.get(x, (0, 0))[0])
        df['region_lng'] = df['region'].map(lambda x: region_centers.get(x, (0, 0))[1])

        return df

    def create_supply_demand_features(self, transactions_df: pd.DataFrame, products_df: pd.DataFrame) -> pd.DataFrame:
        """Create supply and demand features"""
        logger.info("Creating supply and demand features")

        # Aggregate transaction data
        supply_demand = transactions_df.groupby(['product_name', 'region', 'date']).agg({
            'quantity': ['sum', 'mean', 'std', 'count'],
            'price': ['mean', 'min', 'max'],
        }).reset_index()

        # Flatten column names
        supply_demand.columns = ['_'.join(col).strip('_') for col in supply_demand.columns.values]

        # Calculate supply/demand ratios
        supply_demand['supply_demand_ratio'] = supply_demand['quantity_sum'] / (supply_demand['quantity_count'] + 1)
        supply_demand['price_volatility'] = supply_demand['price_std'] / (supply_demand['price_mean'] + 1)

        # Inventory levels (from products data)
        inventory = products_df.groupby(['name', 'region']).agg({
            'quantity': 'sum',
            'views': 'sum',
        }).reset_index()

        # Merge with supply/demand data
        merged = supply_demand.merge(
            inventory,
            left_on=['product_name_', 'region_'],
            right_on=['name', 'region'],
            how='left'
        ).fillna(0)

        # Calculate demand indicators
        merged['demand_pressure'] = merged['views'] / (merged['quantity'] + 1)
        merged['inventory_turnover'] = merged['quantity_sum'] / (merged['quantity'] + 1)

        return merged

    def create_text_features(self, df: pd.DataFrame, text_columns: List[str]) -> pd.DataFrame:
        """Create text-based features"""
        logger.info("Creating text-based features")

        df = df.copy()

        for col in text_columns:
            if col in df.columns:
                # Basic text features
                df[f'{col}_length'] = df[col].fillna('').str.len()
                df[f'{col}_word_count'] = df[col].fillna('').str.split().str.len()
                df[f'{col}_has_numbers'] = df[col].fillna('').str.contains(r'\d').astype(int)
                df[f'{col}_has_special_chars'] = df[col].fillna('').str.contains(r'[^\w\s]').astype(int)

                # TF-IDF features
                try:
                    vectorizer = TfidfVectorizer(max_features=50, stop_words='english')
                    tfidf_matrix = vectorizer.fit_transform(df[col].fillna(''))

                    # Add top TF-IDF features
                    feature_names = vectorizer.get_feature_names_out()
                    for i, feature in enumerate(feature_names[:10]):  # Top 10 features
                        df[f'{col}_tfidf_{feature}'] = tfidf_matrix[:, i].toarray().flatten()

                    self.vectorizers[col] = vectorizer
                except Exception as e:
                    logger.warning(f"Could not create TF-IDF features for {col}: {e}")

        return df

    def create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create feature interaction terms"""
        logger.info("Creating feature interaction terms")

        df = df.copy()

        # Price and weather interactions
        if 'price_mean' in df.columns and 'temperature' in df.columns:
            df['price_temperature_interaction'] = df['price_mean'] * df['temperature']

        if 'price_mean' in df.columns and 'rainfall' in df.columns:
            df['price_rainfall_interaction'] = df['price_mean'] * df['rainfall']

        # Seasonal interactions
        if 'month' in df.columns and 'region_encoded' in df.columns:
            df['seasonal_region_interaction'] = df['month'] * df['region_encoded']

        # Product category interactions
        if 'category_encoded' in df.columns and 'region_encoded' in df.columns:
            df['category_region_interaction'] = df['category_encoded'] * df['region_encoded']

        return df

    def apply_pca_features(self, df: pd.DataFrame, feature_groups: Dict[str, List[str]], n_components: int = 5) -> pd.DataFrame:
        """Apply PCA to reduce dimensionality of feature groups"""
        logger.info("Applying PCA for dimensionality reduction")

        df = df.copy()

        for group_name, features in feature_groups.items():
            available_features = [f for f in features if f in df.columns]

            if len(available_features) >= n_components:
                try:
                    pca = PCA(n_components=n_components)
                    pca_features = pca.fit_transform(df[available_features].fillna(0))

                    # Add PCA components
                    for i in range(n_components):
                        df[f'{group_name}_pca_{i}'] = pca_features[:, i]

                    self.pca_models[group_name] = pca

                    logger.info(f"Applied PCA to {group_name}: {len(available_features)} -> {n_components} components")
                except Exception as e:
                    logger.warning(f"Could not apply PCA to {group_name}: {e}")

        return df

    def scale_features(self, df: pd.DataFrame, numerical_features: List[str], method: str = 'standard') -> pd.DataFrame:
        """Scale numerical features"""
        logger.info(f"Scaling {len(numerical_features)} numerical features using {method} scaling")

        df = df.copy()

        if method == 'standard':
            scaler = StandardScaler()
        elif method == 'minmax':
            scaler = MinMaxScaler()
        else:
            raise ValueError(f"Unknown scaling method: {method}")

        # Fit and transform
        scaled_features = scaler.fit_transform(df[numerical_features].fillna(0))
        df[numerical_features] = scaled_features

        self.scalers[method] = scaler

        return df

    def engineer_all_features(self, data_dict: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
        """Apply all feature engineering steps"""
        logger.info("Starting comprehensive feature engineering")

        engineered_data = {}

        # Process each data type
        for data_type, df in data_dict.items():
            logger.info(f"Engineering features for {data_type}")

            # Start with a copy
            features_df = df.copy()

            # Apply feature engineering based on data type
            if data_type in ['transactions', 'market_prices']:
                features_df = self.create_temporal_features(features_df)
                features_df = self.create_price_features(features_df)
                features_df = self.create_location_features(features_df)

            if data_type == 'weather':
                features_df = self.create_temporal_features(features_df)
                features_df = self.create_weather_features(features_df)
                features_df = self.create_location_features(features_df)

            if data_type == 'products':
                features_df = self.create_text_features(features_df, ['name', 'description'])
                features_df = self.create_location_features(features_df)

            # Create interaction features
            features_df = self.create_interaction_features(features_df)

            # Apply PCA to reduce dimensionality (optional)
            if len(features_df.columns) > 50:  # If we have many features
                numerical_cols = features_df.select_dtypes(include=[np.number]).columns.tolist()
                if len(numerical_cols) > 10:
                    pca_groups = {
                        'price_features': [col for col in numerical_cols if 'price' in col],
                        'temporal_features': [col for col in numerical_cols if any(x in col for x in ['day', 'month', 'week', 'season'])],
                        'location_features': [col for col in numerical_cols if any(x in col for x in ['region', 'district', 'lat', 'lng'])],
                    }
                    features_df = self.apply_pca_features(features_df, pca_groups)

            # Scale numerical features
            numerical_cols = features_df.select_dtypes(include=[np.number]).columns.tolist()
            if numerical_cols:
                features_df = self.scale_features(features_df, numerical_cols, method='standard')

            engineered_data[data_type] = features_df
            logger.info(f"Engineered {len(features_df.columns)} features for {data_type}")

        # Create cross-dataset features
        if 'transactions' in engineered_data and 'weather' in engineered_data:
            engineered_data['price_weather_features'] = self.create_supply_demand_features(
                data_dict['transactions'], data_dict.get('products', pd.DataFrame())
            )

        logger.info("Feature engineering completed")
        return engineered_data
