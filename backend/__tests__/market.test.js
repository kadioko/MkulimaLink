const request = require('supertest');
const express = require('express');
const MarketPrice = require('../models/MarketPrice');

const app = express();
app.use(express.json());

const marketRoutes = require('../routes/market');
app.use('/api/market', marketRoutes);

describe('Market API', () => {
  beforeEach(async () => {
    await MarketPrice.create([
      {
        product: 'Tomatoes',
        category: 'vegetables',
        market: 'Arusha Central Market',
        region: 'Arusha',
        price: { average: 1800, min: 1500, max: 2100 },
        unit: 'kg',
        trend: 'rising',
        changePercentage: 5.2,
        date: new Date()
      },
      {
        product: 'Maize',
        category: 'grains',
        market: 'Morogoro Market',
        region: 'Morogoro',
        price: { average: 750, min: 600, max: 900 },
        unit: 'kg',
        trend: 'stable',
        changePercentage: 0,
        date: new Date()
      },
      {
        product: 'Beans',
        category: 'grains',
        market: 'Arusha Central Market',
        region: 'Arusha',
        price: { average: 2500, min: 2200, max: 2800 },
        unit: 'kg',
        trend: 'falling',
        changePercentage: -3.1,
        date: new Date()
      }
    ]);
  });

  describe('GET /api/market', () => {
    it('should return latest market prices', async () => {
      const res = await request(app).get('/api/market');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('prices');
      expect(Array.isArray(res.body.data.prices)).toBe(true);
    });

    it('should filter by category', async () => {
      const res = await request(app).get('/api/market?category=grains');
      expect(res.status).toBe(200);
      expect(res.body.data.prices.every(p => p.category === 'grains')).toBe(true);
    });

    it('should filter by region', async () => {
      const res = await request(app).get('/api/market?region=Arusha');
      expect(res.status).toBe(200);
      expect(res.body.data.prices.every(p => p.region === 'Arusha')).toBe(true);
    });

    it('should include trend field normalised to up/down/stable', async () => {
      const res = await request(app).get('/api/market');
      expect(res.status).toBe(200);
      const validTrends = ['up', 'down', 'stable'];
      res.body.data.prices.forEach(p => {
        expect(validTrends).toContain(p.trend);
      });
    });
  });

  describe('GET /api/market/prices', () => {
    it('should return market prices list', async () => {
      const res = await request(app).get('/api/market/prices');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter prices by category', async () => {
      const res = await request(app).get('/api/market/prices?category=grains');
      expect(res.status).toBe(200);
      expect(res.body.data.every(p => p.category === 'grains')).toBe(true);
    });
  });

  describe('GET /api/market/prices/latest', () => {
    it('should return latest prices per product/region', async () => {
      const res = await request(app).get('/api/market/prices/latest');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/market/regions', () => {
    it('should return distinct regions', async () => {
      const res = await request(app).get('/api/market/regions');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toContain('Arusha');
    });
  });

  describe('GET /api/market/categories', () => {
    it('should return distinct categories', async () => {
      const res = await request(app).get('/api/market/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
