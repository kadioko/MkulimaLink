const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('X-Request-ID', req.id);
  req.logger = logger.child({ requestId: req.id });
  next();
};

module.exports = requestId;
