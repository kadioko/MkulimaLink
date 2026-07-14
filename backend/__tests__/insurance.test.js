const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Insurance, InsurancePolicy, InsuranceClaim } = require('../models/Insurance');
const { protect } = require('../middleware/auth');

const app = express();
app.use(express.json());

const insuranceRoutes = require('../routes/insurance');
app.use('/api/insurance', insuranceRoutes);

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1d'
  });
};

describe('Insurance API', () => {
  let farmer;
  let farmerToken;
  let buyer;
  let buyerToken;
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

    buyer = await User.create({
      name: 'Test Buyer',
      email: 'buyer@test.com',
      password: 'password123',
      phone: '+255712345679',
      role: 'buyer',
      location: { region: 'Dar es Salaam', district: 'Ilala' }
    });
    buyerToken = createToken(buyer._id);

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

  describe('GET /api/insurance/products', () => {
    it('should get insurance products', async () => {
      const res = await request(app).get('/api/insurance/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter products by region', async () => {
      const res = await request(app)
        .get('/api/insurance/products')
        .query({ region: 'Arusha' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should filter products by crop type', async () => {
      const res = await request(app)
        .get('/api/insurance/products')
        .query({ crop_type: 'maize' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/insurance/quote', () => {
    it('should calculate premium quote', async () => {
      const res = await request(app)
        .post('/api/insurance/quote')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          type: 'crop',
          coverageAmount: 1000000,
          region: 'Arusha',
          farmSize: 10,
          previousClaims: 0,
          organicCertified: false
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('annualPremium');
    });

    it('should reject quote without authentication', async () => {
      const res = await request(app)
        .post('/api/insurance/quote')
        .send({
          type: 'crop',
          coverageAmount: 1000000
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/insurance/purchase', () => {
    it('should purchase insurance policy', async () => {
      const res = await request(app)
        .post('/api/insurance/purchase')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          type: 'crop',
          coverageAmount: 1000000,
          period: { season: 'masika' },
          paymentFrequency: 'seasonal',
          paymentReference: 'PAY123456'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('policy_id');
    });

    it('should reject purchase without authentication', async () => {
      const res = await request(app)
        .post('/api/insurance/purchase')
        .send({
          type: 'crop',
          coverageAmount: 1000000
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/insurance/my-policies', () => {
    beforeEach(async () => {
      await Insurance.create({
        policyholder: farmer._id,
        type: 'crop',
        status: 'active',
        coverage: {
          coverageAmount: 1000000,
          coveredRisks: ['drought', 'flood']
        },
        premium: {
          amount: 50000,
          frequency: 'seasonal',
          nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          payments: [{
            amount: 50000,
            date: new Date(),
            reference: 'PAY123',
            status: 'completed'
          }]
        },
        period: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          season: 'masika'
        },
        partner: {
          name: 'MkulimaLink Insurance Partners',
          code: 'MKLINS'
        }
      });
    });

    it('should get user policies', async () => {
      const res = await request(app)
        .get('/api/insurance/my-policies')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.policies).toHaveLength(1);
      expect(res.body.data.stats).toHaveProperty('totalPolicies', 1);
    });

    it('should filter policies by status', async () => {
      const res = await request(app)
        .get('/api/insurance/my-policies')
        .query({ status: 'active' })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.policies.every(p => p.status === 'active')).toBe(true);
    });
  });

  describe('GET /api/insurance/policy/:id', () => {
    let policy;

    beforeEach(async () => {
      policy = await Insurance.create({
        policyholder: farmer._id,
        type: 'crop',
        status: 'active',
        coverage: {
          coverageAmount: 1000000,
          coveredRisks: ['drought', 'flood']
        },
        premium: {
          amount: 50000,
          frequency: 'seasonal',
          nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        },
        period: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          season: 'masika'
        },
        partner: { name: 'Test', code: 'TEST' }
      });
    });

    it('should get policy details', async () => {
      const res = await request(app)
        .get(`/api/insurance/policy/${policy._id}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(policy._id.toString());
    });

    it('should return 404 for non-existent policy', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/insurance/policy/${fakeId}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(404);
    });

    it('should not allow access to another user policy', async () => {
      const res = await request(app)
        .get(`/api/insurance/policy/${policy._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/insurance/policy/:id/claim', () => {
    let policy;

    beforeEach(async () => {
      policy = await Insurance.create({
        policyholder: farmer._id,
        type: 'crop',
        status: 'active',
        coverage: {
          coverageAmount: 1000000,
          coveredRisks: ['drought', 'flood', 'pest']
        },
        premium: { amount: 50000 },
        period: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        partner: { name: 'Test', code: 'TEST' }
      });
    });

    it('should submit a claim', async () => {
      const res = await request(app)
        .post(`/api/insurance/policy/${policy._id}/claim`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          incident_type: 'drought',
          description: 'Severe drought affected crops',
          estimated_loss: 500000,
          evidence: ['photo1.jpg', 'photo2.jpg']
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('claimNumber');
    });

    it('should reject claim for inactive policy', async () => {
      policy.status = 'expired';
      await policy.save();

      const res = await request(app)
        .post(`/api/insurance/policy/${policy._id}/claim`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          incident_type: 'drought',
          description: 'Drought damage',
          estimated_loss: 500000
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not active');
    });

    it('should reject claim for non-existent policy', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/insurance/policy/${fakeId}/claim`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          incident_type: 'drought',
          estimated_loss: 500000
        });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/insurance/policy/:id/claims', () => {
    let policy;

    beforeEach(async () => {
      policy = await Insurance.create({
        policyholder: farmer._id,
        type: 'crop',
        status: 'active',
        coverage: { coverageAmount: 1000000 },
        premium: { amount: 50000 },
        period: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        partner: { name: 'Test', code: 'TEST' }
      });

      policy.claims.push({
        claimNumber: 'CLM123',
        type: 'drought',
        description: 'Drought damage',
        amount: 500000,
        evidence: ['photo1.jpg'],
        status: 'submitted'
      });
      await policy.save();
    });

    it('should get policy claims', async () => {
      const res = await request(app)
        .get(`/api/insurance/policy/${policy._id}/claims`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/insurance/risk-assessment', () => {
    it('should get weather risk assessment', async () => {
      const res = await request(app)
        .get('/api/insurance/risk-assessment')
        .query({ location: 'Arusha', crop_type: 'maize' })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject request without location', async () => {
      const res = await request(app)
        .get('/api/insurance/risk-assessment')
        .query({ crop_type: 'maize' })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(400);
    });

    it('should reject request without crop type', async () => {
      const res = await request(app)
        .get('/api/insurance/risk-assessment')
        .query({ location: 'Arusha' })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/insurance/policy/:id/renew', () => {
    let policy;

    beforeEach(async () => {
      policy = await Insurance.create({
        policyholder: farmer._id,
        type: 'crop',
        status: 'active',
        coverage: { coverageAmount: 1000000 },
        premium: { amount: 50000 },
        period: {
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        },
        partner: { name: 'Test', code: 'TEST' }
      });
    });

    it('should renew policy', async () => {
      const res = await request(app)
        .post(`/api/insurance/policy/${policy._id}/renew`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ paymentReference: 'RENEW123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Admin routes', () => {
    beforeEach(async () => {
      await Insurance.create([
        {
          policyholder: farmer._id,
          type: 'crop',
          status: 'active',
          coverage: { coverageAmount: 1000000 },
          premium: { amount: 50000 },
          period: { startDate: new Date(), endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
          partner: { name: 'Test', code: 'TEST' }
        }
      ]);
    });

    describe('GET /api/insurance/admin/policies', () => {
      it('should get all policies for admin', async () => {
        const res = await request(app)
          .get('/api/insurance/admin/policies')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.policies)).toBe(true);
      });

      it('should reject non-admin users', async () => {
        const res = await request(app)
          .get('/api/insurance/admin/policies')
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(403);
      });
    });

    describe('GET /api/insurance/admin/claims', () => {
      it('should get all claims for admin', async () => {
        const res = await request(app)
          .get('/api/insurance/admin/claims')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });
  });
});