import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, Users, Award, Zap } from 'lucide-react';
import api from '../../api/axios';

const MarketIntelligence = ({ farmId, region }) => {
  const [marketTrends, setMarketTrends] = useState(null);
  const [benchmarking, setBenchmarking] = useState(null);
  const [regionalData, setRegionalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState('maize');
  const [selectedRegion, setSelectedRegion] = useState(region || 'Dar es Salaam');

  useEffect(() => {
    fetchMarketData();
  }, [farmId, selectedCrop, selectedRegion]);

  const fetchMarketData = async () => {
    try {
      setLoading(true);

      // Fetch market trends
      const trendsRes = await api.get(`/api/analytics/market/trends/${selectedRegion}/${selectedCrop}?days=180`);
      setMarketTrends(trendsRes.data);

      // Fetch benchmarking
      const benchRes = await api.get(`/api/analytics/farm/${farmId}/benchmarking`);
      setBenchmarking(benchRes.data);

      // Aggregate regional data
      const regionalRes = await api.get(`/api/analytics/market/trends/${selectedRegion}/${selectedCrop}?days=365`);
      setRegionalData(regionalRes.data);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading market intelligence...</div>;
  }

  const generateBenchmarkChart = () => {
    if (!benchmarking || !benchmarking.benchmark_available) return [];

    return [
      {
        metric: 'Health Score',
        your_value: benchmarking.your_metrics.health_score,
        benchmark: benchmarking.benchmark_metrics.health_score
      },
      {
        metric: 'ROI',
        your_value: benchmarking.your_metrics.roi,
        benchmark: benchmarking.benchmark_metrics.roi
      },
      {
        metric: 'Productivity',
        your_value: benchmarking.your_metrics.productivity,
        benchmark: benchmarking.benchmark_metrics.productivity
      }
    ];
  };

  const generateRadarData = () => {
    if (!benchmarking || !benchmarking.benchmark_available) return [];

    const maxValue = 100;
    return [
      {
        subject: 'Health',
        your_farm: (benchmarking.your_metrics.health_score / maxValue) * 100,
        benchmark: (benchmarking.benchmark_metrics.health_score / maxValue) * 100,
        fullMark: 100
      },
      {
        subject: 'Productivity',
        your_farm: Math.min((benchmarking.your_metrics.productivity / maxValue) * 100, 100),
        benchmark: Math.min((benchmarking.benchmark_metrics.productivity / maxValue) * 100, 100),
        fullMark: 100
      },
      {
        subject: 'Profitability',
        your_farm: Math.max(benchmarking.your_metrics.roi, 0),
        benchmark: Math.max(benchmarking.benchmark_metrics.roi, 0),
        fullMark: 100
      }
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Market Intelligence</h1>
          <p className="text-gray-600">Regional trends, competitor analysis, and optimization insights</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Crop</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Regional Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MarketCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Avg Price"
            value={marketTrends?.average_price || 0}
            unit="TZS"
            color="bg-blue-500"
          />
          <MarketCard
            icon={<Zap className="w-8 h-8" />}
            title="Price Range"
            value={`${marketTrends?.min_price || 0} - ${marketTrends?.max_price || 0}`}
            unit="TZS"
            color="bg-purple-500"
          />
          <MarketCard
            icon={<Users className="w-8 h-8" />}
            title="Market Activity"
            value={marketTrends?.transaction_count || 0}
            unit="transactions"
            color="bg-green-500"
          />
          <MarketCard
            icon={<Award className="w-8 h-8" />}
            title="Demand Level"
            value={marketTrends?.demand_level || 'N/A'}
            unit=""
            color="bg-orange-500"
          />
        </div>

        {/* Trend Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Price Trend */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Trend (180 Days)</h2>
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

          {/* Trend Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Trend Summary</h2>
            {marketTrends && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Current Trend</p>
                  <p className={`text-2xl font-bold ${
                    marketTrends.trend === 'increasing' ? 'text-green-600' :
                    marketTrends.trend === 'decreasing' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {marketTrends.trend === 'increasing' ? '📈 Increasing' :
                     marketTrends.trend === 'decreasing' ? '📉 Decreasing' :
                     '➡️ Stable'}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Price Change</p>
                  <p className={`text-2xl font-bold ${marketTrends.price_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {marketTrends.price_change > 0 ? '+' : ''}{marketTrends.price_change.toFixed(2)}%
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Seasonal Factor</p>
                  <p className="text-2xl font-bold text-purple-600">{(marketTrends.seasonal_factor || 1).toFixed(2)}x</p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Market Status</p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      marketTrends.demand_level === 'high' ? 'bg-green-500' :
                      marketTrends.demand_level === 'medium' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {marketTrends.demand_level} Demand
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Benchmarking */}
        {benchmarking && benchmarking.benchmark_available && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Radar Chart */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Comparison</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={generateRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Your Farm" dataKey="your_farm" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Radar name="Benchmark" dataKey="benchmark" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Benchmarking Details */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Benchmark Analysis</h2>
              <div className="space-y-4">
                <BenchmarkMetric
                  label="Health Score"
                  your_value={benchmarking.your_metrics.health_score}
                  benchmark={benchmarking.benchmark_metrics.health_score}
                  diff={benchmarking.comparison.health_score_diff}
                />
                <BenchmarkMetric
                  label="ROI"
                  your_value={benchmarking.your_metrics.roi}
                  benchmark={benchmarking.benchmark_metrics.roi}
                  diff={benchmarking.comparison.roi_diff}
                />
                <BenchmarkMetric
                  label="Productivity"
                  your_value={benchmarking.your_metrics.productivity}
                  benchmark={benchmarking.benchmark_metrics.productivity}
                  diff={benchmarking.comparison.productivity_diff}
                />

                <div className="bg-white rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-600 mb-2">Similar Farms Analyzed</p>
                  <p className="text-2xl font-bold text-green-600">{benchmarking.similar_farms_count}</p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Performance Status</p>
                  <p className={`text-lg font-semibold ${
                    benchmarking.comparison.health_score_diff > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {benchmarking.comparison.health_score_diff > 0 ? '✓ Above Average' : '⚠ Below Average'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROI Optimization Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ROI Optimization Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RecommendationCard
              title="Increase Productivity"
              description="Your productivity is below benchmark. Consider improving irrigation and soil management."
              priority="high"
              impact="Potential +15% yield increase"
            />
            <RecommendationCard
              title="Optimize Timing"
              description="Market prices are trending upward. Consider timing your harvest for peak prices."
              priority="medium"
              impact="Potential +10% revenue increase"
            />
            <RecommendationCard
              title="Reduce Expenses"
              description="Your expenses are higher than similar farms. Review input costs and labor efficiency."
              priority="high"
              impact="Potential +20% ROI improvement"
            />
            <RecommendationCard
              title="Diversify Crops"
              description="Consider growing complementary crops to reduce market risk and improve soil health."
              priority="medium"
              impact="Improved resilience"
            />
            <RecommendationCard
              title="Improve Health Score"
              description="Focus on pest management and soil quality to improve overall farm health."
              priority="medium"
              impact="Potential +25% long-term yield"
            />
            <RecommendationCard
              title="Market Positioning"
              description="With current demand levels, premium pricing is possible. Improve product quality."
              priority="low"
              impact="Potential +5-10% price premium"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const MarketCard = ({ icon, title, value, unit, color }) => (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
        </p>
      </div>
      <div className={`${color} text-white p-3 rounded-lg`}>
        {icon}
      </div>
    </div>
  </div>
);

const BenchmarkMetric = ({ label, your_value, benchmark, diff }) => (
  <div className="bg-white rounded-lg p-4">
    <p className="text-sm text-gray-600 mb-2">{label}</p>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">Your Farm</p>
        <p className="text-lg font-bold text-gray-900">{your_value.toFixed(1)}</p>
      </div>
      <div className="text-center">
        <p className={`text-sm font-medium ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
        </p>
      </div>
      <div>
        <p className="text-sm text-gray-500">Benchmark</p>
        <p className="text-lg font-bold text-gray-900">{benchmark.toFixed(1)}</p>
      </div>
    </div>
  </div>
);

const RecommendationCard = ({ title, description, priority, impact }) => {
  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border-l-4 border-gray-300">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded border ${priorityColors[priority]}`}>
          {priority.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-gray-700 mb-3">{description}</p>
      <div className="bg-white rounded p-2">
        <p className="text-xs text-gray-600">
          <strong>Potential Impact:</strong> {impact}
        </p>
      </div>
    </div>
  );
};

export default MarketIntelligence;
