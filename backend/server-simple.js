const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', 
  credentials: true 
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mkulimalink')
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Basic routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MkulimaLink API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes placeholder
app.get('/api/products', async (req, res) => {
  try {
    // Return demo products for now
    const demoProducts = [
      { _id: '1', name: 'Organic Tomatoes', price: 2500, category: 'Vegetables' },
      { _id: '2', name: 'Maize', price: 1800, category: 'Grains' },
      { _id: '3', name: 'Bananas', price: 3000, category: 'Fruits' }
    ];
    res.json({ products: demoProducts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/market', async (req, res) => {
  try {
    // Return demo market prices
    const demoPrices = [
      { product: 'Tomatoes', price: 2500, trend: 'up' },
      { product: 'Maize', price: 1800, trend: 'stable' },
      { product: 'Bananas', price: 3000, trend: 'down' }
    ];
    res.json({ prices: demoPrices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/weather', async (req, res) => {
  try {
    // Return demo weather data
    const demoWeather = {
      location: 'Dar es Salaam',
      temperature: 28,
      humidity: 75,
      condition: 'Partly Cloudy'
    };
    res.json(demoWeather);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
