const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const app = express();
app.use(express.json());

const authRoutes = require('../routes/auth');
app.use('/api/auth', authRoutes);

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new farmer', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Farmer',
          email: 'farmer@test.com',
          password: 'password123',
          phone: '+255712345678',
          role: 'farmer',
          location: {
            region: 'Arusha',
            district: 'Arusha Urban'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('email', 'farmer@test.com');
      expect(res.body.data.user).toHaveProperty('role', 'farmer');
    });

    it('should register a new buyer', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Buyer',
          email: 'buyer@test.com',
          password: 'password123',
          phone: '+255712345679',
          role: 'buyer',
          location: {
            region: 'Dar es Salaam',
            district: 'Ilala'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('role', 'buyer');
    });

    it('should not register with existing email', async () => {
      await User.create({
        name: 'Existing User',
        email: 'existing@test.com',
        password: 'password123',
        phone: '+255712345680',
        role: 'farmer'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'existing@test.com',
          password: 'password123',
          phone: '+255712345681',
          role: 'farmer'
        });

      expect(res.status).toBe(400);
    });

    it('should require all mandatory fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Login Test User',
        email: 'login@test.com',
        password: 'password123',
        phone: '+255712345682',
        role: 'farmer'
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('email', 'login@test.com');
    });

    it('should not login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(res.status).toBe(401);
    });
  });
});



