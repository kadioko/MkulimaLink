"""
Price Prediction Model
LSTM-based model with attention mechanism for agricultural price forecasting
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models, optimizers, callbacks
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_percentage_error, mean_squared_error
import joblib
import mlflow
import mlflow.tensorflow

logger = logging.getLogger(__name__)

class PricePredictionModel:
    """LSTM-based price prediction model with attention mechanism"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.models_dir = Path(config['models_dir']) / 'price_prediction'
        self.models_dir.mkdir(exist_ok=True)

        # Model parameters
        self.sequence_length = config.get('sequence_length', 30)
        self.prediction_horizon = config.get('prediction_horizon', 7)
        self.lstm_units = config.get('lstm_units', 128)
        self.attention_units = config.get('attention_units', 64)
        self.dropout_rate = config.get('dropout_rate', 0.2)
        self.learning_rate = config.get('learning_rate', 0.001)

        # Model components
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []

        # Initialize MLflow
        mlflow.set_experiment("mkulimalink_price_prediction")

    def build_model(self, input_shape: Tuple[int, int]) -> keras.Model:
        """Build the LSTM model with attention mechanism"""
        inputs = layers.Input(shape=input_shape)

        # LSTM layers
        lstm_out = layers.LSTM(
            self.lstm_units,
            return_sequences=True,
            dropout=self.dropout_rate,
            recurrent_dropout=self.dropout_rate
        )(inputs)

        lstm_out = layers.LSTM(
            self.lstm_units // 2,
            return_sequences=True,
            dropout=self.dropout_rate,
            recurrent_dropout=self.dropout_rate
        )(lstm_out)

        # Attention mechanism
        attention = self._build_attention_layer(self.attention_units)(lstm_out)

        # Dense layers
        dense_out = layers.Dense(64, activation='relu')(attention)
        dense_out = layers.Dropout(self.dropout_rate)(dense_out)
        dense_out = layers.Dense(32, activation='relu')(dense_out)
        dense_out = layers.Dropout(self.dropout_rate)(dense_out)

        # Output layer (predict next price)
        outputs = layers.Dense(1, activation='linear')(dense_out)

        model = models.Model(inputs=inputs, outputs=outputs)

        # Compile model
        optimizer = optimizers.Adam(learning_rate=self.learning_rate)
        model.compile(
            optimizer=optimizer,
            loss='mean_squared_error',
            metrics=['mae', 'mse', self._mape_metric]
        )

        return model

    def _build_attention_layer(self, units: int) -> keras.layers.Layer:
        """Build attention mechanism layer"""
        def attention_layer(inputs):
            # Attention weights
            attention_weights = layers.Dense(units, activation='tanh')(inputs)
            attention_weights = layers.Dense(1, activation='softmax')(attention_weights)

            # Apply attention
            context_vector = layers.Multiply()([inputs, attention_weights])
            context_vector = layers.Lambda(lambda x: tf.reduce_sum(x, axis=1))(context_vector)

            return context_vector

        return layers.Lambda(attention_layer)

    def _mape_metric(self, y_true, y_pred):
        """Mean Absolute Percentage Error metric"""
        return tf.reduce_mean(tf.abs((y_true - y_pred) / (y_true + 1e-7))) * 100

    def preprocess_data(self, data: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """Preprocess data for model training"""
        logger.info("Preprocessing data for price prediction")

        # Handle missing values
        data = data.fillna(method='ffill').fillna(method='bfill').fillna(0)

        # Identify feature columns
        exclude_columns = ['date', 'product_name', 'category', 'region', 'target_price']
        feature_columns = [col for col in data.columns if col not in exclude_columns]

        # Encode categorical variables
        categorical_columns = ['category', 'region']
        for col in categorical_columns:
            if col in data.columns:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                    data[col] = self.label_encoders[col].fit_transform(data[col].astype(str))
                else:
                    # Handle new categories
                    known_categories = set(self.label_encoders[col].classes_)
                    data[col] = data[col].astype(str).apply(
                        lambda x: x if x in known_categories else 'unknown'
                    )
                    data[col] = self.label_encoders[col].transform(data[col])

        # Scale numerical features
        numerical_columns = [col for col in feature_columns if col not in categorical_columns]
        if numerical_columns:
            data[numerical_columns] = self.scaler.fit_transform(data[numerical_columns])

        # Create sequences
        sequences = []
        targets = []

        # Group by product and region
        grouped = data.groupby(['product_name', 'region'])

        for (product, region), group in grouped:
            group = group.sort_values('date')
            values = group[feature_columns].values

            if len(values) > self.sequence_length:
                for i in range(len(values) - self.sequence_length - self.prediction_horizon + 1):
                    seq = values[i:i + self.sequence_length]
                    target = values[i + self.sequence_length + self.prediction_horizon - 1][0]  # Predict price
                    sequences.append(seq)
                    targets.append(target)

        X = np.array(sequences)
        y = np.array(targets)

        logger.info(f"Created {len(X)} sequences with shape {X.shape}")

        return X, y, feature_columns

    async def train(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Train the price prediction model"""
        logger.info("Starting price prediction model training")

        with mlflow.start_run():
            # Log parameters
            mlflow.log_params({
                'sequence_length': self.sequence_length,
                'prediction_horizon': self.prediction_horizon,
                'lstm_units': self.lstm_units,
                'attention_units': self.attention_units,
                'dropout_rate': self.dropout_rate,
                'learning_rate': self.learning_rate,
            })

            # Preprocess data
            X, y, feature_columns = self.preprocess_data(data)
            self.feature_columns = feature_columns

            # Split data
            split_idx = int(len(X) * (1 - self.config.get('test_split', 0.1)))
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]

            # Build model
            input_shape = (X_train.shape[1], X_train.shape[2])
            self.model = self.build_model(input_shape)

            # Callbacks
            callbacks_list = [
                callbacks.EarlyStopping(
                    monitor='val_loss',
                    patience=10,
                    restore_best_weights=True
                ),
                callbacks.ModelCheckpoint(
                    str(self.models_dir / 'best_model.h5'),
                    monitor='val_loss',
                    save_best_only=True
                ),
                callbacks.ReduceLROnPlateau(
                    monitor='val_loss',
                    factor=0.5,
                    patience=5,
                    min_lr=1e-6
                )
            ]

            # Train model
            history = self.model.fit(
                X_train, y_train,
                validation_split=self.config.get('validation_split', 0.2),
                epochs=self.config.get('epochs', 100),
                batch_size=self.config.get('batch_size', 32),
                callbacks=callbacks_list,
                verbose=1
            )

            # Evaluate model
            test_loss, test_mae, test_mse, test_mape = self.model.evaluate(X_test, y_test, verbose=0)

            # Log metrics
            mlflow.log_metrics({
                'test_loss': test_loss,
                'test_mae': test_mae,
                'test_mse': test_mse,
                'test_mape': test_mape,
                'final_epoch': len(history.history['loss'])
            })

            # Log model
            mlflow.tensorflow.log_model(self.model, "model")

            results = {
                'status': 'completed',
                'metrics': {
                    'test_loss': test_loss,
                    'test_mae': test_mae,
                    'test_mse': test_mse,
                    'test_mape': test_mape,
                },
                'training_history': history.history,
                'model_summary': self._get_model_summary(),
            }

            logger.info(f"Model training completed with MAPE: {test_mape:.2f}%")
            return results

    async def evaluate(self, data: pd.DataFrame) -> Dict[str, float]:
        """Evaluate the trained model"""
        if not self.model:
            raise ValueError("Model not trained yet")

        logger.info("Evaluating price prediction model")

        X, y, _ = self.preprocess_data(data)

        # Make predictions
        predictions = self.model.predict(X, batch_size=self.config.get('batch_size', 32))

        # Calculate metrics
        mape = mean_absolute_percentage_error(y, predictions) * 100
        mse = mean_squared_error(y, predictions)
        rmse = np.sqrt(mse)

        # Calculate directional accuracy (trend prediction)
        actual_direction = np.diff(y)
        predicted_direction = np.diff(predictions.flatten())
        directional_accuracy = np.mean(
            (actual_direction > 0) == (predicted_direction > 0)
        ) * 100

        metrics = {
            'mape': mape,
            'mse': mse,
            'rmse': rmse,
            'directional_accuracy': directional_accuracy,
        }

        logger.info(f"Model evaluation - MAPE: {mape:.2f}%, Directional Accuracy: {directional_accuracy:.2f}%")
        return metrics

    async def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Make price predictions"""
        if not self.model:
            raise ValueError("Model not loaded")

        # This would preprocess input data and make predictions
        # For now, return mock predictions
        predictions = {
            'current_price': input_data.get('current_price', 0),
            'predicted_price_1d': input_data.get('current_price', 0) * 1.02,
            'predicted_price_7d': input_data.get('current_price', 0) * 1.05,
            'confidence': 0.85,
            'trend': 'upward',
        }

        return predictions

    async def save_model(self):
        """Save the trained model and preprocessing objects"""
        if not self.model:
            raise ValueError("No model to save")

        logger.info("Saving price prediction model")

        # Save TensorFlow model
        model_path = self.models_dir / 'price_prediction_model'
        self.model.save(str(model_path))

        # Save preprocessing objects
        joblib.dump(self.scaler, self.models_dir / 'scaler.pkl')
        joblib.dump(self.label_encoders, self.models_dir / 'label_encoders.pkl')
        joblib.dump(self.feature_columns, self.models_dir / 'feature_columns.pkl')

        logger.info(f"Model saved to {model_path}")

    async def load_model(self):
        """Load the trained model and preprocessing objects"""
        logger.info("Loading price prediction model")

        model_path = self.models_dir / 'price_prediction_model'

        if not model_path.exists():
            raise FileNotFoundError(f"Model not found at {model_path}")

        # Load TensorFlow model
        self.model = models.load_model(str(model_path))

        # Load preprocessing objects
        self.scaler = joblib.load(self.models_dir / 'scaler.pkl')
        self.label_encoders = joblib.load(self.models_dir / 'label_encoders.pkl')
        self.feature_columns = joblib.load(self.models_dir / 'feature_columns.pkl')

        logger.info("Model loaded successfully")

    def _get_model_summary(self) -> str:
        """Get model architecture summary"""
        if not self.model:
            return "Model not built yet"

        # Capture model summary
        from io import StringIO
        summary_stream = StringIO()
        self.model.summary(print_fn=lambda x: summary_stream.write(x + '\n'))
        return summary_stream.getvalue()
