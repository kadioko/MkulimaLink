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
  // Tanzania (TZS) - per kg unless noted
  { product: 'Tomatoes', region: 'Dar es Salaam', price: 2500, unit: 'kg', trend: 'up', country: 'TZ', currency: 'TZS' },
  { product: 'Tomatoes', region: 'Morogoro', price: 2400, unit: 'kg', trend: 'up', country: 'TZ', currency: 'TZS' },
  { product: 'Tomatoes', region: 'Arusha', price: 2200, unit: 'kg', trend: 'stable', country: 'TZ', currency: 'TZS' },
  { product: 'Maize', region: 'Dar es Salaam', price: 1800, unit: 'kg', trend: 'down', country: 'TZ', currency: 'TZS' },
  { product: 'Maize', region: 'Dodoma', price: 1750, unit: 'kg', trend: 'stable', country: 'TZ', currency: 'TZS' },
  { product: 'Maize', region: 'Mbeya', price: 1700, unit: 'kg', trend: 'down', country: 'TZ', currency: 'TZS' },
  { product: 'Onions', region: 'Iringa', price: 2000, unit: 'kg', trend: 'up', country: 'TZ', currency: 'TZS' },
  { product: 'Onions', region: 'Dar es Salaam', price: 2200, unit: 'kg', trend: 'up', country: 'TZ', currency: 'TZS' },
  { product: 'Bananas', region: 'Arusha', price: 3000, unit: 'bunch', trend: 'stable', country: 'TZ', currency: 'TZS' },
  { product: 'Bananas', region: 'Kilimanjaro', price: 2800, unit: 'bunch', trend: 'stable', country: 'TZ', currency: 'TZS' },
  { product: 'Beans', region: 'Mbeya', price: 3500, unit: 'kg', trend: 'down', country: 'TZ', currency: 'TZS' },
  { product: 'Beans', region: 'Iringa', price: 3600, unit: 'kg', trend: 'stable', country: 'TZ', currency: 'TZS' },
  { product: 'Rice', region: 'Mwanza', price: 3500, unit: 'kg', trend: 'up', country: 'TZ', currency: 'TZS' },
  { product: 'Rice', region: 'Dar es Salaam', price: 3800, unit: 'kg', trend: 'up', country: 'TZ', currency: 'TZS' },
  { product: 'Cabbage', region: 'Arusha', price: 1500, unit: 'kg', trend: 'stable', country: 'TZ', currency: 'TZS' },
  { product: 'Carrots', region: 'Morogoro', price: 1800, unit: 'kg', trend: 'up', country: 'TZ', currency: 'TZS' },
  { product: 'Avocados', region: 'Kilimanjaro', price: 5000, unit: 'kg', trend: 'up', country: 'TZ', currency: 'TZS' },
  { product: 'Milk', region: 'Morogoro', price: 1200, unit: 'liter', trend: 'stable', country: 'TZ', currency: 'TZS' },
  { product: 'Eggs', region: 'Dar es Salaam', price: 400, unit: 'dozen', trend: 'up', country: 'TZ', currency: 'TZS' },
  { product: 'Wheat', region: 'Iringa', price: 2200, unit: 'kg', trend: 'stable', country: 'TZ', currency: 'TZS' },
  // Kenya (KES) - per kg unless noted
  { product: 'Tomatoes', region: 'Nairobi', price: 120, unit: 'kg', trend: 'up', country: 'KE', currency: 'KES' },
  { product: 'Tomatoes', region: 'Mombasa', price: 110, unit: 'kg', trend: 'stable', country: 'KE', currency: 'KES' },
  { product: 'Tomatoes', region: 'Nakuru', price: 100, unit: 'kg', trend: 'up', country: 'KE', currency: 'KES' },
  { product: 'Maize', region: 'Eldoret', price: 55, unit: 'kg', trend: 'down', country: 'KE', currency: 'KES' },
  { product: 'Maize', region: 'Nakuru', price: 52, unit: 'kg', trend: 'stable', country: 'KE', currency: 'KES' },
  { product: 'Maize', region: 'Nairobi', price: 65, unit: 'kg', trend: 'down', country: 'KE', currency: 'KES' },
  { product: 'Sukuma Wiki', region: 'Nairobi', price: 40, unit: 'bunch', trend: 'up', country: 'KE', currency: 'KES' },
  { product: 'Sukuma Wiki', region: 'Kisumu', price: 35, unit: 'bunch', trend: 'stable', country: 'KE', currency: 'KES' },
  { product: 'Beans', region: 'Meru', price: 130, unit: 'kg', trend: 'up', country: 'KE', currency: 'KES' },
  { product: 'Beans', region: 'Nairobi', price: 145, unit: 'kg', trend: 'up', country: 'KE', currency: 'KES' },
  { product: 'Rice', region: 'Kisumu', price: 180, unit: 'kg', trend: 'down', country: 'KE', currency: 'KES' },
  { product: 'Rice', region: 'Nairobi', price: 200, unit: 'kg', trend: 'stable', country: 'KE', currency: 'KES' },
  { product: 'Tea', region: 'Kericho', price: 80, unit: 'kg', trend: 'stable', country: 'KE', currency: 'KES' },
  { product: 'Tea', region: 'Nyeri', price: 85, unit: 'kg', trend: 'up', country: 'KE', currency: 'KES' },
  { product: 'Coffee', region: 'Nyeri', price: 500, unit: 'kg', trend: 'up', country: 'KE', currency: 'KES' },
  { product: 'Avocados', region: 'Murang\'a', price: 200, unit: 'kg', trend: 'up', country: 'KE', currency: 'KES' },
  { product: 'Milk', region: 'Nyandarua', price: 60, unit: 'liter', trend: 'stable', country: 'KE', currency: 'KES' },
  { product: 'Eggs', region: 'Nairobi', price: 450, unit: 'tray', trend: 'up', country: 'KE', currency: 'KES' },
  { product: 'Onions', region: 'Nakuru', price: 80, unit: 'kg', trend: 'up', country: 'KE', currency: 'KES' },
  { product: 'Passion Fruit', region: 'Meru', price: 250, unit: 'kg', trend: 'up', country: 'KE', currency: 'KES' },
];

const realWeatherData = [
  // Tanzania
  { location: 'Dar es Salaam', temperature: 28, humidity: 75, condition: 'Partly Cloudy', windSpeed: 15, rainfall: 2, farmingTip: 'Good conditions for harvesting. Light winds ideal for drying grains.', country: 'TZ' },
  { location: 'Morogoro', temperature: 26, humidity: 80, condition: 'Rainy', windSpeed: 10, rainfall: 18, farmingTip: 'Heavy rain expected. Ensure drainage channels are clear. Delay fertilizer application.', country: 'TZ' },
  { location: 'Arusha', temperature: 22, humidity: 65, condition: 'Sunny', windSpeed: 12, rainfall: 0, farmingTip: 'Excellent conditions for planting. Irrigate in the evening to reduce evaporation.', country: 'TZ' },
  { location: 'Iringa', temperature: 20, humidity: 70, condition: 'Cloudy', windSpeed: 8, rainfall: 5, farmingTip: 'Mild conditions. Good time for transplanting seedlings.', country: 'TZ' },
  { location: 'Mbeya', temperature: 18, humidity: 72, condition: 'Partly Cloudy', windSpeed: 11, rainfall: 3, farmingTip: 'Cool temperatures favor maize and beans. Monitor for fungal diseases.', country: 'TZ' },
  { location: 'Mwanza', temperature: 25, humidity: 68, condition: 'Sunny', windSpeed: 14, rainfall: 0, farmingTip: 'Dry and warm. Increase irrigation for vegetables. Good for fish drying.', country: 'TZ' },
  { location: 'Dodoma', temperature: 24, humidity: 55, condition: 'Sunny', windSpeed: 18, rainfall: 0, farmingTip: 'Hot and dry. Mulch crops to retain soil moisture. Avoid midday planting.', country: 'TZ' },
  { location: 'Kilimanjaro', temperature: 17, humidity: 78, condition: 'Cloudy', windSpeed: 9, rainfall: 8, farmingTip: 'Cool and moist. Ideal for coffee and banana cultivation.', country: 'TZ' },
  { location: 'Tanga', temperature: 27, humidity: 82, condition: 'Rainy', windSpeed: 13, rainfall: 12, farmingTip: 'Coastal rains. Protect stored produce from moisture. Good for coconut palms.', country: 'TZ' },
  { location: 'Moshi', temperature: 21, humidity: 74, condition: 'Partly Cloudy', windSpeed: 10, rainfall: 4, farmingTip: 'Moderate conditions. Good for coffee harvesting on the slopes.', country: 'TZ' },
  // Kenya
  { location: 'Nairobi', temperature: 22, humidity: 60, condition: 'Partly Cloudy', windSpeed: 16, rainfall: 1, farmingTip: 'Mild urban climate. Good for market gardening. Watch for afternoon showers.', country: 'KE' },
  { location: 'Mombasa', temperature: 30, humidity: 78, condition: 'Sunny', windSpeed: 20, rainfall: 0, farmingTip: 'Hot coastal conditions. Coconut and cashew thrive. Irrigate vegetables daily.', country: 'KE' },
  { location: 'Kisumu', temperature: 27, humidity: 72, condition: 'Rainy', windSpeed: 11, rainfall: 15, farmingTip: 'Lake region rains. Good for rice paddies. Drain waterlogged fields promptly.', country: 'KE' },
  { location: 'Nakuru', temperature: 20, humidity: 65, condition: 'Cloudy', windSpeed: 13, rainfall: 6, farmingTip: 'Rift Valley conditions. Ideal for pyrethrum and wheat. Monitor for frost at night.', country: 'KE' },
  { location: 'Eldoret', temperature: 18, humidity: 70, condition: 'Partly Cloudy', windSpeed: 15, rainfall: 4, farmingTip: 'Cool highland climate. Prime maize growing conditions. Good for dairy farming.', country: 'KE' },
  { location: 'Nyeri', temperature: 19, humidity: 68, condition: 'Sunny', windSpeed: 9, rainfall: 0, farmingTip: 'Mt. Kenya region. Excellent for tea and coffee. Ideal irrigation weather.', country: 'KE' },
  { location: 'Meru', temperature: 21, humidity: 66, condition: 'Partly Cloudy', windSpeed: 10, rainfall: 3, farmingTip: 'Good conditions for miraa and passion fruit. Moderate watering recommended.', country: 'KE' },
  { location: 'Kisii', temperature: 20, humidity: 75, condition: 'Rainy', windSpeed: 8, rainfall: 10, farmingTip: 'High rainfall area. Tea and banana thrive. Ensure good drainage on hillside farms.', country: 'KE' },
  { location: 'Machakos', temperature: 25, humidity: 58, condition: 'Sunny', windSpeed: 17, rainfall: 0, farmingTip: 'Semi-arid conditions. Drought-resistant crops recommended. Harvest rainwater.', country: 'KE' },
  { location: 'Kericho', temperature: 18, humidity: 80, condition: 'Cloudy', windSpeed: 7, rainfall: 7, farmingTip: 'Tea country. Misty conditions perfect for tea bushes. Watch for tea blister blight.', country: 'KE' },
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
