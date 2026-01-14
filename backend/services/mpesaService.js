/**
 * MkulimaLink M-Pesa Payment Integration
 * Handles mobile money payments using Safaricom's M-Pesa API
 */

const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// M-Pesa API Configuration
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortcode: process.env.MPESA_SHORTCODE,
  passkey: process.env.MPESA_PASSKEY,
  baseUrl: process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke',
  lipaNaMpesaOnline: '/mpesa/stkpush/v1/processrequest',
  lipaNaMpesaOnlineQuery: '/mpesa/stkpushquery/v1/query',
  c2bRegister: '/mpesa/c2b/v1/register',
  c2bSimulate: '/mpesa/c2b/v1/simulate', // Sandbox only
  b2cPayment: '/mpesa/b2c/v1/paymentrequest',
  accountBalance: '/mpesa/accountbalance/v1/query',
  reversal: '/mpesa/reversal/v1/request'
};

class MpesaService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get OAuth access token from M-Pesa
   */
  async getAccessToken() {
    try {
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');

      const response = await axios.get(`${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      this.accessToken = response.data.access_token;
      // Token expires in 3600 seconds (1 hour)
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min early

      console.log('M-Pesa access token obtained successfully');
      return this.accessToken;

    } catch (error) {
      console.error('Failed to get M-Pesa access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with M-Pesa');
    }
  }

  /**
   * Initiate STK Push (Customer Pay Bill Online)
   * @param {Object} paymentData - Payment details
   */
  async initiateSTKPush(paymentData) {
    try {
      const {
        phoneNumber,
        amount,
        accountReference,
        transactionDesc = 'MkulimaLink Payment',
        callbackUrl = process.env.MPESA_CALLBACK_URL
      } = paymentData;

      // Validate phone number format (should start with 254)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Generate timestamp and password
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      const payload = {
        BusinessShortCode: MPESA_CONFIG.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: MPESA_CONFIG.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
      };

      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${MPESA_CONFIG.baseUrl}${MPESA_CONFIG.lipaNaMpesaOnline}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Store transaction details for tracking
      await this.storeTransaction({
        merchantRequestId: response.data.MerchantRequestID,
        checkoutRequestId: response.data.CheckoutRequestID,
        phoneNumber: formattedPhone,
        amount: amount,
        accountReference: accountReference,
        status: 'pending',
        type: 'stk_push'
      });

      return {
        success: true,
        merchantRequestId: response.data.MerchantRequestID,
        checkoutRequestId: response.data.CheckoutRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        customerMessage: response.data.CustomerMessage
      };

    } catch (error) {
      console.error('STK Push failed:', error.response?.data || error.message);
      throw new Error(`STK Push failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  /**
   * Query STK Push payment status
   */
  async querySTKPushStatus(checkoutRequestId) {
    try {
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      const payload = {
        BusinessShortCode: MPESA_CONFIG.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${MPESA_CONFIG.baseUrl}${MPESA_CONFIG.lipaNaMpesaOnlineQuery}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        merchantRequestId: response.data.MerchantRequestID,
        checkoutRequestId: response.data.CheckoutRequestID,
        resultCode: response.data.ResultCode,
        resultDesc: response.data.ResultDesc
      };

    } catch (error) {
      console.error('STK Push query failed:', error.response?.data || error.message);
      throw new Error(`STK Push query failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  /**
   * Handle M-Pesa callback
   */
  async handleCallback(callbackData) {
    try {
      console.log('M-Pesa callback received:', JSON.stringify(callbackData, null, 2));

      const { Body } = callbackData;

      if (!Body || !Body.stkCallback) {
        throw new Error('Invalid callback data structure');
      }

      const {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
        CallbackMetadata
      } = Body.stkCallback;

      // Extract payment details from callback metadata
      let paymentDetails = {};
      if (CallbackMetadata && CallbackMetadata.Item) {
        paymentDetails = CallbackMetadata.Item.reduce((acc, item) => {
          acc[item.Name] = item.Value;
          return acc;
        }, {});
      }

      const transactionData = {
        merchantRequestId: MerchantRequestID,
        checkoutRequestId: CheckoutRequestID,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        mpesaReceiptNumber: paymentDetails.MpesaReceiptNumber || null,
        transactionDate: paymentDetails.TransactionDate || null,
        phoneNumber: paymentDetails.PhoneNumber || null,
        amount: paymentDetails.Amount || null,
        status: ResultCode === 0 ? 'completed' : 'failed',
        updatedAt: new Date()
      };

      // Update transaction in database
      await this.updateTransaction(transactionData);

      // Process successful payment
      if (ResultCode === 0) {
        await this.processSuccessfulPayment(transactionData);
      }

      return { success: true, message: 'Callback processed successfully' };

    } catch (error) {
      console.error('Callback processing failed:', error);
      throw error;
    }
  }

  /**
   * Register C2B URLs (Customer to Business)
   */
  async registerC2BUrls() {
    try {
      const payload = {
        ShortCode: MPESA_CONFIG.shortcode,
        ResponseType: 'Completed',
        ConfirmationURL: `${process.env.BASE_URL}/api/payments/mpesa/c2b/confirmation`,
        ValidationURL: `${process.env.BASE_URL}/api/payments/mpesa/c2b/validation`
      };

      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${MPESA_CONFIG.baseUrl}${MPESA_CONFIG.c2bRegister}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('C2B URLs registered successfully:', response.data);
      return response.data;

    } catch (error) {
      console.error('C2B URL registration failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Process B2C payment (Business to Customer)
   */
  async initiateB2CPayment(paymentData) {
    try {
      const {
        phoneNumber,
        amount,
        remarks = 'MkulimaLink Payment',
        occassion = 'Payment'
      } = paymentData;

      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const payload = {
        InitiatorName: process.env.MPESA_INITIATOR_NAME,
        SecurityCredential: this.generateSecurityCredential(),
        CommandID: 'BusinessPayment',
        Amount: Math.round(amount),
        PartyA: MPESA_CONFIG.shortcode,
        PartyB: formattedPhone,
        Remarks: remarks,
        QueueTimeOutURL: `${process.env.BASE_URL}/api/payments/mpesa/b2c/timeout`,
        ResultURL: `${process.env.BASE_URL}/api/payments/mpesa/b2c/result`,
        Occassion: occassion
      };

      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${MPESA_CONFIG.baseUrl}${MPESA_CONFIG.b2cPayment}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        originatorConversationID: response.data.OriginatorConversationID,
        conversationID: response.data.ConversationID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription
      };

    } catch (error) {
      console.error('B2C payment failed:', error.response?.data || error.message);
      throw new Error(`B2C payment failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  /**
   * Query account balance
   */
  async queryAccountBalance() {
    try {
      const payload = {
        Initiator: process.env.MPESA_INITIATOR_NAME,
        SecurityCredential: this.generateSecurityCredential(),
        CommandID: 'AccountBalance',
        PartyA: MPESA_CONFIG.shortcode,
        IdentifierType: '4', // Shortcode
        Remarks: 'Account Balance Query',
        QueueTimeOutURL: `${process.env.BASE_URL}/api/payments/mpesa/balance/timeout`,
        ResultURL: `${process.env.BASE_URL}/api/payments/mpesa/balance/result`
      };

      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${MPESA_CONFIG.baseUrl}${MPESA_CONFIG.accountBalance}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;

    } catch (error) {
      console.error('Account balance query failed:', error.response?.data || error.message);
      throw error;
    }
  }

  // Helper methods

  generateTimestamp() {
    return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  }

  generatePassword(timestamp) {
    const str = MPESA_CONFIG.shortcode + MPESA_CONFIG.passkey + timestamp;
    return Buffer.from(str).toString('base64');
  }

  generateSecurityCredential() {
    // In production, this should be encrypted properly
    const credential = process.env.MPESA_INITIATOR_PASSWORD;
    return Buffer.from(credential).toString('base64');
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

    // Ensure it starts with 254
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }

    return cleaned;
  }

  async storeTransaction(transactionData) {
    // This should integrate with your database
    // For now, we'll use a placeholder
    console.log('Storing transaction:', transactionData);
    // TODO: Implement database storage
  }

  async updateTransaction(transactionData) {
    // This should integrate with your database
    console.log('Updating transaction:', transactionData);
    // TODO: Implement database update
  }

  async processSuccessfulPayment(paymentData) {
    // Handle successful payment processing
    console.log('Processing successful payment:', paymentData);
    // TODO: Update order status, send notifications, etc.
  }
}

module.exports = new MpesaService();
