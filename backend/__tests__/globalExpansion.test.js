const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { GlobalRegion, RegionalMetrics, CurrencyRate, PartnershipAgreement, RegionalCompliance } = require('../models/GlobalExpansion');
const { protect } = require('../middleware/auth');

const app = express();
app.use(express.json());

const globalExpansionRoutes = require('../routes/globalExpansion');
app.use('/api/global-expansion', globalExpansionRoutes);

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1d'
  });
};

describe('Global Expansion API', () => {
  let farmer;
  let farmerToken;
  let admin;
  let adminToken;

  beforeEach(async () => {
    farmer = await User.create({
      name: 'Test Farmer',
      email: 'farmer@test.com',
      password: 'password123',
      phone: '+255712345678',
      role: 'farmer',
      location: { region: 'Arusha', district: 'Arusha Urban' }
    });
    farmerToken = createToken(farmer._id);

    admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      phone: '+255712345680',
      role: 'admin',
      location: { region: 'Dar es Salaam', district: 'Ilala' }
    });
    adminToken = createToken(admin._id);
  });

  describe('Public Routes', () => {
    describe('GET /api/global-expansion/regions', () => {
      it('should get supported regions', async () => {
        const res = await request(app).get('/api/global-expansion/regions');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('GET /api/global-expansion/languages', () => {
      it('should get supported languages', async () => {
        const res = await request(app).get('/api/global-expansion/languages');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('GET /api/global-expansion/currency-rates', () => {
      beforeEach(async () => {
        await CurrencyRate.create([
          { from_currency: 'USD', to_currency: 'TZS', rate: 2500, source: 'central_bank', valid_from: new Date(), valid_to: new Date(Date.now() + 86400000) },
          { from_currency: 'USD', to_currency: 'KES', rate: 130, source: 'central_bank', valid_from: new Date(), valid_to: new Date(Date.now() + 86400000) }
        ]);
      });

      it('should get currency rates', async () => {
        const res = await request(app).get('/api/global-expansion/currency-rates');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('GET /api/global-expansion/regions/:regionCode', () => {
      it('should get region details', async () => {
        const res = await request(app).get('/api/global-expansion/regions/EA');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('region_code', 'EA');
      });

      it('should return 500 for invalid region', async () => {
        const res = await request(app).get('/api/global-expansion/regions/XX');

        expect(res.status).toBe(500);
      });
    });

    describe('GET /api/global-expansion/global-metrics', () => {
      it('should get global metrics', async () => {
        const res = await request(app).get('/api/global-expansion/global-metrics');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('total_users');
        expect(res.body.data).toHaveProperty('total_transactions');
      });
    });

    describe('GET /api/global-expansion/expansion-roadmap', () => {
      it('should get expansion roadmap', async () => {
        const res = await request(app).get('/api/global-expansion/expansion-roadmap');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });
  });

  describe('Protected Routes', () => {
    describe('POST /api/global-expansion/convert-currency', () => {
      it('should convert currency', async () => {
        const res = await request(app)
          .post('/api/global-expansion/convert-currency')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({
            amount: 100,
            fromCurrency: 'USD',
            toCurrency: 'TZS'
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('original_amount', 100);
        expect(res.body.data).toHaveProperty('original_currency', 'USD');
        expect(res.body.data).toHaveProperty('converted_amount');
        expect(res.body.data).toHaveProperty('target_currency', 'TZS');
      });

      it('should reject missing parameters', async () => {
        const res = await request(app)
          .post('/api/global-expansion/convert-currency')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({ amount: 100 });

        expect(res.status).toBe(500);
      });
    });

    describe('GET /api/global-expansion/payment-methods/:regionCode', () => {
      it('should get payment methods by region', async () => {
        const res = await request(app)
          .get('/api/global-expansion/payment-methods/EA')
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('GET /api/global-expansion/partnerships/:regionCode', () => {
      beforeEach(async () => {
        await PartnershipAgreement.create([
          {
            region_code: 'EA',
            partner_name: 'East Africa Bank',
            partner_type: 'financial',
            agreement_type: 'payment_processing',
            status: 'active',
            start_date: new Date(),
            end_date: new Date(Date.now() + 365 * 86400000),
            terms: { commission: 0.02 }
          }
        ]);
      });

      it('should get partnerships by region', async () => {
        const res = await request(app)
          .get('/api/global-expansion/partnerships/EA')
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('partnerships');
        expect(res.body.data.partnerships).toHaveLength(1);
      });

      it('should support pagination', async () => {
        const res = await request(app)
          .get('/api/global-expansion/partnerships/EA')
          .query({ page: 1, limit: 5 })
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('pagination');
      });
    });
  });

  describe('Admin Routes', () => {
    describe('POST /api/global-expansion/admin/regions', () => {
      it('should add new region', async () => {
        const res = await request(app)
          .post('/api/global-expansion/admin/regions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            region_code: 'WA',
            name: 'West Africa',
            countries: ['NG', 'GH', 'CI'],
            currency: 'NGN',
            timezone: 'Africa/Lagos',
            languages: ['en', 'yo', 'ig', 'ha'],
            gdp_per_capita: 2000,
            population: 400000000,
            internet_penetration: 0.45,
            mobile_penetration: 0.85,
            agricultural_gdp_share: 0.25,
            key_crops: ['cassava', 'yam', 'maize', 'rice'],
            regulatory_environment: 'developing',
            market_maturity: 'emerging'
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.region_code).toBe('WA');
      });

      it('should reject non-admin users', async () => {
        const res = await request(app)
          .post('/api/global-expansion/admin/regions')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({ region_code: 'WA' });

        expect(res.status).toBe(403);
      });
    });

    describe('POST /api/global-expansion/admin/currency-rates', () => {
      it('should update currency rates', async () => {
        const res = await request(app)
          .post('/api/global-expansion/admin/currency-rates')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            rates: [
              { from_currency: 'USD', to_currency: 'TZS', rate: 2550 },
              { from_currency: 'USD', to_currency: 'KES', rate: 132 }
            ]
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('updated');
      });

      it('should reject non-admin users', async () => {
        const res = await request(app)
          .post('/api/global-expansion/admin/currency-rates')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({ rates: [] });

        expect(res.status).toBe(403);
      });
    });

    describe('POST /api/global-expansion/admin/partnerships', () => {
      it('should create partnership agreement', async () => {
        const res = await request(app)
          .post('/api/global-expansion/admin/partnerships')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            region_code: 'EA',
            partner_name: 'New Partner Bank',
            partner_type: 'financial',
            agreement_type: 'loan_distribution',
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 365 * 86400000).toISOString(),
            terms: { revenue_share: 0.15 }
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.partner_name).toBe('New Partner Bank');
      });
    });

    describe('GET /api/global-expansion/admin/compliance/:regionCode', () => {
      beforeEach(async () => {
        await RegionalCompliance.create([
          {
            region_code: 'EA',
            regulation_name: 'Data Protection Act',
            regulation_type: 'data_privacy',
            description: 'Personal data protection requirements',
            effective_date: new Date(),
            status: 'active',
            requirements: ['User consent', 'Data encryption', 'Right to deletion'],
            penalties: 'Fine up to 2% of revenue'
          }
        ]);
      });

      it('should get compliance records for region', async () => {
        const res = await request(app)
          .get('/api/global-expansion/admin/compliance/EA')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it('should reject non-admin users', async () => {
        const res = await request(app)
          .get('/api/global-expansion/admin/compliance/EA')
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(403);
      });
    });
  });
});