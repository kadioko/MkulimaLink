const request = require('supertest');
const express = require('express');

const app = express();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MkulimaLink API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

describe('Health Check API', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
    });
  });
});



