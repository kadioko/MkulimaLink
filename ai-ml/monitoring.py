"""
Model Monitoring and Retraining Pipeline
Automated monitoring, alerting, and retraining for ML models
"""

import os
import logging
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import mlflow
import redis.asyncio as redis
from sqlalchemy import create_engine, text
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from .ml_pipeline import MLPipeline

logger = logging.getLogger(__name__)

class ModelMonitor:
    """Monitor ML model performance and trigger retraining"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.db_engine = create_engine(config['database_url'])
        self.redis_client = redis.from_url(config['redis_url'])
        self.ml_pipeline = MLPipeline(config)

        # Monitoring thresholds
        self.thresholds = {
            'price_prediction': {
                'mape_threshold': 0.15,  # 15% MAPE
                'drift_threshold': 0.1,  # 10% feature drift
                'min_samples': 1000,     # Minimum samples for monitoring
            },
            'disease_detection': {
                'accuracy_threshold': 0.85,  # 85% accuracy
                'min_samples': 500,
            },
            'recommendations': {
                'precision_threshold': 0.7,  # 70% precision
                'min_samples': 1000,
            }
        }

        # Email configuration
        self.email_config = {
            'smtp_server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
            'smtp_port': int(os.getenv('SMTP_PORT', '587')),
            'sender_email': os.getenv('SENDER_EMAIL'),
            'sender_password': os.getenv('SENDER_PASSWORD'),
            'alert_recipients': os.getenv('ALERT_RECIPIENTS', '').split(','),
        }

    async def monitor_models(self) -> Dict[str, Any]:
        """Monitor all ML models for performance degradation"""
        logger.info("Starting model monitoring")

        monitoring_results = {}

        for model_name in ['price_prediction', 'disease_detection', 'recommendations']:
            try:
                result = await self._monitor_single_model(model_name)
                monitoring_results[model_name] = result

                # Check if retraining is needed
                if result['needs_retraining']:
                    logger.warning(f"Model {model_name} needs retraining: {result['issues']}")
                    await self._trigger_retraining(model_name, result)

            except Exception as e:
                logger.error(f"Failed to monitor {model_name}: {e}")
                monitoring_results[model_name] = {
                    'status': 'error',
                    'error': str(e),
                    'needs_retraining': False
                }

        # Store monitoring results
        await self._store_monitoring_results(monitoring_results)

        logger.info("Model monitoring completed")
        return monitoring_results

    async def _monitor_single_model(self, model_name: str) -> Dict[str, Any]:
        """Monitor a single model's performance"""
        logger.info(f"Monitoring {model_name} model")

        # Get recent predictions and actuals
        predictions_data = await self._get_recent_predictions(model_name)

        if len(predictions_data) < self.thresholds[model_name]['min_samples']:
            return {
                'status': 'insufficient_data',
                'sample_count': len(predictions_data),
                'needs_retraining': False,
                'issues': []
            }

        issues = []

        # Model-specific monitoring
        if model_name == 'price_prediction':
            metrics = await self._calculate_price_metrics(predictions_data)
            issues.extend(await self._check_price_thresholds(metrics))

        elif model_name == 'disease_detection':
            metrics = await self._calculate_disease_metrics(predictions_data)
            issues.extend(await self._check_disease_thresholds(metrics))

        elif model_name == 'recommendations':
            metrics = await self._calculate_recommendation_metrics(predictions_data)
            issues.extend(await self._check_recommendation_thresholds(metrics))

        # Check for feature drift
        drift_issues = await self._check_feature_drift(model_name)
        issues.extend(drift_issues)

        return {
            'status': 'completed',
            'sample_count': len(predictions_data),
            'metrics': metrics if 'metrics' in locals() else {},
            'issues': issues,
            'needs_retraining': len(issues) > 0
        }

    async def _get_recent_predictions(self, model_name: str, days: int = 7) -> pd.DataFrame:
        """Get recent predictions and actual outcomes"""
        query = f"""
        SELECT * FROM model_predictions
        WHERE model_name = '{model_name}'
        AND created_at >= NOW() - INTERVAL '{days} days'
        ORDER BY created_at DESC
        """

        with self.db_engine.connect() as conn:
            df = pd.read_sql_query(text(query), conn)

        return df

    async def _calculate_price_metrics(self, data: pd.DataFrame) -> Dict[str, float]:
        """Calculate price prediction metrics"""
        if 'actual_price' not in data.columns or 'predicted_price' not in data.columns:
            return {}

        actual = data['actual_price'].values
        predicted = data['predicted_price'].values

        # Mean Absolute Percentage Error
        mape = np.mean(np.abs((actual - predicted) / (actual + 1e-7))) * 100

        # Root Mean Square Error
        rmse = np.sqrt(np.mean((actual - predicted) ** 2))

        # Directional Accuracy (trend prediction)
        actual_direction = np.diff(actual)
        predicted_direction = np.diff(predicted)
        directional_accuracy = np.mean(
            (actual_direction > 0) == (predicted_direction > 0)
        ) * 100

        return {
            'mape': mape,
            'rmse': rmse,
            'directional_accuracy': directional_accuracy,
            'sample_count': len(data)
        }

    async def _check_price_thresholds(self, metrics: Dict[str, float]) -> List[str]:
        """Check if price prediction metrics exceed thresholds"""
        issues = []

        if metrics.get('mape', 0) > self.thresholds['price_prediction']['mape_threshold'] * 100:
            issues.append(f"MAPE too high: {metrics['mape']:.2f}%")

        if metrics.get('directional_accuracy', 100) < 60:  # Less than 60% directional accuracy
            issues.append(f"Directional accuracy too low: {metrics['directional_accuracy']:.2f}%")

        return issues

    async def _calculate_disease_metrics(self, data: pd.DataFrame) -> Dict[str, float]:
        """Calculate disease detection metrics"""
        if 'actual_disease' not in data.columns or 'predicted_disease' not in data.columns:
            return {}

        actual = data['actual_disease'].values
        predicted = data['predicted_disease'].values

        # Accuracy
        accuracy = np.mean(actual == predicted)

        # Precision and Recall (for disease detection)
        true_positives = np.sum((actual == 1) & (predicted == 1))
        false_positives = np.sum((actual == 0) & (predicted == 1))
        false_negatives = np.sum((actual == 1) & (predicted == 0))

        precision = true_positives / (true_positives + false_positives + 1e-7)
        recall = true_positives / (true_positives + false_negatives + 1e-7)
        f1_score = 2 * precision * recall / (precision + recall + 1e-7)

        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1_score,
            'sample_count': len(data)
        }

    async def _check_disease_thresholds(self, metrics: Dict[str, float]) -> List[str]:
        """Check if disease detection metrics exceed thresholds"""
        issues = []

        if metrics.get('accuracy', 1) < self.thresholds['disease_detection']['accuracy_threshold']:
            issues.append(f"Accuracy too low: {metrics['accuracy']:.2f}")

        if metrics.get('f1_score', 1) < 0.7:  # Less than 70% F1 score
            issues.append(f"F1 score too low: {metrics['f1_score']:.2f}")

        return issues

    async def _calculate_recommendation_metrics(self, data: pd.DataFrame) -> Dict[str, float]:
        """Calculate recommendation metrics"""
        if 'clicked' not in data.columns:
            return {}

        # Click-through rate
        ctr = data['clicked'].mean()

        # Precision@K (assuming binary relevance)
        precision_at_5 = data.groupby('user_id')['clicked'].head(5).mean()
        precision_at_10 = data.groupby('user_id')['clicked'].head(10).mean()

        return {
            'ctr': ctr,
            'precision_at_5': precision_at_5,
            'precision_at_10': precision_at_10,
            'sample_count': len(data)
        }

    async def _check_recommendation_thresholds(self, metrics: Dict[str, float]) -> List[str]:
        """Check if recommendation metrics exceed thresholds"""
        issues = []

        if metrics.get('precision_at_5', 1) < self.thresholds['recommendations']['precision_threshold']:
            issues.append(f"Precision@5 too low: {metrics['precision_at_5']:.2f}")

        if metrics.get('ctr', 1) < 0.05:  # Less than 5% CTR
            issues.append(f"CTR too low: {metrics['ctr']:.2f}")

        return issues

    async def _check_feature_drift(self, model_name: str) -> List[str]:
        """Check for feature distribution drift"""
        issues = []

        try:
            # Get baseline feature distributions (from training)
            baseline_key = f"baseline_features:{model_name}"
            baseline_data = await self.redis_client.get(baseline_key)

            if not baseline_data:
                # Store current data as baseline if none exists
                await self._store_baseline_features(model_name)
                return []

            baseline_stats = pd.read_json(baseline_data)

            # Get current feature distributions
            current_stats = await self._calculate_current_feature_stats(model_name)

            # Calculate drift using Population Stability Index (PSI)
            psi_values = {}
            for feature in baseline_stats.columns:
                if feature in current_stats.columns:
                    psi = self._calculate_psi(
                        baseline_stats[feature].values,
                        current_stats[feature].values
                    )
                    psi_values[feature] = psi

                    if psi > self.thresholds[model_name]['drift_threshold']:
                        issues.append(f"Feature drift in {feature}: PSI = {psi:.3f}")

        except Exception as e:
            logger.error(f"Error checking feature drift: {e}")

        return issues

    def _calculate_psi(self, expected: np.ndarray, actual: np.ndarray, bins: int = 10) -> float:
        """Calculate Population Stability Index"""
        try:
            # Create bins
            min_val = min(np.min(expected), np.min(actual))
            max_val = max(np.max(expected), np.max(actual))

            if min_val == max_val:
                return 0.0

            bins_edges = np.linspace(min_val, max_val, bins + 1)

            # Calculate distributions
            expected_dist, _ = np.histogram(expected, bins=bins_edges, density=True)
            actual_dist, _ = np.histogram(actual, bins=bins_edges, density=True)

            # Add small value to avoid division by zero
            expected_dist = expected_dist + 1e-6
            actual_dist = actual_dist + 1e-6

            # Calculate PSI
            psi = np.sum((actual_dist - expected_dist) * np.log(actual_dist / expected_dist))

            return psi

        except Exception:
            return 0.0

    async def _store_baseline_features(self, model_name: str):
        """Store baseline feature statistics"""
        try:
            # Get recent data for baseline
            query = f"""
            SELECT * FROM model_features
            WHERE model_name = '{model_name}'
            AND created_at >= NOW() - INTERVAL '30 days'
            """

            with self.db_engine.connect() as conn:
                df = pd.read_sql_query(text(query), conn)

            if not df.empty:
                # Calculate statistics for each feature
                stats = df.describe()
                baseline_key = f"baseline_features:{model_name}"
                await self.redis_client.set(baseline_key, stats.to_json())

        except Exception as e:
            logger.error(f"Error storing baseline features: {e}")

    async def _calculate_current_feature_stats(self, model_name: str) -> pd.DataFrame:
        """Calculate current feature statistics"""
        try:
            # Get recent feature data
            query = f"""
            SELECT * FROM model_features
            WHERE model_name = '{model_name}'
            AND created_at >= NOW() - INTERVAL '7 days'
            """

            with self.db_engine.connect() as conn:
                df = pd.read_sql_query(text(query), conn)

            return df.describe() if not df.empty else pd.DataFrame()

        except Exception as e:
            logger.error(f"Error calculating current feature stats: {e}")
            return pd.DataFrame()

    async def _trigger_retraining(self, model_name: str, monitoring_result: Dict[str, Any]):
        """Trigger model retraining"""
        logger.info(f"Triggering retraining for {model_name}")

        try:
            # Send alert email
            await self._send_alert_email(
                f"Model Retraining Required: {model_name}",
                f"Issues detected: {', '.join(monitoring_result['issues'])}"
            )

            # Queue retraining job
            retraining_data = {
                'model_name': model_name,
                'issues': monitoring_result['issues'],
                'metrics': monitoring_result.get('metrics', {}),
                'triggered_at': datetime.now().isoformat(),
            }

            await self.redis_client.lpush('retraining_queue', str(retraining_data))

            # Log retraining trigger
            mlflow.log_param(f"{model_name}_retraining_triggered", str(retraining_data))

        except Exception as e:
            logger.error(f"Failed to trigger retraining for {model_name}: {e}")

    async def _send_alert_email(self, subject: str, message: str):
        """Send alert email notification"""
        try:
            if not self.email_config['sender_email']:
                logger.warning("Email configuration not set, skipping alert")
                return

            msg = MIMEMultipart()
            msg['From'] = self.email_config['sender_email']
            msg['To'] = ', '.join(self.email_config['alert_recipients'])
            msg['Subject'] = f"MkulimaLink ML Alert: {subject}"

            body = f"""
            MkulimaLink ML Monitoring Alert

            {message}

            Timestamp: {datetime.now().isoformat()}

            Please check the ML monitoring dashboard for details.

            Best regards,
            MkulimaLink ML Team
            """

            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP(
                self.email_config['smtp_server'],
                self.email_config['smtp_port']
            )
            server.starttls()
            server.login(
                self.email_config['sender_email'],
                self.email_config['sender_password']
            )
            text = msg.as_string()
            server.sendmail(
                self.email_config['sender_email'],
                self.email_config['alert_recipients'],
                text
            )
            server.quit()

            logger.info(f"Alert email sent: {subject}")

        except Exception as e:
            logger.error(f"Failed to send alert email: {e}")

    async def _store_monitoring_results(self, results: Dict[str, Any]):
        """Store monitoring results in database"""
        try:
            monitoring_record = {
                'timestamp': datetime.now(),
                'results': results,
            }

            # Insert into monitoring table
            query = """
            INSERT INTO model_monitoring (timestamp, results)
            VALUES (:timestamp, :results)
            """

            with self.db_engine.connect() as conn:
                conn.execute(text(query), {
                    'timestamp': monitoring_record['timestamp'],
                    'results': str(monitoring_record['results'])
                })

            logger.info("Monitoring results stored")

        except Exception as e:
            logger.error(f"Failed to store monitoring results: {e}")

    async def run_monitoring_cycle(self):
        """Run a complete monitoring cycle"""
        while True:
            try:
                logger.info("Starting monitoring cycle")

                # Run monitoring
                results = await self.monitor_models()

                # Check for retraining jobs
                await self._process_retraining_queue()

                # Wait for next cycle (run every 6 hours)
                await asyncio.sleep(6 * 60 * 60)

            except Exception as e:
                logger.error(f"Monitoring cycle error: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retry

    async def _process_retraining_queue(self):
        """Process pending retraining jobs"""
        try:
            while True:
                # Get next retraining job
                job_data = await self.redis_client.rpop('retraining_queue')
                if not job_data:
                    break

                job = eval(job_data)  # Convert string back to dict
                model_name = job['model_name']

                logger.info(f"Processing retraining job for {model_name}")

                # Run retraining
                success = await self._run_retraining(model_name)

                if success:
                    logger.info(f"Retraining completed for {model_name}")
                else:
                    logger.error(f"Retraining failed for {model_name}")
                    # Put job back in queue for retry
                    await self.redis_client.lpush('retraining_queue', job_data)

        except Exception as e:
            logger.error(f"Error processing retraining queue: {e}")

    async def _run_retraining(self, model_name: str) -> bool:
        """Run retraining for a specific model"""
        try:
            logger.info(f"Starting retraining for {model_name}")

            # Run the ML pipeline
            result = await self.ml_pipeline.run_pipeline()

            if result['status'] == 'success':
                # Send success notification
                await self._send_alert_email(
                    f"Model Retrained Successfully: {model_name}",
                    f"Retraining completed with metrics: {result.get('evaluation_results', {})}"
                )
                return True
            else:
                # Send failure notification
                await self._send_alert_email(
                    f"Model Retraining Failed: {model_name}",
                    f"Error: {result.get('error', 'Unknown error')}"
                )
                return False

        except Exception as e:
            logger.error(f"Retraining failed for {model_name}: {e}")
            return False

    async def get_monitoring_dashboard(self) -> Dict[str, Any]:
        """Get monitoring dashboard data"""
        try:
            # Get recent monitoring results
            query = """
            SELECT * FROM model_monitoring
            ORDER BY timestamp DESC
            LIMIT 10
            """

            with self.db_engine.connect() as conn:
                df = pd.read_sql_query(text(query), conn)

            # Get current model statuses
            model_statuses = {}
            for model_name in ['price_prediction', 'disease_detection', 'recommendations']:
                status_key = f"model_status:{model_name}"
                status = await self.redis_client.get(status_key)
                model_statuses[model_name] = status or 'unknown'

            return {
                'recent_monitoring': df.to_dict('records'),
                'model_statuses': model_statuses,
                'alerts': await self._get_recent_alerts(),
            }

        except Exception as e:
            logger.error(f"Failed to get monitoring dashboard: {e}")
            return {}

    async def _get_recent_alerts(self) -> List[Dict[str, Any]]:
        """Get recent monitoring alerts"""
        try:
            # This would query an alerts table
            # For now, return empty list
            return []
        except Exception:
            return []
