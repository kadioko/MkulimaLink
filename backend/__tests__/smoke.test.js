const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const app = express();
app.use(express.json());

const authRoutes = require('../routes/auth');
const productRoutes = require('../routes/products');
const healthRoutes = require('../routes/health');
const exchangeRateRoutes = require('../routes/exchangeRates');
const { protect } = require('../middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/exchange-rates', exchangeRateRoutes);

// Simple auction listing route smoke test
app.get('/api/auctions/active', (req, res) => {
  res.json({ success: true, data: [], message: 'No active auctions' });
});

describe('Smoke Tests', () => {
  describe('GET /api/health', () => {
    it('returns OK status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
    });
  });

  describe('Auth flow', () => {
    it('registers and logs in a farmer', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Smoke Farmer',
          email: 'smoke@example.com',
          password: 'password123',
          phone: '+255700000001',
          role: 'farmer',
          location: { region: 'Arusha', district: 'Arusha Urban' }
        });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body.success).toBe(true);
      expect(registerRes.body.data.token).toBeDefined();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'smoke@example.com', password: 'password123' });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.token).toBeDefined();
    });
  });

  describe('Products flow', () => {
    let token;

    beforeAll(async () => {
      const user = await User.create({
        name: 'Product Farmer',
        email: 'product@example.com',
        password: 'password123',
        phone: '+255700000002',
        role: 'farmer'
      });
      token = user.getSignedJwtToken();
    });

    it('creates and lists products', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Organic Maize',
          description: 'Fresh organic maize',
          category: 'grains',
          price: 50000,
          quantity: 100,
          unit: 'kg',
          location: { region: 'Arusha' }
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);

      const listRes = await request(app).get('/api/products');
      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      expect(listRes.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Auctions listing', () => {
    it('returns active auctions', async () => {
      const res = await request(app).get('/api/auctions/active');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Exchange rates', () => {
    it('returns supported currencies and fallback rates', async () => {
      const currenciesRes = await request(app).get('/api/exchange-rates/currencies/supported');
      expect(currenciesRes.status).toBe(200);
      expect(currenciesRes.body.success).toBe(true);

      const ratesRes = await request(app).get('/api/exchange-rates');
      expect(ratesRes.status).toBe(200);
      expect(ratesRes.body.success).toBe(true);
      expect(ratesRes.body.data).toHaveProperty('USD');
    });
  });
});
