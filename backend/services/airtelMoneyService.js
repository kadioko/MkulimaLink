/**
 * MkulimaLink Airtel Money Payment Integration
 * Handles mobile money payments using Airtel Africa's payment API
 */

const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Airtel Money API Configuration
const AIRTEL_CONFIG = {
  clientId: process.env.AIRTEL_CLIENT_ID,
  clientSecret: process.env.AIRTEL_CLIENT_SECRET,
  baseUrl: process.env.AIRTEL_ENV === 'production'
    ? 'https://openapi.airtel.africa'
    : 'https://sandbox.airtel.africa',
  collectionEndpoint: '/merchant/v1/payments/',
  disbursementEndpoint: '/standard/v1/disbursements/',
  authEndpoint: '/auth/oauth2/token',
  country: process.env.AIRTEL_COUNTRY || 'KE', // KE, UG, TZ, RW
  currency: process.env.AIRTEL_CURRENCY || 'KES'
};

class AirtelMoneyService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get OAuth access token from Airtel Money
   */
  async getAccessToken() {
    try {
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const auth = Buffer.from(`${AIRTEL_CONFIG.clientId}:${AIRTEL_CONFIG.clientSecret}`).toString('base64');

      const response = await axios.post(`${AIRTEL_CONFIG.baseUrl}${AIRTEL_CONFIG.authEndpoint}`, {
        grant_type: 'client_credentials'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        }
      });

      this.accessToken = response.data.access_token;
      // Token expires in 3600 seconds (1 hour)
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min early

      console.log('Airtel Money access token obtained successfully');
      return this.accessToken;

    } catch (error) {
      console.error('Failed to get Airtel Money access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Airtel Money');
    }
  }

  /**
   * Initiate Airtel Money collection (customer payment)
   * @param {Object} paymentData - Payment details
   */
  async initiateCollection(paymentData) {
    try {
      const {
        phoneNumber,
        amount,
        reference,
        transactionDesc = 'MkulimaLink Payment'
      } = paymentData;

      // Format phone number for Airtel
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Generate unique transaction ID
      const transactionId = uuidv4();

      const payload = {
        reference: reference || transactionId,
        subscriber: {
          country: AIRTEL_CONFIG.country,
          currency: AIRTEL_CONFIG.currency,
          msisdn: formattedPhone
        },
        transaction: {
          amount: Math.round(amount),
          country: AIRTEL_CONFIG.country,
          currency: AIRTEL_CONFIG.currency,
          id: transactionId
        }
      };

      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${AIRTEL_CONFIG.baseUrl}${AIRTEL_CONFIG.collectionEndpoint}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Country': AIRTEL_CONFIG.country,
            'X-Currency': AIRTEL_CONFIG.currency
          }
        }
      );

      // Store transaction details for tracking
      await this.storeTransaction({
        transactionId,
        phoneNumber: formattedPhone,
        amount,
        reference: reference || transactionId,
        type: 'collection',
        status: 'pending'
      });

      return {
        success: true,
        transactionId,
        status: response.data.status,
        message: response.data.message || 'Payment initiated successfully'
      };

    } catch (error) {
      console.error('Airtel Money collection failed:', error.response?.data || error.message);
      throw new Error(`Collection failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Initiate Airtel Money disbursement (payout)
   * @param {Object} payoutData - Payout details
   */
  async initiateDisbursement(payoutData) {
    try {
      const {
        phoneNumber,
        amount,
        reference,
        description = 'MkulimaLink Payout'
      } = payoutData;

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const transactionId = uuidv4();

      const payload = {
        payee: {
          msisdn: formattedPhone,
          wallet_type: 'AIRTEL'
        },
        reference: reference || transactionId,
        pin: this.generatePIN(), // PIN for disbursement
        transaction: {
          amount: Math.round(amount),
          currency: AIRTEL_CONFIG.currency,
          id: transactionId
        }
      };

      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${AIRTEL_CONFIG.baseUrl}${AIRTEL_CONFIG.disbursementEndpoint}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Country': AIRTEL_CONFIG.country,
            'X-Currency': AIRTEL_CONFIG.currency
          }
        }
      );

      // Store transaction details
      await this.storeTransaction({
        transactionId,
        phoneNumber: formattedPhone,
        amount,
        reference: reference || transactionId,
        type: 'disbursement',
        status: 'pending'
      });

      return {
        success: true,
        transactionId,
        status: response.data.status,
        message: response.data.message || 'Payout initiated successfully'
      };

    } catch (error) {
      console.error('Airtel Money disbursement failed:', error.response?.data || error.message);
      throw new Error(`Disbursement failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Check transaction status
   * @param {string} transactionId - Transaction ID to check
   */
  async checkTransactionStatus(transactionId) {
    try {
      const accessToken = await this.getAccessToken();

      // For collections
      let response = await axios.get(
        `${AIRTEL_CONFIG.baseUrl}${AIRTEL_CONFIG.collectionEndpoint}${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        return {
          transactionId,
          status: response.data.status,
          amount: response.data.transaction?.amount,
          currency: response.data.transaction?.currency,
          message: response.data.message
        };
      }

      // For disbursements
      response = await axios.get(
        `${AIRTEL_CONFIG.baseUrl}${AIRTEL_CONFIG.disbursementEndpoint}${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        transactionId,
        status: response.data.status,
        amount: response.data.transaction?.amount,
        currency: response.data.transaction?.currency,
        message: response.data.message
      };

    } catch (error) {
      console.error('Transaction status check failed:', error.response?.data || error.message);
      throw new Error(`Status check failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Handle Airtel Money callback
   */
  async handleCallback(callbackData) {
    try {
      console.log('Airtel Money callback received:', JSON.stringify(callbackData, null, 2));

      const { transaction } = callbackData;

      if (!transaction || !transaction.id) {
        throw new Error('Invalid callback data structure');
      }

      const transactionData = {
        transactionId: transaction.id,
        status: transaction.status || 'unknown',
        amount: transaction.amount,
        currency: transaction.currency,
        message: transaction.message,
        updatedAt: new Date()
      };

      // Update transaction in database
      await this.updateTransaction(transactionData);

      // Process successful transactions
      if (transaction.status === 'SUCCESS' || transaction.status === 'success') {
        await this.processSuccessfulTransaction(transactionData);
      }

      return { success: true, message: 'Callback processed successfully' };

    } catch (error) {
      console.error('Callback processing failed:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance() {
    try {
      const accessToken = await this.getAccessToken();

      // Note: Airtel Money doesn't have a direct balance API
      // This would need to be implemented based on their specific requirements
      // For now, return a placeholder
      return {
        available_balance: 0, // Would be fetched from Airtel
        currency: AIRTEL_CONFIG.currency,
        last_updated: new Date()
      };

    } catch (error) {
      console.error('Account balance check failed:', error.response?.data || error.message);
      throw new Error(`Balance check failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Helper methods

  generatePIN() {
    // Generate a 4-digit PIN for disbursement
    // In production, this should be securely managed
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  formatPhoneNumber(phoneNumber) {
    // Remove any spaces, hyphens, or brackets
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Remove country code if present
    if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(4);
    } else if (cleaned.startsWith('254')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Ensure it starts with country code
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }

    return cleaned;
  }

  async storeTransaction(transactionData) {
    // This should integrate with your database
    // For now, we'll use a placeholder
    console.log('Storing Airtel transaction:', transactionData);
    // TODO: Implement database storage
  }

  async updateTransaction(transactionData) {
    // This should integrate with your database
    console.log('Updating Airtel transaction:', transactionData);
    // TODO: Implement database update
  }

  async processSuccessfulTransaction(transactionData) {
    // Handle successful transaction processing
    console.log('Processing successful Airtel transaction:', transactionData);
    // TODO: Update order status, send notifications, etc.
  }
}

module.exports = new AirtelMoneyService();
