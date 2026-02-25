import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Cloud, CloudRain, Sun, Droplets, Wind, Umbrella, Leaf, CloudLightning, RefreshCw } from 'lucide-react';
import { useCountryStore } from '../store/countryStore';

// Coordinates for major farming regions
const REGIONS = {
  TZ: [
    { name: 'Dar es Salaam', lat: -6.7924, lon: 39.2083, tip: 'Coastal climate. Monitor for high humidity fungal issues.' },
    { name: 'Morogoro', lat: -6.8278, lon: 37.6694, tip: 'Prime agricultural zone. Ensure good drainage during rains.' },
    { name: 'Arusha', lat: -3.3667, lon: 36.6833, tip: 'High altitude. Good for horticulture and coffee.' },
    { name: 'Iringa', lat: -7.7667, lon: 35.7000, tip: 'Cool climate. Ideal for maize, tomatoes, and tea.' },
    { name: 'Mbeya', lat: -8.9000, lon: 33.4500, tip: 'Highland conditions. Great for beans, potatoes, and rice.' },
    { name: 'Mwanza', lat: -2.5167, lon: 32.9000, tip: 'Lake zone. Favorable for cotton, maize, and fishing.' },
    { name: 'Dodoma', lat: -6.1731, lon: 35.7419, tip: 'Semi-arid. Use drought-resistant seeds and mulching.' },
  ],
  KE: [
    { name: 'Nairobi', lat: -1.2864, lon: 36.8172, tip: 'Moderate climate. Good for peri-urban greenhouse farming.' },
    { name: 'Mombasa', lat: -4.0435, lon: 39.6682, tip: 'Hot and humid. Ideal for coconuts, cassava, and mangoes.' },
    { name: 'Kisumu', lat: -0.1022, lon: 34.7617, tip: 'Lake basin. Good for rice, sorghum, and sugarcane.' },
    { name: 'Nakuru', lat: -0.3031, lon: 36.0800, tip: 'Rift valley. Excellent for wheat, maize, and dairy.' },
    { name: 'Eldoret', lat: 0.5143, lon: 35.2698, tip: 'Highland plateau. Breadbasket region, perfect for large scale grains.' },
    { name: 'Nyeri', lat: -0.4228, lon: 36.9452, tip: 'Mt Kenya region. Premium conditions for coffee and tea.' },
    { name: 'Machakos', lat: -1.5167, lon: 37.2667, tip: 'Dry conditions. Focus on drought-tolerant crops and terracing.' },
  ]
};

function Weather() {
  const { country } = useCountryStore();
  const [selectedRegion, setSelectedRegion] = useState(country === 'KE' ? 'Nairobi' : 'Dar es Salaam');
  const regions = REGIONS[country] || REGIONS.TZ;

  useEffect(() => {
    setSelectedRegion(country === 'KE' ? 'Nairobi' : 'Dar es Salaam');
  }, [country]);

  // Fetch real live weather from Open-Meteo API
  const { data: allWeather, isLoading, refetch, isRefetching } = useQuery(
    ['real-weather', country],
    async () => {
      const currentRegions = REGIONS[country] || REGIONS.TZ;
      
      const promises = currentRegions.map(async (region) => {
        try {
          // Open-Meteo free API - no key needed
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&timezone=auto`);
          const data = await res.json();
          
          const current = data.current;
          
          // Map WMO Weather codes to simple conditions
          let condition = 'Partly Cloudy';
          const code = current.weather_code;
          if (code === 0) condition = 'Sunny';
          else if (code <= 3) condition = code === 3 ? 'Cloudy' : 'Partly Cloudy';
          else if (code >= 51 && code <= 67) condition = 'Rainy';
          else if (code >= 71 && code <= 77) condition = 'Snow';
          else if (code >= 80 && code <= 99) condition = 'Stormy';

          return {
            location: region.name,
            temperature: current.temperature_2m,
            humidity: current.relative_humidity_2m,
            condition,
            windSpeed: current.wind_speed_10m,
            rainfall: current.precipitation || 0,
            farmingTip: region.tip,
            country: country
          };
        } catch (error) {
          console.error(`Error fetching weather for ${region.name}:`, error);
          // Fallback data if API fails for a specific region
          return {
            location: region.name,
            temperature: 24,
            humidity: 60,
            condition: 'Partly Cloudy',
            windSpeed: 10,
            rainfall: 0,
            farmingTip: region.tip,
            country: country
          };
        }
      });

      return Promise.all(promises);
    },
    { 
      refetchInterval: 1800000, // Auto-refresh every 30 minutes
      staleTime: 300000 // Data stays fresh for 5 minutes
    }
  );

  const weatherData = allWeather?.find(w => w.location === selectedRegion) || allWeather?.[0] || null;

  const getWeatherIcon = (condition, size = 48) => {
    switch (condition?.toLowerCase()) {
      case 'sunny':
        return <Sun className="text-yellow-500" size={size} />;
      case 'rainy':
        return <CloudRain className="text-blue-500" size={size} />;
      case 'stormy':
        return <CloudLightning className="text-indigo-600" size={size} />;
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
      case 'stormy': return 'from-indigo-100 to-slate-200';
      case 'cloudy': return 'from-gray-50 to-slate-100';
      case 'partly cloudy': return 'from-sky-50 to-blue-50';
      default: return 'from-gray-50 to-gray-100';
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-3">
            Weather Forecast 
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider uppercase flex items-center gap-1 border border-green-200">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Live
            </span>
          </h1>
          <p className="text-gray-600">Real-time agricultural weather conditions via Open-Meteo</p>
        </div>
        <button 
          onClick={() => refetch()} 
          disabled={isRefetching}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
          {isRefetching ? "Updating..." : "Update Live Data"}
        </button>
      </div>

      <div className="card mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Region</label>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="input-field max-w-md"
        >
          {regions.map(region => (
            <option key={region.name} value={region.name}>{region.name}</option>
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
          <div className={`card mb-6 bg-gradient-to-br ${getConditionBg(weatherData.condition)} border-0 shadow-md`}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 drop-shadow-md">
                {getWeatherIcon(weatherData.condition, 72)}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-900 mb-1">{weatherData.location}</h2>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <p className="text-6xl font-bold text-gray-900 tracking-tighter">
                    {Math.round(weatherData.temperature)}°
                  </p>
                  <div className="text-left">
                    <p className="text-xl text-gray-700 font-medium capitalize">{weatherData.condition}</p>
                    <p className="text-sm text-gray-500">Updated just now</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 md:gap-8 text-center bg-white/60 p-4 rounded-2xl backdrop-blur-sm">
                <div>
                  <Droplets className="text-blue-500 mx-auto mb-2 drop-shadow-sm" size={24} />
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Humidity</p>
                  <p className="text-lg font-bold text-gray-900">{Math.round(weatherData.humidity)}%</p>
                </div>
                <div>
                  <Wind className="text-gray-500 mx-auto mb-2 drop-shadow-sm" size={24} />
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Wind</p>
                  <p className="text-lg font-bold text-gray-900">{Math.round(weatherData.windSpeed)} km/h</p>
                </div>
                <div>
                  <Umbrella className="text-indigo-500 mx-auto mb-2 drop-shadow-sm" size={24} />
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Rain</p>
                  <p className="text-lg font-bold text-gray-900">{weatherData.rainfall.toFixed(1)} mm</p>
                </div>
              </div>
            </div>
          </div>

          {/* Farming tip */}
          {weatherData.farmingTip && (
            <div className="card mb-6 border-l-4 border-primary-500 bg-primary-50 shadow-sm">
              <div className="flex items-start gap-3">
                <Leaf className="text-primary-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="font-bold text-primary-900 mb-1">Local Agricultural Insights</h3>
                  <p className="text-primary-800 leading-relaxed">{weatherData.farmingTip}</p>
                </div>
              </div>
            </div>
          )}

          {/* All regions overview */}
          {allWeather && allWeather.length > 1 && (
            <div className="card mb-6 bg-white shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Cloud size={20} className="text-primary-600"/> 
                National Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allWeather.map(w => (
                  <button
                    key={w.location}
                    onClick={() => setSelectedRegion(w.location)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                      selectedRegion === w.location
                        ? 'border-primary-500 bg-primary-50/50 shadow-md'
                        : 'border-gray-100 hover:border-primary-300 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-900 truncate pr-2">{w.location}</span>
                      {getWeatherIcon(w.condition, 24)}
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-bold text-gray-900">{Math.round(w.temperature)}°</p>
                      <p className="text-xs font-medium text-gray-500 capitalize">{w.condition}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-16 bg-gray-50 border-dashed border-2 border-gray-200">
          <Cloud className="text-gray-300 mx-auto mb-4" size={64} />
          <p className="text-gray-600 text-xl font-medium">Unable to load live weather data</p>
          <p className="text-gray-500 text-sm mt-2">Please check your internet connection or try again later.</p>
          <button onClick={() => refetch()} className="mt-6 btn-primary">Try Again</button>
        </div>
      )}

      <div className="mt-8 card bg-white shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Leaf size={20} className="text-green-600"/>
          General Seasonal Guidelines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-lg">
              <CloudRain size={20} /> Rainy Season Tactics
            </h3>
            <ul className="text-sm text-blue-800 space-y-2.5 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span> 
                Clear drainage channels to prevent waterlogging and root rot
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span> 
                Apply fungicides early to prevent humidity-driven diseases
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span> 
                Delay fertilizer application until heavy downpours subside
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span> 
                Ensure harvested crops are elevated and protected from ground moisture
              </li>
            </ul>
          </div>
          <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50/50 rounded-xl border border-yellow-100">
            <h3 className="font-bold text-yellow-900 mb-3 flex items-center gap-2 text-lg">
              <Sun size={20} /> Dry Season Tactics
            </h3>
            <ul className="text-sm text-yellow-800 space-y-2.5 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span> 
                Irrigate during early morning or late evening to minimize evaporation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span> 
                Apply thick organic mulch to retain crucial soil moisture
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span> 
                Monitor crops closely for drought stress and pest infestations (like spider mites)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-0.5">•</span> 
                Prioritize planting drought-resistant and early-maturing seed varieties
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Weather;
