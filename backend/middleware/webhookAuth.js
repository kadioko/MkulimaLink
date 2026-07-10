const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Validate webhook requests using a shared API key or HMAC signature.
 * Falls back to checking X-Webhook-Secret against WEBHOOK_SECRET env var.
 */
function validateWebhook({ secret = process.env.WEBHOOK_SECRET, signatureHeader = 'x-webhook-signature' } = {}) {
  return (req, res, next) => {
    if (!secret) {
      logger.warn('Webhook validation skipped: WEBHOOK_SECRET not configured');
      return next();
    }

    const providedSignature = req.headers[signatureHeader] || req.headers[signatureHeader.toLowerCase()];
    const providedSecret = req.headers['x-webhook-secret'];

    // Simple shared secret validation
    if (providedSecret && providedSecret === secret) {
      return next();
    }

    // HMAC signature validation
    if (providedSignature) {
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(providedSignature),
        Buffer.from(expectedSignature)
      );

      if (isValid) {
        return next();
      }
    }

    logger.warn('Invalid webhook signature', {
      ip: req.ip,
      path: req.originalUrl,
      requestId: req.id
    });
    return res.status(401).json({ success: false, message: 'Unauthorized webhook request' });
  };
}

module.exports = { validateWebhook };
