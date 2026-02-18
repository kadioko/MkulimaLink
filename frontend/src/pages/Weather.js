import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Cloud, CloudRain, Sun, Droplets, Wind, Umbrella, Leaf } from 'lucide-react';
import api from '../api/axios';
import { useCountryStore } from '../store/countryStore';

function Weather() {
  const { country } = useCountryStore();
  const [selectedRegion, setSelectedRegion] = useState(country === 'KE' ? 'Nairobi' : 'Dar es Salaam');

  useEffect(() => {
    setSelectedRegion(country === 'KE' ? 'Nairobi' : 'Dar es Salaam');
  }, [country]);

  const { data: allWeather, isLoading } = useQuery(
    ['weather', country],
    async () => {
      const response = await api.get(`/api/weather?country=${country}`);
      return response.data.weather || [];
    },
    { retry: 2 }
  );

  const weatherData = allWeather?.find(w => w.location === selectedRegion) || allWeather?.[0] || null;
  const regions = allWeather?.map(w => w.location) || [];

  const getWeatherIcon = (condition, size = 48) => {
    switch (condition?.toLowerCase()) {
      case 'sunny':
        return <Sun className="text-yellow-500" size={size} />;
      case 'rainy':
        return <CloudRain className="text-blue-500" size={size} />;
      case 'cloudy':
        return <Cloud className="text-gray-500" size={size} />;
      case 'partly cloudy':
        return <Cloud className="text-blue-300" size={size} />;
      default:
        return <Cloud className="text-gray-400" size={size} />;
    }
  };

  const getConditionBg = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'sunny': return 'from-yellow-50 to-orange-50';
      case 'rainy': return 'from-blue-50 to-indigo-50';
      case 'cloudy': return 'from-gray-50 to-slate-50';
      case 'partly cloudy': return 'from-sky-50 to-blue-50';
      default: return 'from-gray-50 to-gray-100';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Weather Forecast</h1>
      <p className="text-gray-600 mb-6">Agricultural weather conditions for your farming region</p>

      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Region</label>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="input-field max-w-md"
        >
          {regions.length === 0 && (
            <option value="">Loading regions...</option>
          )}
          {regions.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="card">
          <div className="skeleton h-32 mb-4"></div>
          <div className="skeleton h-6 w-1/2"></div>
        </div>
      ) : weatherData ? (
        <>
          {/* Main weather card */}
          <div className={`card mb-6 bg-gradient-to-br ${getConditionBg(weatherData.condition)}`}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                {getWeatherIcon(weatherData.condition)}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{weatherData.location}</h2>
                <p className="text-5xl font-bold text-gray-900 mb-2">
                  {Math.round(weatherData.temperature)}°C
                </p>
                <p className="text-xl text-gray-600 capitalize">{weatherData.condition}</p>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <Droplets className="text-blue-500 mx-auto mb-1" size={28} />
                  <p className="text-xs text-gray-500">Humidity</p>
                  <p className="text-lg font-bold text-gray-900">{weatherData.humidity}%</p>
                </div>
                <div>
                  <Wind className="text-gray-500 mx-auto mb-1" size={28} />
                  <p className="text-xs text-gray-500">Wind</p>
                  <p className="text-lg font-bold text-gray-900">{weatherData.windSpeed ?? '—'} km/h</p>
                </div>
                <div>
                  <Umbrella className="text-indigo-500 mx-auto mb-1" size={28} />
                  <p className="text-xs text-gray-500">Rainfall</p>
                  <p className="text-lg font-bold text-gray-900">{weatherData.rainfall ?? 0} mm</p>
                </div>
              </div>
            </div>
          </div>

          {/* Farming tip */}
          {weatherData.farmingTip && (
            <div className="card mb-6 border-l-4 border-primary-500 bg-primary-50">
              <div className="flex items-start gap-3">
                <Leaf className="text-primary-600 flex-shrink-0 mt-0.5" size={22} />
                <div>
                  <h3 className="font-semibold text-primary-900 mb-1">Today's Farming Tip</h3>
                  <p className="text-primary-800">{weatherData.farmingTip}</p>
                </div>
              </div>
            </div>
          )}

          {/* All regions overview */}
          {allWeather && allWeather.length > 1 && (
            <div className="card mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">All Regions Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {allWeather.map(w => (
                  <button
                    key={w.location}
                    onClick={() => setSelectedRegion(w.location)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedRegion === w.location
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getWeatherIcon(w.condition, 18)}
                      <span className="text-sm font-medium text-gray-900 truncate">{w.location}</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{w.temperature}°C</p>
                    <p className="text-xs text-gray-500 capitalize">{w.condition}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-12">
          <Cloud className="text-gray-300 mx-auto mb-4" size={48} />
          <p className="text-gray-500 text-lg">No weather data available</p>
          <p className="text-gray-400 text-sm mt-1">Try switching country or refreshing the page</p>
        </div>
      )}

      <div className="mt-4 card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Seasonal Farming Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">🌧️ Rainy Season</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ensure proper drainage in fields</li>
              <li>• Monitor for fungal diseases</li>
              <li>• Reduce irrigation frequency</li>
              <li>• Protect harvested crops from moisture</li>
            </ul>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">☀️ Dry Season</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Increase irrigation frequency</li>
              <li>• Apply mulch to retain moisture</li>
              <li>• Monitor crops for drought stress</li>
              <li>• Consider drought-resistant varieties</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Weather;
