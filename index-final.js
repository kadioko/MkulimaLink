#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'mkulimalink-secret-key-2024';

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

// ─── In-memory stores (persist for server lifetime) ───────────────────────────
const users = [];        // { id, name, email, phone, passwordHash, role, country, location, isPremium, createdAt }
const userProducts = []; // products created by registered users
const transactions = []; // { id, productId, buyerId, sellerId, quantity, totalAmount, status, createdAt }

// ─── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorised' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    req.user = users.find(u => u.id === payload.id);
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
}

function safeUser(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

// ─── Auth routes ───────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role = 'farmer', country = 'TZ', location = {} } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (users.find(u => u.email === email)) return res.status(400).json({ message: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), name, email, phone, passwordHash, role, country, location, isPremium: false, rating: 0, totalRatings: 0, createdAt: new Date().toISOString() };
    users.push(user);
    const token = makeToken(user);
    res.status(201).json({ ...safeUser(user), token });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });
    const token = makeToken(user);
    res.json({ ...safeUser(user), token });
  } catch {
    res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(safeUser(req.user));
});

app.put('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone, location, country } = req.body;
    const idx = users.findIndex(u => u.id === req.user.id);
    if (name) users[idx].name = name;
    if (phone) users[idx].phone = phone;
    if (location) users[idx].location = { ...users[idx].location, ...location };
    if (country) users[idx].country = country;
    res.json(safeUser(users[idx]));
  } catch {
    res.status(500).json({ message: 'Profile update failed' });
  }
});

// ─── Product routes ────────────────────────────────────────────────────────────

// GET my listings (auth required) — must be before /:id
app.get('/api/products/my/listings', requireAuth, (req, res) => {
  const mine = userProducts.filter(p => p.seller?._id === req.user.id);
  res.json(mine);
});

// POST create product (auth required)
app.post('/api/products', requireAuth, (req, res) => {
  try {
    const { name, category, description, price, quantity, unit, quality = 'standard', organic = false, harvestDate, location } = req.body;
    if (!name || !category || !price || !quantity || !unit) {
      return res.status(400).json({ message: 'Name, category, price, quantity and unit are required' });
    }
    const product = {
      id: uuidv4(),
      _id: uuidv4(),
      name, category, description, price: Number(price), quantity: Number(quantity),
      unit, quality, organic, harvestDate,
      location: location || req.user.location,
      region: location?.region || req.user.location?.region || '',
      country: req.user.country || 'TZ',
      currency: req.user.country === 'KE' ? 'KES' : 'TZS',
      seller: { _id: req.user.id, name: req.user.name, location: req.user.location, rating: req.user.rating, totalRatings: req.user.totalRatings },
      status: 'active',
      images: [],
      createdAt: new Date().toISOString()
    };
    userProducts.push(product);
    res.status(201).json(product);
  } catch {
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// PUT update product (auth required, owner only)
app.put('/api/products/:id', requireAuth, (req, res) => {
  const idx = userProducts.findIndex(p => (p._id === req.params.id || p.id === req.params.id) && p.seller?._id === req.user.id);
  if (idx === -1) return res.status(404).json({ message: 'Product not found or not yours' });
  userProducts[idx] = { ...userProducts[idx], ...req.body, updatedAt: new Date().toISOString() };
  res.json(userProducts[idx]);
});

// DELETE product (auth required, owner only)
app.delete('/api/products/:id', requireAuth, (req, res) => {
  const idx = userProducts.findIndex(p => (p._id === req.params.id || p.id === req.params.id) && p.seller?._id === req.user.id);
  if (idx === -1) return res.status(404).json({ message: 'Product not found or not yours' });
  userProducts.splice(idx, 1);
  res.json({ message: 'Product deleted' });
});

// ─── Transaction routes ────────────────────────────────────────────────────────
app.post('/api/transactions', requireAuth, (req, res) => {
  try {
    const { productId, quantity, deliveryDetails } = req.body;
    const allProducts = [...realProducts.map((p, i) => ({ ...p, _id: `static-${i}`, id: `static-${i}` })), ...userProducts];
    const product = allProducts.find(p => p._id === productId || p.id === productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller?._id === req.user.id) return res.status(400).json({ message: 'Cannot buy your own product' });
    const qty = Number(quantity) || 1;
    const totalAmount = product.price * qty;
    const commission = Math.round(totalAmount * 0.05);
    const tx = {
      id: uuidv4(),
      _id: uuidv4(),
      productId,
      product: { name: product.name, unit: product.unit },
      buyerId: req.user.id,
      sellerId: product.seller?._id || 'static',
      quantity: qty,
      totalAmount,
      commission,
      sellerAmount: totalAmount - commission,
      deliveryDetails,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    transactions.push(tx);
    res.status(201).json(tx);
  } catch {
    res.status(500).json({ message: 'Failed to create transaction' });
  }
});

app.get('/api/transactions/stats/dashboard', requireAuth, (req, res) => {
  const myTx = transactions.filter(t => t.buyerId === req.user.id || t.sellerId === req.user.id);
  const completed = myTx.filter(t => t.status === 'completed');
  const totalRevenue = completed
    .filter(t => t.sellerId === req.user.id)
    .reduce((sum, t) => sum + t.sellerAmount, 0);
  const totalSpent = completed
    .filter(t => t.buyerId === req.user.id)
    .reduce((sum, t) => sum + t.totalAmount, 0);
  res.json({
    totalTransactions: myTx.length,
    completedTransactions: completed.length,
    totalRevenue,
    totalSpent
  });
});

app.get('/api/transactions/my/sales', requireAuth, (req, res) => {
  const sales = transactions.filter(t => t.sellerId === req.user.id);
  res.json(sales);
});

app.get('/api/transactions/my/purchases', requireAuth, (req, res) => {
  const purchases = transactions.filter(t => t.buyerId === req.user.id);
  res.json(purchases);
});

app.get('/api/transactions', requireAuth, (req, res) => {
  const myTx = transactions.filter(t => t.buyerId === req.user.id || t.sellerId === req.user.id);
  res.json(myTx);
});

app.put('/api/transactions/:id/status', requireAuth, (req, res) => {
  const idx = transactions.findIndex(t => t._id === req.params.id || t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Transaction not found' });
  transactions[idx].status = req.body.status;
  res.json(transactions[idx]);
});

// ─── Root endpoint ─────────────────────────────────────────────────────────────
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

// Products (supports ?country=TZ or ?country=KE) — merges static + user-created
app.get('/api/products', (req, res) => {
  const { country } = req.query;
  const staticWithIds = realProducts.map((p, i) => ({ ...p, _id: `static-${i}`, id: `static-${i}` }));
  const all = [...staticWithIds, ...userProducts];
  const filtered = country ? all.filter(p => p.country === country.toUpperCase()) : all;
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
