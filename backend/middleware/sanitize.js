/**
 * Lightweight input sanitization middleware
 * - Strips MongoDB operators from keys and string values
 * - Encodes HTML entities in strings to mitigate reflected XSS
 */

const htmlEntities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

function escapeHtml(str) {
  return str.replace(/[&<>"'/]/g, (char) => htmlEntities[char]);
}

function sanitizeValue(value) {
  if (typeof value === 'string') {
    const noLeadingDollar = value.startsWith('$') ? value.slice(1) : value;
    return escapeHtml(noLeadingDollar).trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const safeKey = key.startsWith('$') ? key.slice(1) : key;
    const safeKeyNoDots = safeKey.replace(/\./g, '_');
    result[safeKeyNoDots] = sanitizeValue(value);
  }
  return result;
}

const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
};

module.exports = {
  sanitizeInput,
  sanitizeObject,
  sanitizeValue
};
