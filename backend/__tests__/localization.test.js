const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UserLocalization, CountryConfig, RegionalPrices } = require('../models/Localization');
const { protect } = require('../middleware/auth');

const app = express();
app.use(express.json());

const localizationRoutes = require('../routes/localization');
app.use('/api/localization', localizationRoutes);

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1d'
  });
};

describe('Localization API', () => {
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
    describe('GET /api/localization/countries', () => {
      it('should get supported countries', async () => {
        const res = await request(app).get('/api/localization/countries');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('GET /api/localization/languages', () => {
      it('should get supported languages', async () => {
        const res = await request(app).get('/api/localization/languages');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('GET /api/localization/country/:countryCode', () => {
      it('should get country configuration', async () => {
        const res = await request(app).get('/api/localization/country/TZ');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('country_code', 'TZ');
      });

      it('should return 500 for invalid country', async () => {
        const res = await request(app).get('/api/localization/country/XX');

        expect(res.status).toBe(500);
      });
    });

    describe('GET /api/localization/country/:countryCode/crops', () => {
      it('should get regional crops', async () => {
        const res = await request(app).get('/api/localization/country/TZ/crops');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('GET /api/localization/country/:countryCode/payment-methods', () => {
      it('should get payment methods for country', async () => {
        const res = await request(app).get('/api/localization/country/TZ/payment-methods');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('GET /api/localization/prices/:region/:crop', () => {
      it('should get regional prices', async () => {
        await RegionalPrices.create({
          region: 'Arusha',
          crop: 'maize',
          prices: [
            { date: new Date(), price: 500, currency: 'TZS', unit: 'kg', market: 'Arusha Central' }
          ]
        });

        const res = await request(app).get('/api/localization/prices/Arusha/maize');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it('should support days parameter', async () => {
        const res = await request(app)
          .get('/api/localization/prices/Arusha/maize')
          .query({ days: 7 });

        expect(res.status).toBe(200);
      });
    });

    describe('GET /api/localization/content/:countryCode/:language/:key', () => {
      it('should get localized content', async () => {
        const res = await request(app)
          .get('/api/localization/content/TZ/sw/welcome_message');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('GET /api/localization/compliance/:countryCode', () => {
      it('should get compliance requirements', async () => {
        const res = await request(app).get('/api/localization/compliance/TZ');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });
  });

  describe('Protected Routes', () => {
    describe('POST /api/localization/preferences', () => {
      it('should create user preferences', async () => {
        const res = await request(app)
          .post('/api/localization/preferences')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({
            country_code: 'TZ',
            language: 'sw',
            currency: 'TZS',
            timezone: 'Africa/Dar_es_Salaam',
            date_format: 'DD/MM/YYYY',
            measurement_unit: 'metric',
            temperature_unit: 'celsius'
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('country_code', 'TZ');
        expect(res.body.data).toHaveProperty('language', 'sw');
      });

      it('should update existing preferences', async () => {
        await UserLocalization.create({
          user_id: farmer._id,
          country_code: 'TZ',
          language: 'en'
        });

        const res = await request(app)
          .post('/api/localization/preferences')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({ language: 'sw' });

        expect(res.status).toBe(200);
        expect(res.body.data.language).toBe('sw');
      });

      it('should reject without authentication', async () => {
        const res = await request(app)
          .post('/api/localization/preferences')
          .send({ country_code: 'TZ' });

        expect(res.status).toBe(401);
      });
    });

    describe('GET /api/localization/preferences', () => {
      it('should get user preferences', async () => {
        await UserLocalization.create({
          user_id: farmer._id,
          country_code: 'KE',
          language: 'en',
          currency: 'KES'
        });

        const res = await request(app)
          .get('/api/localization/preferences')
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.country_code).toBe('KE');
      });

      it('should create default preferences if none exist', async () => {
        const res = await request(app)
          .get('/api/localization/preferences')
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('country_code', 'TZ');
        expect(res.body.data).toHaveProperty('language', 'en');
      });
    });

    describe('POST /api/localization/convert-currency', () => {
      it('should convert currency', async () => {
        const res = await request(app)
          .post('/api/localization/convert-currency')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({
            amount: 100,
            from_currency: 'USD',
            to_country_code: 'TZ'
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('converted_amount');
      });

      it('should reject missing parameters', async () => {
        const res = await request(app)
          .post('/api/localization/convert-currency')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({ amount: 100 });

        expect(res.status).toBe(500);
      });
    });

    describe('GET /api/localization/transaction-limits/:countryCode', () => {
      it('should get transaction limits', async () => {
        const res = await request(app)
          .get('/api/localization/transaction-limits/TZ')
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('min');
        expect(res.body.data).toHaveProperty('max');
      });

      it('should return 404 for invalid country', async () => {
        const res = await request(app)
          .get('/api/localization/transaction-limits/XX')
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(404);
      });
    });

    describe('POST /api/localization/initiate-payment', () => {
      it('should initiate payment', async () => {
        const res = await request(app)
          .post('/api/localization/initiate-payment')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({
            country_code: 'TZ',
            amount: 10000,
            payment_method: 'mpesa',
            description: 'Test payment'
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('GET /api/localization/payment-status/:paymentId', () => {
      it('should get payment status', async () => {
        const res = await request(app)
          .get('/api/localization/payment-status/pay_123')
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('GET /api/localization/payment-history/:countryCode', () => {
      it('should get payment history', async () => {
        const res = await request(app)
          .get('/api/localization/payment-history/TZ')
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('payments');
        expect(res.body.data).toHaveProperty('pagination');
      });

      it('should support pagination', async () => {
        const res = await request(app)
          .get('/api/localization/payment-history/TZ')
          .query({ page: 1, limit: 5 })
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.pagination.limit).toBe(5);
      });
    });
  });

  describe('Admin Routes', () => {
    describe('GET /api/localization/admin/compliance-logs', () => {
      it('should get compliance logs for admin', async () => {
        const res = await request(app)
          .get('/api/localization/admin/compliance-logs')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('logs');
      });

      it('should reject non-admin users', async () => {
        const res = await request(app)
          .get('/api/localization/admin/compliance-logs')
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(403);
      });

      it('should support pagination', async () => {
        const res = await request(app)
          .get('/api/localization/admin/compliance-logs')
          .query({ page: 1, limit: 10 })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.pagination).toHaveProperty('page', 1);
      });
    });

    describe('POST /api/localization/admin/country-config', () => {
      it('should create/update country config', async () => {
        const res = await request(app)
          .post('/api/localization/admin/country-config')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            country_code: 'UG',
            country_name: 'Uganda',
            currency: 'UGX',
            timezone: 'Africa/Kampala',
            languages: ['en', 'sw', 'lg'],
            payment_methods: ['mtn_momo', 'airtel_money'],
            tax_rate: 0.18,
            kyc_level: 'basic'
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.country_code).toBe('UG');
      });

      it('should reject non-admin users', async () => {
        const res = await request(app)
          .post('/api/localization/admin/country-config')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({ country_code: 'UG' });

        expect(res.status).toBe(403);
      });
    });

    describe('POST /api/localization/admin/regional-partners', () => {
      it('should create regional partner', async () => {
        const res = await request(app)
          .post('/api/localization/admin/regional-partners')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Test Partner',
            country_code: 'TZ',
            partner_type: 'bank',
            contact_email: 'partner@test.com',
            contact_phone: '+255712345678',
            commission_rate: 0.05
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Test Partner');
      });
    });

    describe('GET /api/localization/admin/regional-partners/:countryCode', () => {
      it('should get regional partners', async () => {
        const res = await request(app)
          .get('/api/localization/admin/regional-partners/TZ')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });
  });
});