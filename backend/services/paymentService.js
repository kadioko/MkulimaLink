const axios = require('axios');
const crypto = require('crypto');
const clickpesaConfig = require('../config/clickpesa');

class PaymentService {
  constructor() {
    this.client = axios.create({
      baseURL: clickpesaConfig.baseUrl,
      timeout: clickpesaConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clickpesaConfig.apiKey}`
      }
    });
  }

  validateConfig() {
    if (!clickpesaConfig.clientId || !clickpesaConfig.apiKey) {
      throw new Error('ClickPesa credentials are not configured');
    }
  }

  generateSignature(data) {
    this.validateConfig();
    const message = JSON.stringify(data);
    return crypto
      .createHmac('sha256', clickpesaConfig.apiKey)
      .update(message)
      .digest('hex');
  }

  async initiatePayment(paymentData) {
    try {
      const {
        amount,
        phoneNumber,
        paymentMethod,
        orderId,
        description,
        callbackUrl
      } = paymentData;

      if (!amount || !phoneNumber || !paymentMethod || !orderId) {
        throw new Error('Missing required payment fields');
      }

      const payload = {
        client_id: clickpesaConfig.clientId,
        amount: Math.round(amount),
        phone_number: phoneNumber.replace(/\D/g, ''),
        payment_method: paymentMethod,
        order_id: orderId,
        description: description || 'MkulimaLink Purchase',
        callback_url: callbackUrl,
        timestamp: new Date().toISOString()
      };

      payload.signature = this.generateSignature(payload);

      const response = await this.client.post(
        clickpesaConfig.endpoints.INITIATE_PAYMENT,
        payload
      );

      return {
        success: true,
        transactionId: response.data.transaction_id,
        status: response.data.status,
        message: response.data.message
      };
    } catch (error) {
      console.error('Payment initiation error:', error);
      throw new Error(`Payment initiation failed: ${error.message}`);
    }
  }

  async checkPaymentStatus(transactionId) {
    try {
      const payload = {
        client_id: clickpesaConfig.clientId,
        transaction_id: transactionId,
        timestamp: new Date().toISOString()
      };

      payload.signature = this.generateSignature(payload);

      const response = await this.client.post(
        clickpesaConfig.endpoints.CHECK_STATUS,
        payload
      );

      return {
        transactionId: response.data.transaction_id,
        status: response.data.status,
        amount: response.data.amount,
        phoneNumber: response.data.phone_number,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      console.error('Status check error:', error);
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  async processRefund(transactionId, amount, reason) {
    try {
      const payload = {
        client_id: clickpesaConfig.clientId,
        transaction_id: transactionId,
        amount: Math.round(amount),
        reason: reason || 'Customer request',
        timestamp: new Date().toISOString()
      };

      payload.signature = this.generateSignature(payload);

      const response = await this.client.post(
        clickpesaConfig.endpoints.REFUND,
        payload
      );

      return {
        success: true,
        refundId: response.data.refund_id,
        status: response.data.status,
        message: response.data.message
      };
    } catch (error) {
      console.error('Refund error:', error);
      throw new Error(`Refund processing failed: ${error.message}`);
    }
  }

  verifyCallback(callbackData) {
    try {
      const { signature, ...data } = callbackData;
      const expectedSignature = this.generateSignature(data);
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Callback verification error:', error);
      return false;
    }
  }

  formatPhoneNumber(phone) {
    // Convert various formats to standard +255XXXXXXXXX
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('255')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+255${cleaned.substring(1)}`;
    } else if (cleaned.length === 9) {
      return `+255${cleaned}`;
    }
    
    return `+${cleaned}`;
  }

  getPaymentMethodLabel(method) {
    const labels = {
      [clickpesaConfig.paymentMethods.TIGOPESA]: 'TigoPesa',
      [clickpesaConfig.paymentMethods.HALOPESA]: 'HaloPesa',
      [clickpesaConfig.paymentMethods.AIRTEL_MONEY]: 'Airtel Money'
    };
    return labels[method] || method;
  }
}

module.exports = new PaymentService();
