const { sanitizeObject } = require('./backend/middleware/sanitize');
console.log(JSON.stringify(sanitizeObject({ data: { $ne: null, title: '<b>Hello</b>' } }), null, 2));
