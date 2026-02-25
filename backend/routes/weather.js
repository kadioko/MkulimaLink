const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 1800 });

const TANZANIA_REGIONS = {
  'Dar es Salaam': { lat: -6.7924, lon: 39.2083 },
  'Arusha': { lat: -3.3869, lon: 36.6830 },
  'Dodoma': { lat: -6.1630, lon: 35.7516 },
  'Mwanza': { lat: -2.5164, lon: 32.9175 },
  'Mbeya': { lat: -8.9094, lon: 33.4606 },
  'Morogoro': { lat: -6.8211, lon: 37.6609 },
  'Tanga': { lat: -5.0689, lon: 39.0986 },
  'Moshi': { lat: -3.3397, lon: 37.3407 },
  'Iringa': { lat: -7.7667, lon: 35.6833 },
  'Kilimanjaro': { lat: -3.0674, lon: 37.3556 }
};

router.get('/', async (req, res) => {
  try {
    const { country } = req.query;
    const regions = country === 'KE' 
      ? ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'] 
      : Object.keys(TANZANIA_REGIONS);
    
    const weather = regions.map(region => {
      const condition = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)];
      let farmingTip = '';
      if (condition === 'Rainy') farmingTip = 'Ensure proper drainage in fields. Monitor for fungal diseases.';
      else if (condition === 'Sunny') farmingTip = 'Increase irrigation frequency. Apply mulch to retain moisture.';
      else farmingTip = 'Good conditions for field maintenance and crop monitoring.';

      return {
        location: region,
        temperature: 20 + Math.random() * 15,
        humidity: 50 + Math.random() * 40,
        rainfall: condition === 'Rainy' ? 10 + Math.random() * 40 : Math.random() * 5,
        windSpeed: 5 + Math.random() * 20,
        condition,
        farmingTip
      };
    });
    
    res.json({ weather });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/current/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const cacheKey = `weather_${region}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    const coordinates = TANZANIA_REGIONS[region];
    if (!coordinates) {
      return res.status(404).json({ message: 'Region not found' });
    }

    const weatherData = {
      region,
      temperature: 25 + Math.random() * 10,
      humidity: 60 + Math.random() * 30,
      rainfall: Math.random() * 50,
      windSpeed: 5 + Math.random() * 15,
      condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
      timestamp: new Date(),
      forecast: []
    };

    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      weatherData.forecast.push({
        date,
        temperature: 24 + Math.random() * 12,
        rainfall: Math.random() * 60,
        condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)]
      });
    }

    cache.set(cacheKey, weatherData);
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/forecast/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const { days = 7 } = req.query;

    const coordinates = TANZANIA_REGIONS[region];
    if (!coordinates) {
      return res.status(404).json({ message: 'Region not found' });
    }

    const forecast = [];
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date,
        temperature: {
          min: 20 + Math.random() * 5,
          max: 28 + Math.random() * 8
        },
        rainfall: Math.random() * 60,
        humidity: 60 + Math.random() * 30,
        windSpeed: 5 + Math.random() * 15,
        condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Thunderstorm'][Math.floor(Math.random() * 5)],
        uvIndex: Math.floor(Math.random() * 11)
      });
    }

    res.json({ region, forecast });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/alerts/:region', async (req, res) => {
  try {
    const { region } = req.params;

    const alerts = [];
    
    if (Math.random() > 0.7) {
      alerts.push({
        type: 'rainfall',
        severity: 'moderate',
        message: 'Heavy rainfall expected in the next 48 hours',
        recommendation: 'Ensure proper drainage in your farm. Delay planting if soil is waterlogged.'
      });
    }

    if (Math.random() > 0.8) {
      alerts.push({
        type: 'temperature',
        severity: 'high',
        message: 'High temperatures expected this week',
        recommendation: 'Increase irrigation frequency. Provide shade for sensitive crops.'
      });
    }

    if (Math.random() > 0.85) {
      alerts.push({
        type: 'drought',
        severity: 'moderate',
        message: 'Low rainfall predicted for the next 2 weeks',
        recommendation: 'Conserve water. Consider drought-resistant crop varieties.'
      });
    }

    res.json({ region, alerts, timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/regions', (req, res) => {
  res.json(Object.keys(TANZANIA_REGIONS));
});

module.exports = router;
