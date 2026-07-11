const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const app = express();
app.use(express.json());

const productRoutes = require('../routes/products');
app.use('/api/products', productRoutes);

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1d'
  });
};

describe('Products API', () => {
  let farmer;
  let farmerToken;
  let buyer;
  let buyerToken;

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
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      await Product.create([
        {
          name: 'Fresh Tomatoes',
          description: 'Organic tomatoes from Arusha',
          category: 'vegetables',
          price: 2000,
          unit: 'kg',
          quantity: 100,
          seller: farmer._id,
          location: { region: 'Arusha', district: 'Arusha Urban' }
        },
        {
          name: 'Maize',
          description: 'Quality maize',
          category: 'grains',
          price: 1500,
          unit: 'kg',
          quantity: 500,
          seller: farmer._id,
          location: { region: 'Arusha', district: 'Arusha Urban' }
        }
      ]);
    });

    it('should get all products', async () => {
      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it('should filter products by category', async () => {
      const res = await request(app)
        .get('/api/products')
        .query({ category: 'vegetables' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Fresh Tomatoes');
    });

    it('should filter products by region', async () => {
      const res = await request(app)
        .get('/api/products')
        .query({ region: 'Arusha' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it('should search products by name', async () => {
      const res = await request(app)
        .get('/api/products')
        .query({ search: 'tomato' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.pagination).toHaveProperty('totalPages');
      expect(res.body.meta.pagination).toHaveProperty('page', 1);
    });
  });

  describe('POST /api/products', () => {
    it('should create a product as farmer', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          name: 'Fresh Beans',
          description: 'Quality beans from Kilimanjaro',
          category: 'legumes',
          price: 3000,
          unit: 'kg',
          quantity: 200,
          location: { region: 'Kilimanjaro', district: 'Moshi Urban' }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Fresh Beans');
      expect(res.body.data).toHaveProperty('seller');
    });

    it('should not create product without authentication', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          name: 'Fresh Beans',
          description: 'Quality beans',
          category: 'legumes',
          price: 3000,
          unit: 'kg',
          quantity: 200
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/products/:id', () => {
    let product;

    beforeEach(async () => {
      product = await Product.create({
        name: 'Test Product',
        description: 'Test description',
        category: 'vegetables',
        price: 2000,
        unit: 'kg',
        quantity: 100,
        seller: farmer._id,
        location: { region: 'Arusha', district: 'Arusha Urban' }
      });
    });

    it('should get a single product', async () => {
      const res = await request(app).get(`/api/products/${product._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/products/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/products/:id', () => {
    let product;

    beforeEach(async () => {
      product = await Product.create({
        name: 'Update Test Product',
        description: 'Test description',
        category: 'vegetables',
        price: 2000,
        unit: 'kg',
        quantity: 100,
        seller: farmer._id,
        location: { region: 'Arusha', district: 'Arusha Urban' }
      });
    });

    it('should update own product', async () => {
      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          price: 2500,
          quantity: 150
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('price', 2500);
      expect(res.body.data).toHaveProperty('quantity', 150);
    });

    it('should not update another user product', async () => {
      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          price: 2500
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/products/:id', () => {
    let product;

    beforeEach(async () => {
      product = await Product.create({
        name: 'Delete Test Product',
        description: 'Test description',
        category: 'vegetables',
        price: 2000,
        unit: 'kg',
        quantity: 100,
        seller: farmer._id,
        location: { region: 'Arusha', district: 'Arusha Urban' }
      });
    });

    it('should delete own product', async () => {
      const res = await request(app)
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);

      const deleted = await Product.findById(product._id);
      expect(deleted).toBeNull();
    });

    it('should not delete another user product', async () => {
      const res = await request(app)
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });
});



