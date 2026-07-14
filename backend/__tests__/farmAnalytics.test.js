const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { FarmAnalytics, AnalyticsAlert, PerformanceReport } = require('../models/Analytics');
const { protect } = require('../middleware/auth');

const app = express();
app.use(express.json());

const farmAnalyticsRoutes = require('../routes/farmAnalytics');
app.use('/api/farm-analytics', farmAnalyticsRoutes);

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1d'
  });
};

describe('Farm Analytics API', () => {
  let farmer;
  let farmerToken;
  let farmId;

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

    farmId = new mongoose.Types.ObjectId().toString();
  });

  describe('POST /api/farm-analytics/farm/initialize/:farmId', () => {
    it('should initialize farm analytics', async () => {
      const res = await request(app)
        .post(`/api/farm-analytics/farm/initialize/${farmId}`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          name: 'Test Farm',
          area_hectares: 10,
          soil_type: 'loamy',
          irrigation_type: 'drip',
          crops: ['maize', 'beans'],
          coordinates: { latitude: -3.3869, longitude: 36.6830 }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('farm_id', farmId);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .post(`/api/farm-analytics/farm/initialize/${farmId}`)
        .send({ name: 'Test Farm' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/farm-analytics/farm/:farmId/dashboard', () => {
    beforeEach(async () => {
      await FarmAnalytics.create({
        user_id: farmer._id,
        farm_id: farmId,
        name: 'Test Farm',
        area_hectares: 10,
        soil_type: 'loamy',
        irrigation_type: 'drip',
        crops: ['maize', 'beans'],
        coordinates: { latitude: -3.3869, longitude: 36.6830 },
        metrics: {
          current_yield: 5000,
          projected_yield: 5500,
          water_usage: 50000,
          fertilizer_usage: 200,
          pesticide_usage: 50
        },
        gps_data: {
          boundary_points: [
            { lat: -3.3869, lng: 36.6830 },
            { lat: -3.3870, lng: 36.6831 }
          ]
        }
      });
    });

    it('should get farm dashboard', async () => {
      const res = await request(app)
        .get(`/api/farm-analytics/farm/${farmId}/dashboard`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('farm');
    });
  });

  describe('PUT /api/farm-analytics/farm/:farmId/metrics', () => {
    beforeEach(async () => {
      await FarmAnalytics.create({
        user_id: farmer._id,
        farm_id: farmId,
        name: 'Test Farm',
        area_hectares: 10
      });
    });

    it('should update farm metrics', async () => {
      const res = await request(app)
        .put(`/api/farm-analytics/farm/${farmId}/metrics`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          current_yield: 6000,
          water_usage: 45000,
          fertilizer_usage: 180
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.current_yield).toBe(6000);
    });
  });

  describe('PUT /api/farm-analytics/farm/:farmId/gps', () => {
    beforeEach(async () => {
      await FarmAnalytics.create({
        user_id: farmer._id,
        farm_id: farmId,
        name: 'Test Farm',
        area_hectares: 10
      });
    });

    it('should update GPS data', async () => {
      const res = await request(app)
        .put(`/api/farm-analytics/farm/${farmId}/gps`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          boundary_points: [
            { lat: -3.3869, lng: 36.6830 },
            { lat: -3.3870, lng: 36.6831 },
            { lat: -3.3871, lng: 36.6832 }
          ],
          center_point: { lat: -3.3870, lng: 36.6831 }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.gps_data.boundary_points).toHaveLength(3);
    });
  });

  describe('POST /api/farm-analytics/farm/:farmId/satellite/update', () => {
    beforeEach(async () => {
      await FarmAnalytics.create({
        user_id: farmer._id,
        farm_id: farmId,
        name: 'Test Farm',
        area_hectares: 10,
        coordinates: { latitude: -3.3869, longitude: 36.6830 }
      });
    });

    it('should update satellite data', async () => {
      const res = await request(app)
        .post(`/api/farm-analytics/farm/${farmId}/satellite/update`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent farm', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/farm-analytics/farm/${fakeId}/satellite/update`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/farm-analytics/farm/:farmId/predictions/yield', () => {
    beforeEach(async () => {
      await FarmAnalytics.create({
        user_id: farmer._id,
        farm_id: farmId,
        name: 'Test Farm',
        area_hectares: 10,
        crops: ['maize'],
        metrics: { current_yield: 5000 }
      });
    });

    it('should get yield predictions', async () => {
      const res = await request(app)
        .get(`/api/farm-analytics/farm/${farmId}/predictions/yield`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/farm-analytics/market/forecast/:region/:crop', () => {
    it('should get price forecast', async () => {
      const res = await request(app)
        .get('/api/farm-analytics/market/forecast/Arusha/maize')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .get('/api/farm-analytics/market/forecast/Arusha/maize');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/farm-analytics/market/trends/:region/:crop', () => {
    it('should get market trends', async () => {
      const res = await request(app)
        .get('/api/farm-analytics/market/trends/Arusha/maize')
        .query({ days: 30 })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/farm-analytics/farm/:farmId/benchmarking', () => {
    beforeEach(async () => {
      await FarmAnalytics.create({
        user_id: farmer._id,
        farm_id: farmId,
        name: 'Test Farm',
        area_hectares: 10,
        crops: ['maize'],
        metrics: { current_yield: 5000 }
      });
    });

    it('should get benchmarking data', async () => {
      const res = await request(app)
        .get(`/api/farm-analytics/farm/${farmId}/benchmarking`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/farm-analytics/farms', () => {
    beforeEach(async () => {
      await FarmAnalytics.create([
        {
          user_id: farmer._id,
          farm_id: farmId,
          name: 'Farm 1',
          area_hectares: 10,
          crops: ['maize']
        },
        {
          user_id: farmer._id,
          farm_id: new mongoose.Types.ObjectId().toString(),
          name: 'Farm 2',
          area_hectares: 5,
          crops: ['beans']
        }
      ]);
    });

    it('should get user farms', async () => {
      const res = await request(app)
        .get('/api/farm-analytics/farms')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/farm-analytics/alerts', () => {
    beforeEach(async () => {
      await AnalyticsAlert.create([
        {
          user_id: farmer._id,
          farm_id: farmId,
          alert_type: 'yield_risk',
          severity: 'high',
          message: 'Yield projection below threshold',
          status: 'active'
        },
        {
          user_id: farmer._id,
          farm_id: farmId,
          alert_type: 'water_stress',
          severity: 'medium',
          message: 'Soil moisture low',
          status: 'active'
        }
      ]);
    });

    it('should get alerts', async () => {
      const res = await request(app)
        .get('/api/farm-analytics/alerts')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.alerts).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/farm-analytics/alerts')
        .query({ status: 'active' })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.alerts.every(a => a.status === 'active')).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/farm-analytics/alerts')
        .query({ page: 1, limit: 1 })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('pagination');
    });
  });

  describe('PUT /api/farm-analytics/alerts/:alertId/acknowledge', () => {
    let alert;

    beforeEach(async () => {
      alert = await AnalyticsAlert.create({
        user_id: farmer._id,
        farm_id: farmId,
        alert_type: 'yield_risk',
        severity: 'high',
        message: 'Test alert',
        status: 'active'
      });
    });

    it('should acknowledge alert', async () => {
      const res = await request(app)
        .put(`/api/farm-analytics/alerts/${alert._id}/acknowledge`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent alert', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/farm-analytics/alerts/${fakeId}/acknowledge`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/farm-analytics/alerts/:alertId/resolve', () => {
    let alert;

    beforeEach(async () => {
      alert = await AnalyticsAlert.create({
        user_id: farmer._id,
        farm_id: farmId,
        alert_type: 'yield_risk',
        severity: 'high',
        message: 'Test alert',
        status: 'active'
      });
    });

    it('should resolve alert', async () => {
      const res = await request(app)
        .put(`/api/farm-analytics/alerts/${alert._id}/resolve`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/farm-analytics/reports/generate', () => {
    it('should generate performance report', async () => {
      const res = await request(app)
        .post('/api/farm-analytics/reports/generate')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          farm_id: farmId,
          period: 'monthly',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          metrics: { yield: 5000, water_usage: 50000 }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('farm_id', farmId);
    });
  });

  describe('GET /api/farm-analytics/reports', () => {
    beforeEach(async () => {
      await PerformanceReport.create([
        {
          user_id: farmer._id,
          farm_id: farmId,
          period: 'monthly',
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-01-31'),
          metrics: { yield: 5000 }
        },
        {
          user_id: farmer._id,
          farm_id: farmId,
          period: 'monthly',
          start_date: new Date('2024-02-01'),
          end_date: new Date('2024-02-29'),
          metrics: { yield: 5500 }
        }
      ]);
    });

    it('should get performance reports', async () => {
      const res = await request(app)
        .get('/api/farm-analytics/reports')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reports).toHaveLength(2);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/farm-analytics/reports')
        .query({ page: 1, limit: 1 })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('pagination');
    });
  });

  describe('GET /api/farm-analytics/export/:format', () => {
    beforeEach(async () => {
      await FarmAnalytics.create({
        user_id: farmer._id,
        farm_id: farmId,
        name: 'Test Farm',
        area_hectares: 10,
        metrics: { current_yield: 5000, water_usage: 50000 }
      });
    });

    it('should export as CSV', async () => {
      const res = await request(app)
        .get(`/api/farm-analytics/export/csv`)
        .query({ farm_id: farmId })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('text/csv');
    });

    it('should export as JSON', async () => {
      const res = await request(app)
        .get(`/api/farm-analytics/export/json`)
        .query({ farm_id: farmId })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('application/json');
    });

    it('should reject invalid format', async () => {
      const res = await request(app)
        .get(`/api/farm-analytics/export/xml`)
        .query({ farm_id: farmId })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent farm', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/farm-analytics/export/json`)
        .query({ farm_id: fakeId })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(404);
    });
  });
});