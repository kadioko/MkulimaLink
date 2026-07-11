import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import api from '../../api/axios';

const PredictiveAnalytics = ({ farmId, region, crop }) => {
  const [yieldPredictions, setYieldPredictions] = useState(null);
  const [priceForecast, setPriceForecast] = useState(null);
  const [marketTrends, setMarketTrends] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState(crop || 'maize');
  const [selectedRegion, setSelectedRegion] = useState(region || 'Dar es Salaam');

  useEffect(() => {
    fetchPredictions();
  }, [farmId, selectedCrop, selectedRegion]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      
      // Fetch yield predictions
      const yieldRes = await api.get(`/api/analytics/farm/${farmId}/predictions/yield`);
      setYieldPredictions(yieldRes.data);

      // Fetch price forecast
      const priceRes = await api.get(`/api/analytics/market/forecast/${selectedRegion}/${selectedCrop}`);
      setPriceForecast(priceRes.data);

      // Fetch market trends
      const trendsRes = await api.get(`/api/analytics/market/trends/${selectedRegion}/${selectedCrop}?days=90`);
      setMarketTrends(trendsRes.data);

      // Detect anomalies
      detectAnomalies(trendsRes.data);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
      setLoading(false);
    }
  };

  const detectAnomalies = (trends) => {
    const anomalies = [];
    
    if (trends.price_change > 20) {
      anomalies.push({
        type: 'price_spike',
        severity: 'high',
        message: `Unusual price increase of ${trends.price_change}%`,
        recommendation: 'Consider selling now for better prices'
      });
    }

    if (trends.price_change < -20) {
      anomalies.push({
        type: 'price_drop',
        severity: 'medium',
        message: `Price decreased by ${Math.abs(trends.price_change)}%`,
        recommendation: 'Hold for price recovery or diversify crops'
      });
    }

    if (trends.transaction_count < 5) {
      anomalies.push({
        type: 'low_demand',
        severity: 'low',
        message: 'Low market activity detected',
        recommendation: 'Limited market data available'
      });
    }

    setAnomalies(anomalies);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading predictions...</div>;
  }

  const generateForecastChart = () => {
    if (!priceForecast) return null;

    const data = [
      { name: 'Current', price: priceForecast.current_price },
      { name: 'Forecast', price: priceForecast.forecast_price }
    ];

    return data;
  };

  const generateYieldChart = () => {
    if (!yieldPredictions) return null;

    return [
      { month: 'Jan', actual: 800, predicted: 850 },
      { month: 'Feb', actual: 920, predicted: 900 },
      { month: 'Mar', actual: 1050, predicted: 1100 },
      { month: 'Apr', actual: 1200, predicted: 1150 },
      { month: 'May', actual: 1100, predicted: 1250 },
      { month: 'Jun', actual: 1300, predicted: 1350 }
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Predictive Analytics</h1>
          <p className="text-gray-600">AI-powered forecasting for yield, prices, and market trends</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Crop</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="maize">Maize</option>
                <option value="rice">Rice</option>
                <option value="beans">Beans</option>
                <option value="tomatoes">Tomatoes</option>
                <option value="coffee">Coffee</option>
                <option value="tea">Tea</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="Dar es Salaam">Dar es Salaam</option>
                <option value="Arusha">Arusha</option>
                <option value="Mbeya">Mbeya</option>
                <option value="Iringa">Iringa</option>
                <option value="Dodoma">Dodoma</option>
              </select>
            </div>
          </div>
        </div>

        {/* Anomalies Alert */}
        {anomalies.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8 rounded">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">Market Anomalies Detected</h3>
                <div className="space-y-2">
                  {anomalies.map((anomaly, idx) => (
                    <div key={idx} className="text-sm text-yellow-800">
                      <p className="font-medium">{anomaly.message}</p>
                      <p className="text-yellow-700 mt-1">💡 {anomaly.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Yield Prediction */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
              Yield Prediction
            </h2>
            {yieldPredictions && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={generateYieldChart()}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="actual" stroke="#10b981" fillOpacity={1} fill="url(#colorActual)" />
                  <Area type="monotone" dataKey="predicted" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPredicted)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Yield Forecast</h3>
            {yieldPredictions && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Predicted Yield</p>
                  <p className="text-3xl font-bold text-green-600">{yieldPredictions.forecast} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Confidence Level</p>
                  <div className="bg-white rounded h-2">
                    <div 
                      className="bg-green-500 h-2 rounded"
                      style={{ width: `${yieldPredictions.confidence * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{(yieldPredictions.confidence * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Key Factors</p>
                  <ul className="space-y-1">
                    {yieldPredictions.factors && yieldPredictions.factors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-gray-700">✓ {factor}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Recommendations</p>
                  <ul className="space-y-1">
                    {yieldPredictions.recommendations && yieldPredictions.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <Lightbulb className="w-4 h-4 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Price Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Forecast</h2>
            {priceForecast && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={generateForecastChart()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="price" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Price Analysis</h3>
            {priceForecast && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Price</p>
                  <p className="text-3xl font-bold text-purple-600">{priceForecast.current_price} TZS</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Forecast Price</p>
                  <p className="text-3xl font-bold text-indigo-600">{priceForecast.forecast_price} TZS</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trend</p>
                  <p className={`text-lg font-semibold ${priceForecast.trend === 'increasing' ? 'text-green-600' : priceForecast.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'}`}>
                    {priceForecast.trend === 'increasing' ? '📈 Increasing' : priceForecast.trend === 'decreasing' ? '📉 Decreasing' : '➡️ Stable'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border-l-4 border-indigo-500">
                  <p className="text-sm font-medium text-gray-900 mb-1">Recommendation</p>
                  <p className="text-sm text-gray-700">{priceForecast.recommendation}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Market Trends */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-6 h-6 mr-2 text-blue-600" />
            Market Trends (90 Days)
          </h2>
          {marketTrends && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <TrendMetric
                label="Average Price"
                value={marketTrends.average_price}
                unit="TZS"
                color="blue"
              />
              <TrendMetric
                label="Min Price"
                value={marketTrends.min_price}
                unit="TZS"
                color="green"
              />
              <TrendMetric
                label="Max Price"
                value={marketTrends.max_price}
                unit="TZS"
                color="red"
              />
              <TrendMetric
                label="Transactions"
                value={marketTrends.transaction_count}
                unit="deals"
                color="purple"
              />
            </div>
          )}
          
          {marketTrends && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={marketTrends.data_points ? marketTrends.data_points.map((price, idx) => ({ idx, price })) : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="idx" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

const TrendMetric = ({ label, value, unit, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold">
        {typeof value === 'number' ? value.toLocaleString() : value}
        <span className="text-sm ml-1">{unit}</span>
      </p>
    </div>
  );
};

export default PredictiveAnalytics;
