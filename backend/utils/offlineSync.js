const NodeCache = require('node-cache');
const offlineCache = new NodeCache({ stdTTL: 86400 });

const offlineSyncManager = {
  queueAction: async (userId, action) => {
    const userQueue = offlineCache.get(`queue_${userId}`) || [];
    userQueue.push({
      ...action,
      timestamp: new Date(),
      id: `${userId}_${Date.now()}_${Math.random()}`
    });
    offlineCache.set(`queue_${userId}`, userQueue);
    return userQueue.length;
  },

  processQueue: async (userId) => {
    const userQueue = offlineCache.get(`queue_${userId}`) || [];
    const results = [];

    for (const action of userQueue) {
      try {
        let result;
        switch (action.type) {
          case 'create_product':
            const Product = require('../models/Product');
            result = await Product.create(action.data);
            break;
          case 'update_product':
            const ProductUpdate = require('../models/Product');
            result = await ProductUpdate.findByIdAndUpdate(action.data.id, action.data.updates);
            break;
          case 'create_transaction':
            const Transaction = require('../models/Transaction');
            result = await Transaction.create(action.data);
            break;
          default:
            result = { error: 'Unknown action type' };
        }
        results.push({ action: action.id, status: 'success', result });
      } catch (error) {
        results.push({ action: action.id, status: 'failed', error: error.message });
      }
    }

    offlineCache.del(`queue_${userId}`);
    return results;
  },

  getQueueStatus: (userId) => {
    const userQueue = offlineCache.get(`queue_${userId}`) || [];
    return {
      pending: userQueue.length,
      actions: userQueue
    };
  },

  cacheData: (key, data, ttl = 3600) => {
    offlineCache.set(key, data, ttl);
  },

  getCachedData: (key) => {
    return offlineCache.get(key);
  }
};

module.exports = offlineSyncManager;



