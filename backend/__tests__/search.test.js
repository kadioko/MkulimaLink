const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');

const app = express();
app.use(express.json());

const searchRoutes = require('../routes/search');
app.use('/api/search', searchRoutes);

const createToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1d' });

describe('Search API', () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await User.create({
      name: 'Search User',
      email: 'search@test.com',
      password: 'password123',
      phone: '+255712345600',
      role: 'buyer',
      location: { region: 'Dar es Salaam', district: 'Ilala' }
    });
    token = createToken(user._id);

    await Product.create([
      {
        name: 'Tomatoes Fresh',
        description: 'Fresh tomatoes from Arusha farm',
        category: 'vegetables',
        price: 2000,
        quantity: 50,
        unit: 'kg',
        location: { region: 'Arusha', district: 'Arusha Urban' },
        seller: user._id,
        status: 'active'
      },
      {
        name: 'Maize Grain',
        description: 'Quality maize grain from Morogoro',
        category: 'grains',
        price: 800,
        quantity: 200,
        unit: 'kg',
        location: { region: 'Morogoro', district: 'Morogoro Urban' },
        seller: user._id,
        status: 'active'
      }
    ]);
  });

  describe('GET /api/search/autocomplete', () => {
    it('should return suggestions for a valid query', async () => {
      const res = await request(app).get('/api/search/autocomplete?q=Tom');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('suggestions');
      expect(Array.isArray(res.body.data.suggestions)).toBe(true);
    });

    it('should return empty suggestions for short query', async () => {
      const res = await request(app).get('/api/search/autocomplete?q=T');
      expect(res.status).toBe(200);
      expect(res.body.data.suggestions).toHaveLength(0);
    });

    it('should return empty suggestions when q is missing', async () => {
      const res = await request(app).get('/api/search/autocomplete');
      expect(res.status).toBe(200);
      expect(res.body.data.suggestions).toHaveLength(0);
    });
  });

  describe('GET /api/search (advanced search)', () => {
    it('should return paginated products', async () => {
      const res = await request(app).get('/api/search?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data).toHaveProperty('pagination');
    });

    it('should filter by category', async () => {
      const res = await request(app).get('/api/search?category=vegetables');
      expect(res.status).toBe(200);
      expect(res.body.data.products.every(p => p.category === 'vegetables')).toBe(true);
    });

    it('should filter by region', async () => {
      const res = await request(app).get('/api/search?region=Arusha');
      expect(res.status).toBe(200);
      expect(res.body.data.products.every(p => p.location?.region === 'Arusha')).toBe(true);
    });

    it('should filter by keyword', async () => {
      const res = await request(app).get('/api/search?q=Maize');
      expect(res.status).toBe(200);
      const names = res.body.data.products.map(p => p.name);
      expect(names.some(n => /maize/i.test(n))).toBe(true);
    });
  });

  describe('GET /api/search/saved', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/search/saved');
      expect(res.status).toBe(401);
    });

    it('should return saved searches for authenticated user', async () => {
      const res = await request(app)
        .get('/api/search/saved')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/search/recent', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/search/recent');
      expect(res.status).toBe(401);
    });

    it('should return recent searches for authenticated user', async () => {
      const res = await request(app)
        .get('/api/search/recent')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
