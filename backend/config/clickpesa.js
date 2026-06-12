module.exports = {
  clientId: process.env.CLICKPESA_CLIENT_ID,
  apiKey: process.env.CLICKPESA_API_KEY,
  baseUrl: process.env.CLICKPESA_BASE_URL || 'https://api.clickpesa.com',
  
  // Supported payment methods
  paymentMethods: {
    TIGOPESA: 'tigopesa',
    HALOPESA: 'halopesa',
    AIRTEL_MONEY: 'airtel_money'
  },

  // Payment status codes
  statusCodes: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SUCCESS: 'success',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },

  // API endpoints
  endpoints: {
    INITIATE_PAYMENT: '/v1/payment/initiate',
    CHECK_STATUS: '/v1/payment/status',
    REFUND: '/v1/payment/refund',
    CALLBACK: '/v1/payment/callback'
  },

  // Timeout settings (in milliseconds)
  timeout: 30000,

  // Retry settings
  maxRetries: 3,
  retryDelay: 1000
};
