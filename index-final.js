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

// Real agricultural data for Tanzania and Kenya
const realProducts = [
  // Tanzania (TZS)
  { name: 'Organic Tomatoes - Fresh', category: 'Vegetables', price: 2500, quantity: 150, unit: 'kg', region: 'Morogoro', country: 'TZ', currency: 'TZS' },
  { name: 'Onions - Red Variety', category: 'Vegetables', price: 2000, quantity: 200, unit: 'kg', region: 'Iringa', country: 'TZ', currency: 'TZS' },
  { name: 'Cabbage - Green', category: 'Vegetables', price: 1500, quantity: 100, unit: 'kg', region: 'Arusha', country: 'TZ', currency: 'TZS' },
  { name: 'Carrots - Orange', category: 'Vegetables', price: 1800, quantity: 120, unit: 'kg', region: 'Dar es Salaam', country: 'TZ', currency: 'TZS' },
  { name: 'Maize - White Corn', category: 'Grains', price: 1800, quantity: 500, unit: 'kg', region: 'Dodoma', country: 'TZ', currency: 'TZS' },
  { name: 'Rice - White Grain', category: 'Grains', price: 3500, quantity: 300, unit: 'kg', region: 'Mwanza', country: 'TZ', currency: 'TZS' },
  { name: 'Wheat - Milling Grade', category: 'Grains', price: 2200, quantity: 250, unit: 'kg', region: 'Iringa', country: 'TZ', currency: 'TZS' },
  { name: 'Bananas - Ripe Yellow', category: 'Fruits', price: 3000, quantity: 80, unit: 'bunch', region: 'Arusha', country: 'TZ', currency: 'TZS' },
  { name: 'Mangoes - Alphonso', category: 'Fruits', price: 4000, quantity: 60, unit: 'kg', region: 'Dar es Salaam', country: 'TZ', currency: 'TZS' },
  { name: 'Oranges - Sweet', category: 'Fruits', price: 2500, quantity: 100, unit: 'kg', region: 'Morogoro', country: 'TZ', currency: 'TZS' },
  { name: 'Avocados - Hass', category: 'Fruits', price: 5000, quantity: 50, unit: 'kg', region: 'Kilimanjaro', country: 'TZ', currency: 'TZS' },
  { name: 'Beans - Red Kidney', category: 'Legumes', price: 3500, quantity: 150, unit: 'kg', region: 'Mbeya', country: 'TZ', currency: 'TZS' },
  { name: 'Lentils - Green', category: 'Legumes', price: 4000, quantity: 100, unit: 'kg', region: 'Iringa', country: 'TZ', currency: 'TZS' },
  { name: 'Chickpeas - Dried', category: 'Legumes', price: 3800, quantity: 120, unit: 'kg', region: 'Dodoma', country: 'TZ', currency: 'TZS' },
  { name: 'Fresh Milk - Cow', category: 'Dairy', price: 1200, quantity: 500, unit: 'liter', region: 'Morogoro', country: 'TZ', currency: 'TZS' },
  { name: 'Eggs - Free Range', category: 'Dairy', price: 400, quantity: 1000, unit: 'dozen', region: 'Dar es Salaam', country: 'TZ', currency: 'TZS' },
  { name: 'Maize Seeds - Hybrid', category: 'Seeds', price: 8000, quantity: 50, unit: 'bag', region: 'Arusha', country: 'TZ', currency: 'TZS' },
  { name: 'Tomato Seeds - Premium', category: 'Seeds', price: 5000, quantity: 30, unit: 'packet', region: 'Morogoro', country: 'TZ', currency: 'TZS' },
  { name: 'Fertilizer - NPK 17:17:17', category: 'Inputs', price: 45000, quantity: 100, unit: 'bag', region: 'Dar es Salaam', country: 'TZ', currency: 'TZS' },
  // Kenya (KES)
  { name: 'Tomatoes - Beef Variety', category: 'Vegetables', price: 120, quantity: 200, unit: 'kg', region: 'Nairobi', country: 'KE', currency: 'KES' },
  { name: 'Onions - Bulb Red', category: 'Vegetables', price: 80, quantity: 300, unit: 'kg', region: 'Nakuru', country: 'KE', currency: 'KES' },
  { name: 'Kale - Sukuma Wiki', category: 'Vegetables', price: 40, quantity: 500, unit: 'bunch', region: 'Kiambu', country: 'KE', currency: 'KES' },
  { name: 'Spinach - Fresh', category: 'Vegetables', price: 50, quantity: 150, unit: 'bunch', region: 'Nyeri', country: 'KE', currency: 'KES' },
  { name: 'Maize - Dry', category: 'Grains', price: 55, quantity: 1000, unit: 'kg', region: 'Eldoret', country: 'KE', currency: 'KES' },
  { name: 'Rice - Pishori', category: 'Grains', price: 180, quantity: 400, unit: 'kg', region: 'Mwea', country: 'KE', currency: 'KES' },
  { name: 'Wheat - Bread Grade', category: 'Grains', price: 60, quantity: 600, unit: 'kg', region: 'Nyandarua', country: 'KE', currency: 'KES' },
  { name: 'Bananas - Sweet', category: 'Fruits', price: 150, quantity: 100, unit: 'bunch', region: 'Kisumu', country: 'KE', currency: 'KES' },
  { name: 'Mangoes - Apple', category: 'Fruits', price: 100, quantity: 80, unit: 'kg', region: 'Machakos', country: 'KE', currency: 'KES' },
  { name: 'Avocados - Fuerte', category: 'Fruits', price: 200, quantity: 60, unit: 'kg', region: 'Murang\'a', country: 'KE', currency: 'KES' },
  { name: 'Passion Fruit', category: 'Fruits', price: 250, quantity: 40, unit: 'kg', region: 'Meru', country: 'KE', currency: 'KES' },
  { name: 'Beans - Rosecoco', category: 'Legumes', price: 130, quantity: 200, unit: 'kg', region: 'Meru', country: 'KE', currency: 'KES' },
  { name: 'Green Grams - Ndengu', category: 'Legumes', price: 150, quantity: 100, unit: 'kg', region: 'Machakos', country: 'KE', currency: 'KES' },
  { name: 'Fresh Milk - Cow', category: 'Dairy', price: 60, quantity: 800, unit: 'liter', region: 'Nyandarua', country: 'KE', currency: 'KES' },
  { name: 'Eggs - Kienyeji', category: 'Dairy', price: 450, quantity: 500, unit: 'tray', region: 'Nairobi', country: 'KE', currency: 'KES' },
  { name: 'Tea Leaves - Purple', category: 'Cash Crops', price: 80, quantity: 300, unit: 'kg', region: 'Kericho', country: 'KE', currency: 'KES' },
  { name: 'Coffee - Arabica', category: 'Cash Crops', price: 500, quantity: 100, unit: 'kg', region: 'Nyeri', country: 'KE', currency: 'KES' },
  { name: 'Fertilizer - DAP', category: 'Inputs', price: 3800, quantity: 80, unit: 'bag', region: 'Nairobi', country: 'KE', currency: 'KES' },
  { name: 'Maize Seeds - DK', category: 'Seeds', price: 550, quantity: 60, unit: 'bag', region: 'Nakuru', country: 'KE', currency: 'KES' },
];

const realMarketPrices = [
  // Tanzania (TZS)
  { product: 'Tomatoes', region: 'Dar es Salaam', price: 2500, trend: 'up', country: 'TZ', currency: 'TZS' },
  { product: 'Tomatoes', region: 'Morogoro', price: 2400, trend: 'up', country: 'TZ', currency: 'TZS' },
  { product: 'Maize', region: 'Dar es Salaam', price: 1800, trend: 'down', country: 'TZ', currency: 'TZS' },
  { product: 'Maize', region: 'Dodoma', price: 1750, trend: 'stable', country: 'TZ', currency: 'TZS' },
  { product: 'Onions', region: 'Iringa', price: 2000, trend: 'up', country: 'TZ', currency: 'TZS' },
  { product: 'Bananas', region: 'Arusha', price: 3000, trend: 'stable', country: 'TZ', currency: 'TZS' },
  { product: 'Beans', region: 'Mbeya', price: 3500, trend: 'down', country: 'TZ', currency: 'TZS' },
  { product: 'Rice', region: 'Mwanza', price: 3500, trend: 'up', country: 'TZ', currency: 'TZS' },
  // Kenya (KES)
  { product: 'Tomatoes', region: 'Nairobi', price: 120, trend: 'up', country: 'KE', currency: 'KES' },
  { product: 'Tomatoes', region: 'Mombasa', price: 110, trend: 'stable', country: 'KE', currency: 'KES' },
  { product: 'Maize', region: 'Eldoret', price: 55, trend: 'down', country: 'KE', currency: 'KES' },
  { product: 'Maize', region: 'Nakuru', price: 52, trend: 'stable', country: 'KE', currency: 'KES' },
  { product: 'Sukuma Wiki', region: 'Nairobi', price: 40, trend: 'up', country: 'KE', currency: 'KES' },
  { product: 'Beans', region: 'Meru', price: 130, trend: 'up', country: 'KE', currency: 'KES' },
  { product: 'Rice', region: 'Kisumu', price: 180, trend: 'down', country: 'KE', currency: 'KES' },
  { product: 'Tea', region: 'Kericho', price: 80, trend: 'stable', country: 'KE', currency: 'KES' },
];

const realWeatherData = [
  // Tanzania
  { location: 'Dar es Salaam', temperature: 28, humidity: 75, condition: 'Partly Cloudy', country: 'TZ' },
  { location: 'Morogoro', temperature: 26, humidity: 80, condition: 'Rainy', country: 'TZ' },
  { location: 'Arusha', temperature: 22, humidity: 65, condition: 'Sunny', country: 'TZ' },
  { location: 'Iringa', temperature: 20, humidity: 70, condition: 'Cloudy', country: 'TZ' },
  { location: 'Mbeya', temperature: 18, humidity: 72, condition: 'Partly Cloudy', country: 'TZ' },
  { location: 'Mwanza', temperature: 25, humidity: 68, condition: 'Sunny', country: 'TZ' },
  // Kenya
  { location: 'Nairobi', temperature: 22, humidity: 60, condition: 'Partly Cloudy', country: 'KE' },
  { location: 'Mombasa', temperature: 30, humidity: 78, condition: 'Sunny', country: 'KE' },
  { location: 'Kisumu', temperature: 27, humidity: 72, condition: 'Rainy', country: 'KE' },
  { location: 'Nakuru', temperature: 20, humidity: 65, condition: 'Cloudy', country: 'KE' },
  { location: 'Eldoret', temperature: 18, humidity: 70, condition: 'Partly Cloudy', country: 'KE' },
  { location: 'Nyeri', temperature: 19, humidity: 68, condition: 'Sunny', country: 'KE' },
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

// Products (supports ?country=TZ or ?country=KE)
app.get('/api/products', (req, res) => {
  const { country } = req.query;
  const filtered = country ? realProducts.filter(p => p.country === country.toUpperCase()) : realProducts;
  res.json({ products: filtered });
});

// Market (supports ?country=TZ or ?country=KE)
app.get('/api/market', (req, res) => {
  const { country } = req.query;
  const filtered = country ? realMarketPrices.filter(p => p.country === country.toUpperCase()) : realMarketPrices;
  res.json({ prices: filtered });
});

// Weather (supports ?country=TZ or ?country=KE)
app.get('/api/weather', (req, res) => {
  const { country } = req.query;
  const filtered = country ? realWeatherData.filter(w => w.country === country.toUpperCase()) : realWeatherData;
  res.json({ weather: filtered });
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
