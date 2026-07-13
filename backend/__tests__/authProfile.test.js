const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const app = express();
app.use(express.json());

const authRoutes = require('../routes/auth');
app.use('/api/auth', authRoutes);

const createToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1d' });

describe('Auth Profile API', () => {
  let farmer;
  let farmerToken;
  let buyer;
  let buyerToken;

  beforeEach(async () => {
    farmer = await User.create({
      name: 'Profile Farmer',
      email: 'profile.farmer@test.com',
      password: 'password123',
      phone: '+255712340001',
      role: 'farmer',
      location: { region: 'Arusha', district: 'Arusha Urban' }
    });
    farmerToken = createToken(farmer._id);

    buyer = await User.create({
      name: 'Profile Buyer',
      email: 'profile.buyer@test.com',
      password: 'password123',
      phone: '+255712340002',
      role: 'buyer',
      location: { region: 'Dar es Salaam', district: 'Ilala' }
    });
    buyerToken = createToken(buyer._id);
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email', 'profile.farmer@test.com');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update farmer name and location', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          name: 'Updated Farmer Name',
          phone: '+255712340001',
          location: { region: 'Mbeya', district: 'Mbeya Urban' }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Farmer Name');
      expect(res.body.data.location.region).toBe('Mbeya');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should update buyer business details', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: 'Updated Buyer Name',
          phone: '+255712340002',
          businessDetails: { businessName: 'Buyer Corp', businessType: 'wholesaler' }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Buyer Name');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'Hacker' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh a valid token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ token: farmerToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should reject an invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ token: 'not.a.valid.token' });

      expect(res.status).toBe(401);
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({});
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully when authenticated', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
