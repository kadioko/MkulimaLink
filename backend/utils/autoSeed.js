const mongoose = require('mongoose');
const axios = require('axios');
const logger = require('./logger');

const API_BASE = process.env.SEED_API_BASE || `http://localhost:${process.env.PORT || 5000}`;
const SEED_SECRET = process.env.SEED_SECRET || 'mkulima-seed-2024';

/**
 * Auto-run seed if the database is empty (no users).
 * Only runs in production if SEED_ON_START is enabled, or always in development.
 */
async function autoSeedOnEmpty() {
  const shouldAutoSeed = process.env.SEED_ON_START === 'true' || process.env.NODE_ENV !== 'production';
  if (!shouldAutoSeed) {
    logger.info('Auto-seed disabled. Set SEED_ON_START=true to enable.');
    return;
  }

  try {
    const User = mongoose.model('User');
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      logger.info(`Database already has ${userCount} users, skipping auto-seed`);
      return;
    }

    logger.info('Database appears empty. Running seed...');
    const response = await axios.post(
      `${API_BASE}/api/seed/run`,
      { secret: SEED_SECRET },
      { timeout: 120000 }
    );
    logger.info('Auto-seed completed', { results: response.data.results });
  } catch (error) {
    logger.error('Auto-seed failed:', error.message);
  }
}

module.exports = { autoSeedOnEmpty };
