import React, { useState, useEffect } from 'react';
import { Brain, Zap, TrendingUp, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import api from '../../api/axios';

const AIDashboard = () => {
  const [models, setModels] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('models');

  useEffect(() => {
    fetchAIData();
  }, []);

  const fetchAIData = async () => {
    try {
      setLoading(true);
      const [modelsRes, predictionsRes, recsRes] = await Promise.all([
        api.get('/api/aiml/models'),
        api.get('/api/aiml/predictions'),
        api.get('/api/aiml/recommendations')
      ]);

      setModels(modelsRes.data.data || []);
      setPredictions(predictionsRes.data.data?.predictions || []);
      setRecommendations(recsRes.data.data?.recommendations || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading AI Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-purple-600" />
            AI Intelligence Hub
          </h1>
          <p className="text-gray-600">Advanced machine learning for agricultural insights</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {['models', 'predictions', 'recommendations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="space-y-4">
            {predictions.length > 0 ? (
              predictions.map((pred) => (
                <PredictionCard key={pred._id} prediction={pred} />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No predictions yet</p>
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {recommendations.length > 0 ? (
              recommendations.map((rec) => (
                <RecommendationCard key={rec._id} recommendation={rec} />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No recommendations yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ModelCard = ({ model }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
    <h3 className="text-lg font-bold text-gray-900 mb-2">{model.name}</h3>
    <p className="text-sm text-gray-600 mb-4 capitalize">{model.type}</p>

    <div className="space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Accuracy</span>
        <span className="text-lg font-bold text-purple-600">{(model.accuracy * 100).toFixed(1)}%</span>
      </div>
      <div className="bg-gray-200 rounded-full h-2">
        <div
          className="bg-purple-600 h-2 rounded-full"
          style={{ width: `${model.accuracy * 100}%` }}
        />
      </div>
    </div>

    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">Version {model.version}</span>
      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
        Active
      </span>
    </div>
  </div>
);

const PredictionCard = ({ prediction }) => (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900 capitalize">
          {prediction.prediction_type.replace(/_/g, ' ')}
        </h3>
        <p className="text-sm text-gray-600">{prediction.model_name}</p>
      </div>
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
          <span className="text-lg font-bold text-purple-600">
            {(prediction.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>

    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <p className="text-sm text-gray-600 mb-2">Prediction Output</p>
      <pre className="text-xs text-gray-900 overflow-auto max-h-32">
        {JSON.stringify(prediction.output, null, 2)}
      </pre>
    </div>

    <p className="text-xs text-gray-500">
      {new Date(prediction.created_at).toLocaleDateString()}
    </p>
  </div>
);

const RecommendationCard = ({ recommendation }) => {
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    pending: <AlertCircle className="w-5 h-5" />,
    accepted: <CheckCircle className="w-5 h-5 text-green-600" />,
    implemented: <CheckCircle className="w-5 h-5 text-green-600" />
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{recommendation.title}</h3>
          <p className="text-sm text-gray-600">{recommendation.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${priorityColors[recommendation.priority]}`}>
            {recommendation.priority}
          </span>
          {statusIcons[recommendation.status]}
        </div>
      </div>

      {recommendation.action_items && recommendation.action_items.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">Action Items:</p>
          <ul className="space-y-1">
            {recommendation.action_items.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start">
                <span className="mr-2">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Confidence: {(recommendation.confidence * 100).toFixed(0)}%
        </span>
        <span className="text-gray-500">
          {new Date(recommendation.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default AIDashboard;
