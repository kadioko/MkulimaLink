const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { LoanApplication } = require('../models/Loan');
const { protect } = require('../middleware/auth');

const app = express();
app.use(express.json());

const loanRoutes = require('../routes/loans');
app.use('/api/loans', loanRoutes);

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1d'
  });
};

describe('Loans API', () => {
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

  describe('POST /api/loans/apply', () => {
    it('should submit a loan application', async () => {
      const res = await request(app)
        .post('/api/loans/apply')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          amount: 100000,
          term_months: 6,
          purpose: 'seeds',
          description: 'Need seeds for planting season',
          farming_experience_years: 5,
          farm_size: 10
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('application');
    });

    it('should reject application without authentication', async () => {
      const res = await request(app)
        .post('/api/loans/apply')
        .send({
          amount: 100000,
          term_months: 6,
          purpose: 'seeds'
        });

      expect(res.status).toBe(401);
    });

    it('should reject application with missing required fields', async () => {
      const res = await request(app)
        .post('/api/loans/apply')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          amount: 100000
        });

      expect(res.status).toBe(500);
    });

    it('should reject second application if one is active', async () => {
      await LoanApplication.create({
        user: farmer._id,
        amount: 100000,
        term_months: 6,
        purpose: 'seeds',
        status: 'approved'
      });

      const res = await request(app)
        .post('/api/loans/apply')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          amount: 200000,
          term_months: 12,
          purpose: 'fertilizer'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('active loan');
    });
  });

  describe('GET /api/loans/my-loans', () => {
    beforeEach(async () => {
      await LoanApplication.create([
        {
          user: farmer._id,
          amount: 100000,
          term_months: 6,
          purpose: 'seeds',
          status: 'approved',
          interest_rate: 15
        },
        {
          user: farmer._id,
          amount: 200000,
          term_months: 12,
          purpose: 'equipment',
          status: 'repaying',
          interest_rate: 12
        }
      ]);
    });

    it('should get user loans', async () => {
      const res = await request(app)
        .get('/api/loans/my-loans')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.loans).toHaveLength(2);
      expect(res.body.data.stats).toHaveProperty('totalLoans', 2);
    });

    it('should filter loans by status', async () => {
      const res = await request(app)
        .get('/api/loans/my-loans')
        .query({ status: 'approved' })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.loans).toHaveLength(1);
      expect(res.body.data.loans[0].status).toBe('approved');
    });
  });

  describe('GET /api/loans/:id', () => {
    let loan;

    beforeEach(async () => {
      loan = await LoanApplication.create({
        user: farmer._id,
        amount: 150000,
        term_months: 8,
        purpose: 'fertilizer',
        status: 'disbursed',
        interest_rate: 14,
        approvedAmount: 140000,
        disbursement_date: new Date()
      });
    });

    it('should get loan details', async () => {
      const res = await request(app)
        .get(`/api/loans/${loan._id}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(loan._id.toString());
      expect(res.body.data.amount).toBe(150000);
    });

    it('should return 404 for non-existent loan', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/loans/${fakeId}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(404);
    });

    it('should not allow access to another user loan', async () => {
      const res = await request(app)
        .get(`/api/loans/${loan._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/loans/:id/repay', () => {
    let loan;

    beforeEach(async () => {
      loan = await LoanApplication.create({
        user: farmer._id,
        amount: 100000,
        term_months: 6,
        purpose: 'seeds',
        status: 'disbursed',
        interest_rate: 15,
        approvedAmount: 95000,
        outstanding_balance: 95000,
        disbursement_date: new Date()
      });
    });

    it('should process loan repayment', async () => {
      const res = await request(app)
        .post(`/api/loans/${loan._id}/repay`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          amount: 20000,
          paymentMethod: 'wallet'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Payment processed');
    });

    it('should reject repayment for non-existent loan', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/loans/${fakeId}/repay`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          amount: 10000,
          paymentMethod: 'wallet'
        });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/loans/:id/schedule', () => {
    let loan;

    beforeEach(async () => {
      loan = await LoanApplication.create({
        user: farmer._id,
        amount: 100000,
        term_months: 6,
        purpose: 'seeds',
        status: 'active',
        interest_rate: 15,
        approvedAmount: 95000,
        outstanding_balance: 95000,
        disbursement_date: new Date(),
        next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    it('should get repayment schedule', async () => {
      const res = await request(app)
        .get(`/api/loans/${loan._id}/schedule`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('schedule');
    });
  });

  describe('GET /api/loans/credit-score', () => {
    it('should calculate credit score', async () => {
      const res = await request(app)
        .get('/api/loans/credit-score')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          farming_experience_years: 5,
          farm_size: 10
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('score');
      expect(res.body.data).toHaveProperty('eligible');
    });
  });

  describe('GET /api/loans/products/available', () => {
    it('should get available loan products', async () => {
      const res = await request(app)
        .get('/api/loans/products/available')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/loans/calculate', () => {
    it('should calculate loan terms', async () => {
      const res = await request(app)
        .post('/api/loans/calculate')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          amount: 100000,
          term_months: 12,
          interest_rate: 15
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('monthly_payment');
      expect(res.body.data).toHaveProperty('total_payable');
    });

    it('should reject calculation with missing fields', async () => {
      const res = await request(app)
        .post('/api/loans/calculate')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          amount: 100000
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Admin routes', () => {
    let loan;

    beforeEach(async () => {
      loan = await LoanApplication.create({
        user: farmer._id,
        amount: 100000,
        term_months: 6,
        purpose: 'seeds',
        status: 'submitted',
        interest_rate: 15
      });
    });

    describe('GET /api/loans/admin/all', () => {
      it('should get all loans for admin', async () => {
        const res = await request(app)
          .get('/api/loans/admin/all')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.loans)).toBe(true);
      });

      it('should reject non-admin users', async () => {
        const res = await request(app)
          .get('/api/loans/admin/all')
          .set('Authorization', `Bearer ${farmerToken}`);

        expect(res.status).toBe(403);
      });
    });

    describe('POST /api/loans/:id/review', () => {
      it('should approve loan application', async () => {
        const res = await request(app)
          .post(`/api/loans/${loan._id}/review`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'approved',
            approved_amount: 90000
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('approved');
      });

      it('should reject loan application', async () => {
        const res = await request(app)
          .post(`/api/loans/${loan._id}/review`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'rejected',
            review_notes: 'Insufficient collateral'
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('rejected');
      });
    });

    describe('POST /api/loans/:id/disburse', () => {
      beforeEach(async () => {
        loan.status = 'approved';
        loan.approvedAmount = 90000;
        await loan.save();
      });

      it('should disburse loan', async () => {
        const res = await request(app)
          .post(`/api/loans/${loan._id}/disburse`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });
  });
});