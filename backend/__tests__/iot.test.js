const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { IoTDevice, SensorData, DeviceAlert } = require('../models/IoT');
const { protect } = require('../middleware/auth');

const app = express();
app.use(express.json());

const iotRoutes = require('../routes/iot');
app.use('/api/iot', iotRoutes);

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1d'
  });
};

describe('IoT API', () => {
  let farmer;
  let farmerToken;
  let device;
  let deviceId = 'TEST_DEVICE_001';
  let apiKey = 'test-api-key-123';

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

    device = await IoTDevice.create({
      user_id: farmer._id,
      device_id: deviceId,
      api_key: apiKey,
      device_name: 'Soil Sensor 1',
      device_type: 'soil_sensor',
      location: { type: 'Point', coordinates: [36.6830, -3.3869] },
      protocol: 'mqtt',
      status: 'active',
      firmware_version: '1.0.0',
      configuration: { sampling_interval: 300 }
    });
  });

  describe('POST /api/iot/data (Public - Device Data Ingestion)', () => {
    it('should accept sensor data from device', async () => {
      const res = await request(app)
        .post('/api/iot/data')
        .send({
          device_id: deviceId,
          api_key: apiKey,
          sensor_data: {
            moisture: 65,
            temperature: 24.5,
            ph: 6.8,
            timestamp: new Date().toISOString()
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('received');
    });

    it('should reject invalid device credentials', async () => {
      const res = await request(app)
        .post('/api/iot/data')
        .send({
          device_id: 'INVALID_DEVICE',
          api_key: 'wrong-key',
          sensor_data: { moisture: 65 }
        });

      expect(res.status).toBe(401);
    });

    it('should reject missing sensor data', async () => {
      const res = await request(app)
        .post('/api/iot/data')
        .send({
          device_id: deviceId,
          api_key: apiKey
        });

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/iot/devices (Protected)', () => {
    it('should register a new device', async () => {
      const res = await request(app)
        .post('/api/iot/devices')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          name: 'Weather Station',
          type: 'weather',
          protocol: 'LoRaWAN',
          location: { latitude: -3.3870, longitude: 36.6831 },
          configuration: { sampling_interval: 600 }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('device_id');
      expect(res.body.data).toHaveProperty('api_key');
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .post('/api/iot/devices')
        .send({ name: 'Test', type: 'soil' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/iot/devices', () => {
    it('should get user devices', async () => {
      const res = await request(app)
        .get('/api/iot/devices')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('devices');
      expect(res.body.data.devices).toHaveLength(1);
    });

    it('should support pagination', async () => {
      // Create more devices
      await IoTDevice.create(
        Array(25).fill(null).map((_, i) => ({
          user: farmer._id,
          device_id: `DEVICE_${i}`,
          api_key: `key_${i}`,
          name: `Device ${i}`,
          type: 'soil_moisture',
          protocol: 'MQTT',
          location: { latitude: -3.3869, longitude: 36.6830 },
          status: 'online'
        }))
      );

      const res = await request(app)
        .get('/api/iot/devices')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.devices).toHaveLength(10);
      expect(res.body.data).toHaveProperty('pagination');
    });
  });

  describe('GET /api/iot/devices/:deviceId', () => {
    it('should get device details', async () => {
      const res = await request(app)
        .get(`/api/iot/devices/${deviceId}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.device_id).toBe(deviceId);
      expect(res.body.data.name).toBe('Soil Sensor 1');
    });

    it('should return 500 for non-existent device', async () => {
      const res = await request(app)
        .get('/api/iot/devices/NONEXISTENT')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/iot/devices/:deviceId/data', () => {
    beforeEach(async () => {
      await SensorData.create([
        {
          device_id: deviceId,
          sensor_type: 'moisture',
          value: 65,
          unit: '%',
          timestamp: new Date()
        },
        {
          device_id: deviceId,
          sensor_type: 'temperature',
          value: 24.5,
          unit: '°C',
          timestamp: new Date()
        },
        {
          device_id: deviceId,
          sensor_type: 'moisture',
          value: 63,
          unit: '%',
          timestamp: new Date(Date.now() - 3600000)
        }
      ]);
    });

    it('should get sensor data', async () => {
      const res = await request(app)
        .get(`/api/iot/devices/${deviceId}/data`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('sensor_data');
    });

    it('should filter by sensor type', async () => {
      const res = await request(app)
        .get(`/api/iot/devices/${deviceId}/data`)
        .query({ sensor_type: 'moisture' })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get(`/api/iot/devices/${deviceId}/data`)
        .query({ page: 1, limit: 1 })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.sensor_data).toHaveLength(1);
    });
  });

describe('GET /api/iot/devices/:deviceId/alerts', () => {
    beforeEach(async () => {
      await DeviceAlert.create([
        {
          device_id: device._id,
          user_id: farmer._id,
          sensor_type: 'moisture',
          alert_type: 'below_minimum',
          severity: 'high',
          message: 'Moisture level too low',
          value: 20,
          threshold: 30,
          status: 'active'
        },
        {
          device_id: device._id,
          user_id: farmer._id,
          sensor_type: 'temperature',
          alert_type: 'device_offline',
          severity: 'medium',
          message: 'Device not reporting',
          status: 'active'
        }
      ]);
    });

    it('should get device alerts', async () => {
      const res = await request(app)
        .get(`/api/iot/devices/${deviceId}/alerts`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.alerts).toHaveLength(2);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get(`/api/iot/devices/${deviceId}/alerts`)
        .query({ page: 1, limit: 1 })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.alerts).toHaveLength(1);
    });
  });

  describe('POST /api/iot/alerts/:alertId/acknowledge', () => {
    let alert;

    beforeEach(async () => {
      alert = await DeviceAlert.create({
        device_id: device._id,
        user_id: farmer._id,
        sensor_type: 'temperature',
        alert_type: 'above_maximum',
        message: 'Test alert',
        value: 45,
        threshold: 40,
        status: 'active'
      });
    });

    it('should acknowledge alert', async () => {
      const res = await request(app)
        .post(`/api/iot/alerts/${alert._id}/acknowledge`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('acknowledged');
    });
  });

  describe('POST /api/iot/alerts/:alertId/resolve', () => {
    let alert;

    beforeEach(async () => {
      alert = await DeviceAlert.create({
        device_id: device._id,
        user_id: farmer._id,
        sensor_type: 'temperature',
        alert_type: 'above_maximum',
        message: 'Test alert',
        value: 45,
        threshold: 40,
        status: 'active'
      });
    });

    it('should resolve alert', async () => {
      const res = await request(app)
        .post(`/api/iot/alerts/${alert._id}/resolve`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('resolved');
    });
  });

  describe('GET /api/iot/devices/:deviceId/analytics', () => {
    it('should get IoT analytics', async () => {
      const res = await request(app)
        .get(`/api/iot/devices/${deviceId}/analytics`)
        .query({ period: '24h' })
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('period', '24h');
    });
  });

  describe('GET /api/iot/device-types', () => {
    it('should get device types', async () => {
      const res = await request(app)
        .get('/api/iot/device-types')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/iot/protocols', () => {
    it('should get supported protocols', async () => {
      const res = await request(app)
        .get('/api/iot/protocols')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});