const redis = require('redis');
const { promisify } = require('util');

// Redis client
let redisClient = null;

// Initialize Redis connection
async function initRedis() {
  try {
    if (!redisClient) {
      redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis connection refused');
            return new Error('Redis connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      redisClient.on('error', (err) => {
        console.error('Redis error:', err);
      });

      redisClient.on('connect', () => {
        console.log('Connected to Redis');
      });

      await redisClient.connect();
    }
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    redisClient = null;
  }
}

// Initialize on module load
initRedis();

// Cache middleware factory
const cache = (options = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `cache:${req.method}:${req.originalUrl}`,
    condition = () => true,
    skipCache = false
  } = options;

  return async (req, res, next) => {
    // Skip cache if Redis is not available or condition fails
    if (!redisClient || skipCache || !condition(req)) {
      return next();
    }

    const key = keyGenerator(req);

    try {
      // Try to get cached response
      const cached = await redisClient.get(key);
      
      if (cached) {
        const data = JSON.parse(cached);
        
        // Set cache headers
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', key);
        
        // Return cached response
        return res.json(data);
      }

      // Cache miss - continue and cache response
      res.set('X-Cache', 'MISS');
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setEx(key, ttl, JSON.stringify(data)).catch(err => {
            console.error('Cache set error:', err);
          });
        }
        
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation
const invalidate = async (pattern) => {
  if (!redisClient) return;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Invalidated ${keys.length} cache keys: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

// Cache helpers
const cacheHelpers = {
  // Get cached value
  get: async (key) => {
    if (!redisClient) return null;
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  // Set cached value
  set: async (key, value, ttl = 300) => {
    if (!redisClient) return;
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  // Delete cached value
  del: async (key) => {
    if (!redisClient) return;
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  // Clear all cache
  clear: async () => {
    if (!redisClient) return;
    try {
      await redisClient.flushDb();
      console.log('Cache cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },

  // Get cache stats
  stats: async () => {
    if (!redisClient) return null;
    try {
      const info = await redisClient.info('memory');
      return info;
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }
};

// Predefined cache configurations
const cacheConfig = {
  // Products cache - 5 minutes
  products: cache({
    ttl: 300,
    keyGenerator: (req) => `products:${JSON.stringify(req.query)}`
  }),

  // Market prices cache - 1 hour
  marketPrices: cache({
    ttl: 3600,
    keyGenerator: (req) => `market:${req.params.region || 'all'}`
  }),

  // Weather cache - 30 minutes
  weather: cache({
    ttl: 1800,
    keyGenerator: (req) => `weather:${req.params.region || 'all'}`
  }),

  // User data cache - 10 minutes
  userData: cache({
    ttl: 600,
    keyGenerator: (req) => `user:${req.user?.id}:${req.originalUrl}`,
    condition: (req) => !!req.user
  }),

  // Analytics cache - 15 minutes
  analytics: cache({
    ttl: 900,
    keyGenerator: (req) => `analytics:${req.user?.id || 'public'}:${req.originalUrl}`
  })
};

module.exports = {
  cache,
  invalidate,
  cacheHelpers,
  cacheConfig,
  initRedis
};
