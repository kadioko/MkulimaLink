const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');
const axios = require('axios');
const { cacheHelpers } = require('../middleware/cache');

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MkulimaLink API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0'
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {}
  };

  // Check MongoDB connection
  try {
    const mongoState = mongoose.connection.readyState;
    const mongoStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    healthCheck.services.mongodb = {
      status: mongoState === 1 ? 'healthy' : 'unhealthy',
      state: mongoStates[mongoState],
      responseTime: null
    };

    if (mongoState === 1) {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      healthCheck.services.mongodb.responseTime = `${Date.now() - start}ms`;
    }
  } catch (error) {
    healthCheck.services.mongodb = {
      status: 'unhealthy',
      error: error.message
    };
    healthCheck.status = 'DEGRADED';
  }

  // Check Redis connection (if available)
  if (!process.env.REDIS_URL) {
    healthCheck.services.redis = { status: 'not_configured' };
  } else {
    try {
      await cacheHelpers.get('__health_check__');
      await cacheHelpers.set('__health_check__', 'ok', 60);
      healthCheck.services.redis = { status: 'healthy' };
    } catch (error) {
      healthCheck.services.redis = {
        status: 'unhealthy',
        error: error.message
      };
      healthCheck.status = 'DEGRADED';
    }
  }

  // Check external APIs (non-blocking)
  const externalChecks = [
    { name: 'openweather', url: 'https://api.openweathermap.org/data/2.5/weather?q=Dar%20es%20Salaam&appid=test' },
    { name: 'africastalking', url: 'https://api.africastalking.com/version1/user' }
  ];

  healthCheck.services.external = {};
  for (const check of externalChecks) {
    const start = Date.now();
    try {
      await axios.head(check.url, { timeout: 5000, validateStatus: () => true });
      healthCheck.services.external[check.name] = {
        status: 'reachable',
        responseTime: `${Date.now() - start}ms`
      };
    } catch (error) {
      healthCheck.services.external[check.name] = {
        status: 'unreachable',
        error: error.code || error.message
      };
    }
  }

  // System metrics
  healthCheck.system = {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    memory: {
      total: `${Math.round(os.totalmem() / 1024 / 1024)}MB`,
      free: `${Math.round(os.freemem() / 1024 / 1024)}MB`,
      used: `${Math.round((os.totalmem() - os.freemem()) / 1024 / 1024)}MB`,
      processUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    },
    cpu: {
      cores: os.cpus().length,
      loadAverage: os.loadavg()
    }
  };

  const statusCode = healthCheck.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Liveness probe (for Kubernetes)
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness probe (for Kubernetes)
router.get('/ready', async (req, res) => {
  try {
    // Check if MongoDB is ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not ready');
    }
    
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ 
      status: 'not_ready',
      error: error.message 
    });
  }
});

// Metrics endpoint (basic)
router.get('/metrics', async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    process: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    system: {
      loadAverage: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem()
    }
  };

  // Get database stats if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const dbStats = await mongoose.connection.db.stats();
      metrics.database = {
        collections: dbStats.collections,
        documents: dbStats.objects,
        dataSize: `${Math.round(dbStats.dataSize / 1024 / 1024)}MB`,
        storageSize: `${Math.round(dbStats.storageSize / 1024 / 1024)}MB`
      };
    } catch (error) {
      metrics.database = { error: error.message };
    }
  }

  res.json(metrics);
});

module.exports = router;
