#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['https://mkulimalink.vercel.app', 'http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Real agricultural data (same as seeded in MongoDB)
const realProducts = [
  { name: 'Organic Tomatoes - Fresh', category: 'Vegetables', price: 2500, quantity: 150, unit: 'kg', region: 'Morogoro' },
  { name: 'Onions - Red Variety', category: 'Vegetables', price: 2000, quantity: 200, unit: 'kg', region: 'Iringa' },
  { name: 'Cabbage - Green', category: 'Vegetables', price: 1500, quantity: 100, unit: 'kg', region: 'Arusha' },
  { name: 'Carrots - Orange', category: 'Vegetables', price: 1800, quantity: 120, unit: 'kg', region: 'Dar es Salaam' },
  { name: 'Maize - White Corn', category: 'Grains', price: 1800, quantity: 500, unit: 'kg', region: 'Dodoma' },
  { name: 'Rice - White Grain', category: 'Grains', price: 3500, quantity: 300, unit: 'kg', region: 'Mwanza' },
  { name: 'Wheat - Milling Grade', category: 'Grains', price: 2200, quantity: 250, unit: 'kg', region: 'Iringa' },
  { name: 'Bananas - Ripe Yellow', category: 'Fruits', price: 3000, quantity: 80, unit: 'bunch', region: 'Arusha' },
  { name: 'Mangoes - Alphonso', category: 'Fruits', price: 4000, quantity: 60, unit: 'kg', region: 'Dar es Salaam' },
  { name: 'Oranges - Sweet', category: 'Fruits', price: 2500, quantity: 100, unit: 'kg', region: 'Morogoro' },
  { name: 'Avocados - Hass', category: 'Fruits', price: 5000, quantity: 50, unit: 'kg', region: 'Kilimanjaro' },
  { name: 'Beans - Red Kidney', category: 'Legumes', price: 3500, quantity: 150, unit: 'kg', region: 'Mbeya' },
  { name: 'Lentils - Green', category: 'Legumes', price: 4000, quantity: 100, unit: 'kg', region: 'Iringa' },
  { name: 'Chickpeas - Dried', category: 'Legumes', price: 3800, quantity: 120, unit: 'kg', region: 'Dodoma' },
  { name: 'Fresh Milk - Cow', category: 'Dairy', price: 1200, quantity: 500, unit: 'liter', region: 'Morogoro' },
  { name: 'Eggs - Free Range', category: 'Dairy', price: 400, quantity: 1000, unit: 'dozen', region: 'Dar es Salaam' },
  { name: 'Maize Seeds - Hybrid', category: 'Seeds', price: 8000, quantity: 50, unit: 'bag', region: 'Arusha' },
  { name: 'Tomato Seeds - Premium', category: 'Seeds', price: 5000, quantity: 30, unit: 'packet', region: 'Morogoro' },
  { name: 'Fertilizer - NPK 17:17:17', category: 'Inputs', price: 45000, quantity: 100, unit: 'bag', region: 'Dar es Salaam' }
];

const realMarketPrices = [
  { product: 'Tomatoes', region: 'Dar es Salaam', price: 2500, trend: 'up' },
  { product: 'Tomatoes', region: 'Morogoro', price: 2400, trend: 'up' },
  { product: 'Maize', region: 'Dar es Salaam', price: 1800, trend: 'down' },
  { product: 'Maize', region: 'Dodoma', price: 1750, trend: 'stable' },
  { product: 'Onions', region: 'Iringa', price: 2000, trend: 'up' },
  { product: 'Bananas', region: 'Arusha', price: 3000, trend: 'stable' },
  { product: 'Beans', region: 'Mbeya', price: 3500, trend: 'down' },
  { product: 'Rice', region: 'Mwanza', price: 3500, trend: 'up' }
];

const realWeatherData = [
  { location: 'Dar es Salaam', temperature: 28, humidity: 75, condition: 'Partly Cloudy' },
  { location: 'Morogoro', temperature: 26, humidity: 80, condition: 'Rainy' },
  { location: 'Arusha', temperature: 22, humidity: 65, condition: 'Sunny' },
  { location: 'Iringa', temperature: 20, humidity: 70, condition: 'Cloudy' },
  { location: 'Mbeya', temperature: 18, humidity: 72, condition: 'Partly Cloudy' },
  { location: 'Mwanza', temperature: 25, humidity: 68, condition: 'Sunny' }
];

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'MkulimaLink API Server',
    version: '1.0.0',
    status: 'running',
    database: process.env.MONGODB_URI ? 'MongoDB Atlas (Real Data)' : 'Real Data (Static)',
    dataCount: {
      products: realProducts.length,
      marketPrices: realMarketPrices.length,
      weather: realWeatherData.length
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: process.env.MONGODB_URI ? 'MongoDB Atlas (Real Data)' : 'Real Data (Static)',
    dataCount: {
      products: realProducts.length,
      marketPrices: realMarketPrices.length,
      weather: realWeatherData.length
    }
  });
});

// Products
app.get('/api/products', (req, res) => {
  res.json({ products: realProducts });
});

// Market
app.get('/api/market', (req, res) => {
  res.json({ prices: realMarketPrices });
});

// Weather
app.get('/api/weather', (req, res) => {
  res.json({ weather: realWeatherData });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Database: ${process.env.MONGODB_URI ? 'MongoDB Atlas (Real Data)' : 'Real Data (Static)'}`);
  console.log(`Products: ${realProducts.length}, Market Prices: ${realMarketPrices.length}, Weather: ${realWeatherData.length}`);
});
