import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, DollarSign, Zap, AlertTriangle, MapPin } from 'lucide-react';
import api from '../../api/axios';

const AnalyticsDashboard = ({ farmId }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('health_score');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [farmId, timeRange]);

  const fetchDashboard = async () => {
    try {
      const response = await api.get(`/api/analytics/farm/${farmId}/dashboard`);
      setDashboard(response.data.data);

      const alertsResponse = await api.get('/api/analytics/alerts?status=active&limit=5');
      setAlerts(alertsResponse.data?.data?.alerts || []);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading analytics...</div>;
  }

  if (!dashboard) {
    return <div className="flex items-center justify-center h-screen">No data available</div>;
  }

  const { current_metrics, gps_data, satellite_data, predictions, trends, historical_data } = dashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Farm Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time farm performance and insights</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<Zap className="w-8 h-8" />}
            title="Health Score"
            value={current_metrics.health_score}
            unit="/100"
            trend={trends.health_score}
            color="bg-green-500"
          />
          <MetricCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Productivity Index"
            value={current_metrics.productivity_index}
            unit="%"
            trend={trends.productivity}
            color="bg-blue-500"
          />
          <MetricCard
            icon={<DollarSign className="w-8 h-8" />}
            title="ROI"
            value={current_metrics.roi}
            unit="%"
            trend={trends.roi}
            color="bg-purple-500"
          />
          <MetricCard
            icon={<AlertTriangle className="w-8 h-8" />}
            title="Risk Level"
            value={predictions.risk_level}
            unit=""
            trend={0}
            color="bg-orange-500"
          />
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Active Alerts</h3>
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <div key={alert._id} className="text-sm text-red-800">
                      <span className="font-medium">{alert.type}:</span> {alert.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Health Score Trend */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Score Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historical_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="metrics.health_score" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Productivity Index */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Productivity Index</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={historical_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="metrics.productivity_index" 
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ROI Analysis */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ROI Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historical_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="metrics.roi" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Metrics Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Health', value: current_metrics.health_score },
                    { name: 'Productivity', value: Math.min(current_metrics.productivity_index, 100) },
                    { name: 'Other', value: 100 - current_metrics.health_score - Math.min(current_metrics.productivity_index, 100) }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f3f4f6" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GPS Map Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <MapPin className="w-6 h-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Farm Location & Satellite Data</h2>
          </div>
          
          {gps_data.coordinates && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map placeholder */}
              <div className="lg:col-span-2 h-96 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-3">
                <MapPin className="w-12 h-12 text-green-400" />
                <div className="text-center">
                  <p className="font-semibold text-gray-700">Farm Map</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Lat: {gps_data.coordinates[1].toFixed(5)}, Lng: {gps_data.coordinates[0].toFixed(5)}
                  </p>
                  {gps_data.area_sqm && <p className="text-xs text-gray-400 mt-1">Area: {gps_data.area_sqm} m² · {gps_data.soil_type} soil · {gps_data.elevation}m elevation</p>}
                </div>
                <p className="text-xs text-gray-400">Interactive map coming soon</p>
              </div>

              {/* Satellite Data */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">NDVI (Vegetation Index)</p>
                  <p className="text-3xl font-bold text-green-600">{satellite_data.ndvi.toFixed(2)}</p>
                  <div className="mt-2 bg-white rounded h-2">
                    <div 
                      className="bg-green-500 h-2 rounded"
                      style={{ width: `${(satellite_data.ndvi / 1) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">EVI (Enhanced Vegetation)</p>
                  <p className="text-3xl font-bold text-blue-600">{satellite_data.evi.toFixed(2)}</p>
                  <div className="mt-2 bg-white rounded h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded"
                      style={{ width: `${(satellite_data.evi / 1) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Cloud Cover</p>
                  <p className="text-3xl font-bold text-orange-600">{satellite_data.cloud_cover.toFixed(1)}%</p>
                  <div className="mt-2 bg-white rounded h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded"
                      style={{ width: `${satellite_data.cloud_cover}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    api.post(`/api/analytics/farm/${farmId}/satellite/update`);
                  }}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Update Satellite Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Farm Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetailCard
            title="Total Area"
            value={current_metrics.total_area}
            unit="hectares"
          />
          <DetailCard
            title="Planted Area"
            value={current_metrics.planted_area}
            unit="hectares"
          />
          <DetailCard
            title="Yield Estimate"
            value={current_metrics.yield_estimate}
            unit="kg"
          />
          <DetailCard
            title="Revenue Estimate"
            value={current_metrics.revenue_estimate}
            unit="TZS"
          />
          <DetailCard
            title="Total Expenses"
            value={current_metrics.expenses}
            unit="TZS"
          />
          <DetailCard
            title="Net Profit"
            value={current_metrics.revenue_estimate - current_metrics.expenses}
            unit="TZS"
          />
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, title, value, unit, trend, color }) => (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toFixed(1) : value}
          <span className="text-lg text-gray-500 ml-1">{unit}</span>
        </p>
        {trend !== 0 && (
          <p className={`text-sm mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% vs last period
          </p>
        )}
      </div>
      <div className={`${color} text-white p-3 rounded-lg`}>
        {icon}
      </div>
    </div>
  </div>
);

const DetailCard = ({ title, value, unit }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <p className="text-gray-600 text-sm mb-2">{title}</p>
    <p className="text-2xl font-bold text-gray-900">
      {typeof value === 'number' ? value.toLocaleString() : value}
      <span className="text-sm text-gray-500 ml-1">{unit}</span>
    </p>
  </div>
);

export default AnalyticsDashboard;
