const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const { protect } = require('../middleware/auth');

const app = express();
app.use(express.json());

const supplierRoutes = require('../routes/suppliers');
app.use('/api/suppliers', supplierRoutes);

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1d'
  });
};

describe('Suppliers API', () => {
  let farmer;
  let farmerToken;
  let buyer;
  let buyerToken;
  let supplier;
  let supplierUser;

  beforeEach(async () => {
    supplierUser = await User.create({
      name: 'Supplier User',
      email: 'supplier@test.com',
      password: 'password123',
      phone: '+255712345678',
      role: 'supplier',
      location: { region: 'Arusha', district: 'Arusha Urban' }
    });

    farmer = await User.create({
      name: 'Test Farmer',
      email: 'farmer@test.com',
      password: 'password123',
      phone: '+255712345679',
      role: 'farmer',
      location: { region: 'Dar es Salaam', district: 'Ilala' }
    });
    farmerToken = createToken(farmer._id);

    buyer = await User.create({
      name: 'Test Buyer',
      email: 'buyer@test.com',
      password: 'password123',
      phone: '+255712345680',
      role: 'buyer',
      location: { region: 'Mwanza', district: 'Ilemela' }
    });
    buyerToken = createToken(buyer._id);

    supplier = await Supplier.create({
      user: supplierUser._id,
      businessName: 'Test Agro Supplies',
      type: 'seeds',
      description: 'Quality seeds supplier',
      location: { region: 'Arusha', district: 'Arusha Urban' },
      contact: { phone: '+255712345678', email: 'supplier@test.com' },
      status: 'active',
      isVerified: true,
      products: [
        { name: 'Hybrid Maize Seeds', price: 5000, unit: 'kg', category: 'seeds' }
      ],
      ratings: { average: 4.5, count: 10 }
    });
  });

  describe('GET /api/suppliers', () => {
    it('should get all suppliers', async () => {
      const res = await request(app).get('/api/suppliers');

      expect(res.status).toBe(200);
      expect(res.body.suppliers).toHaveLength(1);
      expect(res.body.suppliers[0].businessName).toBe('Test Agro Supplies');
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/suppliers')
        .query({ type: 'seeds' });

      expect(res.status).toBe(200);
      expect(res.body.suppliers).toHaveLength(1);
    });

    it('should filter by region', async () => {
      const res = await request(app)
        .get('/api/suppliers')
        .query({ region: 'Arusha' });

      expect(res.status).toBe(200);
      expect(res.body.suppliers).toHaveLength(1);
    });

    it('should filter by verified', async () => {
      const res = await request(app)
        .get('/api/suppliers')
        .query({ verified: 'true' });

      expect(res.status).toBe(200);
      expect(res.body.suppliers).toHaveLength(1);
    });

    it('should search suppliers', async () => {
      const res = await request(app)
        .get('/api/suppliers')
        .query({ search: 'Agro' });

      expect(res.status).toBe(200);
      expect(res.body.suppliers).toHaveLength(1);
    });

    it('should paginate results', async () => {
      await Supplier.create(
        Array(25).fill(null).map((_, i) => ({
          user: new mongoose.Types.ObjectId(),
          businessName: `Supplier ${i}`,
          type: 'seeds',
          location: { region: 'Arusha', district: 'Arusha Urban' },
          contact: { phone: '+255712345678' },
          status: 'active',
          products: [],
          ratings: { average: 0, count: 0 }
        }))
      );

      const res = await request(app)
        .get('/api/suppliers')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.suppliers).toHaveLength(10);
      expect(res.body.totalPages).toBeGreaterThan(1);
    });
  });

  describe('GET /api/suppliers/types', () => {
    it('should get supplier types', async () => {
      const res = await request(app).get('/api/suppliers/types');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
    });
  });

  describe('GET /api/suppliers/:id', () => {
    it('should get supplier by ID', async () => {
      const res = await request(app).get(`/api/suppliers/${supplier._id}`);

      expect(res.status).toBe(200);
      expect(res.body.businessName).toBe('Test Agro Supplies');
      expect(res.body.type).toBe('seeds');
    });

    it('should return 404 for non-existent supplier', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/suppliers/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/suppliers', () => {
    it('should create supplier profile', async () => {
      const newSupplierUser = await User.create({
        name: 'New Supplier',
        email: 'newsupplier@test.com',
        password: 'password123',
        phone: '+255712345681',
        role: 'supplier',
        location: { region: 'Morogoro', district: 'Morogoro Urban' }
      });
      const token = createToken(newSupplierUser._id);

      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          businessName: 'New Agro Supplies',
          type: 'fertilizer',
          description: 'Quality fertilizers',
          location: { region: 'Morogoro', district: 'Morogoro Urban' },
          contact: { phone: '+255712345681', email: 'newsupplier@test.com' }
        });

      expect(res.status).toBe(201);
      expect(res.body.businessName).toBe('New Agro Supplies');
    });

    it('should reject duplicate supplier profile', async () => {
      const token = createToken(supplierUser._id);

      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          businessName: 'Another Supplies',
          type: 'fertilizer'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already have a supplier profile');
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .post('/api/suppliers')
        .send({
          businessName: 'Test',
          type: 'seeds'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/suppliers/:id', () => {
    it('should update own supplier profile', async () => {
      const token = createToken(supplierUser._id);

      const res = await request(app)
        .put(`/api/suppliers/${supplier._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Updated description',
          isVerified: true
        });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Updated description');
    });

    it('should not update another user supplier', async () => {
      const otherUser = await User.create({
        name: 'Other',
        email: 'other@test.com',
        password: 'password123',
        phone: '+255712345682',
        role: 'supplier',
        location: { region: 'Tanga', district: 'Tanga Urban' }
      });
      const token = createToken(otherUser._id);

      const res = await request(app)
        .put(`/api/suppliers/${supplier._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent supplier', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const token = createToken(supplierUser._id);

      const res = await request(app)
        .put(`/api/suppliers/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/suppliers/:id/products', () => {
    it('should add product to supplier', async () => {
      const token = createToken(supplierUser._id);

      const res = await request(app)
        .post(`/api/suppliers/${supplier._id}/products`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'NPK Fertilizer',
          price: 8000,
          unit: 'bag',
          category: 'fertilizer'
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('NPK Fertilizer');
    });

    it('should reject adding product to another supplier', async () => {
      const otherUser = await User.create({
        name: 'Other',
        email: 'other2@test.com',
        password: 'password123',
        phone: '+255712345683',
        role: 'supplier',
        location: { region: 'Tanga', district: 'Tanga Urban' }
      });
      const token = createToken(otherUser._id);

      const res = await request(app)
        .post(`/api/suppliers/${supplier._id}/products`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', price: 1000 });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/suppliers/:id/review', () => {
    it('should submit review', async () => {
      const res = await request(app)
        .post(`/api/suppliers/${supplier._id}/review`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          rating: 5,
          comment: 'Excellent quality seeds'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Review submitted');
      expect(res.body.ratings.average).toBeGreaterThan(0);
    });

    it('should update existing review', async () => {
      await request(app)
        .post(`/api/suppliers/${supplier._id}/review`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ rating: 4, comment: 'Good' });

      const res = await request(app)
        .post(`/api/suppliers/${supplier._id}/review`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ rating: 5, comment: 'Excellent' });

      expect(res.status).toBe(200);
      expect(res.body.ratings.average).toBe(5);
    });
  });

  describe('GET /api/suppliers/my/profile', () => {
    it('should get own supplier profile', async () => {
      const token = createToken(supplierUser._id);

      const res = await request(app)
        .get('/api/suppliers/my/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.businessName).toBe('Test Agro Supplies');
    });

    it('should reject without authentication', async () => {
      const res = await request(app).get('/api/suppliers/my/profile');

      expect(res.status).toBe(401);
    });
  });
});