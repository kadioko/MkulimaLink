import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

function Market() {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: latestPrices, isLoading } = useQuery(
    ['market-prices', selectedCategory, selectedRegion],
    async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedRegion) params.append('region', selectedRegion);
      
      const response = await api.get(`/market/prices/latest?${params}`);
      return response.data;
    }
  );

  const { data: regions } = useQuery('regions', async () => {
    const response = await api.get('/market/regions');
    return response.data;
  });

  const { data: categories } = useQuery('categories', async () => {
    const response = await api.get('/market/categories');
    return response.data;
  });

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="text-green-600" size={20} />;
      case 'falling':
        return <TrendingDown className="text-red-600" size={20} />;
      default:
        return <Minus className="text-gray-600" size={20} />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'rising':
        return 'text-green-600';
      case 'falling':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Prices</h1>
      <p className="text-gray-600 mb-8">Real-time agricultural commodity prices across Tanzania</p>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="input-field"
            >
              <option value="">All Regions</option>
              {regions?.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories?.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-6 w-3/4 mb-2"></div>
              <div className="skeleton h-8 w-1/2 mb-2"></div>
              <div className="skeleton h-4 w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestPrices?.map((price, index) => (
            <div key={index} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{price.product}</h3>
                  <p className="text-sm text-gray-600">{price.market}, {price.region}</p>
                </div>
                {getTrendIcon(price.trend)}
              </div>

              <div className="mb-3">
                <p className="text-3xl font-bold text-primary-600">
                  TZS {price.price.average.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">per {price.unit}</p>
              </div>

              <div className="flex items-center justify-between text-sm mb-3">
                <div>
                  <p className="text-gray-600">Min</p>
                  <p className="font-semibold">TZS {price.price.min.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">Max</p>
                  <p className="font-semibold">TZS {price.price.max.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className={`badge ${
                  price.trend === 'rising' ? 'badge-success' :
                  price.trend === 'falling' ? 'badge-danger' : 'badge-info'
                }`}>
                  {price.trend}
                </span>
                <span className={`text-sm font-medium ${getTrendColor(price.trend)}`}>
                  {price.changePercentage > 0 ? '+' : ''}{price.changePercentage.toFixed(1)}%
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Updated: {new Date(price.date).toLocaleDateString()}
              </p>
            </div>
          ))}

          {(!latestPrices || latestPrices.length === 0) && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No market data available</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">About Market Prices</h2>
        <p className="text-gray-700 mb-4">
          Our market prices are updated daily from major agricultural markets across Tanzania including
          Kariakoo (Dar es Salaam), Arusha Central Market, and Mwanza Market. Prices reflect wholesale
          rates and may vary based on quality, season, and local demand.
        </p>
        <p className="text-gray-700">
          Use this data to make informed decisions about when to sell your produce and set competitive prices.
          Premium members get access to AI-powered price predictions and trend analysis.
        </p>
      </div>
    </div>
  );
}

export default Market;
