const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MkulimaLink API is running',
    timestamp: new Date().toISOString()
  });
});

// Demo API endpoints
app.get('/api/products', (req, res) => {
  res.json({ 
    products: [
      { _id: '1', name: 'Organic Tomatoes', price: 2500, category: 'Vegetables' },
      { _id: '2', name: 'Maize', price: 1800, category: 'Grains' },
      { _id: '3', name: 'Bananas', price: 3000, category: 'Fruits' }
    ] 
  });
});

app.get('/api/market', (req, res) => {
  res.json({ 
    prices: [
      { product: 'Tomatoes', price: 2500, trend: 'up' },
      { product: 'Maize', price: 1800, trend: 'stable' },
      { product: 'Bananas', price: 3000, trend: 'down' }
    ] 
  });
});

app.get('/api/weather', (req, res) => {
  res.json({
    location: 'Dar es Salaam',
    temperature: 28,
    humidity: 75,
    condition: 'Partly Cloudy'
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/build');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
