/**
 * Multi-Country Payment Service
 * Handles payment processing across different countries and payment methods
 */

const mpesaService = require('./mpesaService');
const airtelMoneyService = require('./airtelMoneyService');
const localizationService = require('./localizationService');
const { Payment, PaymentMethod } = require('../models/Payment');

class MultiCountryPaymentService {
  constructor() {
    this.paymentProviders = {
      TZ: {
        mpesa: mpesaService,
        airtel: airtelMoneyService,
        bank_transfer: null // Handled separately
      },
      KE: {
        mpesa: mpesaService,
        bank_transfer: null
      },
      UG: {
        mtn_money: null, // To be implemented
        airtel: airtelMoneyService,
        bank_transfer: null
      },
      RW: {
        mtn_money: null,
        airtel: airtelMoneyService,
        bank_transfer: null
      },
      ZM: {
        airtel: airtelMoneyService,
        mtn_money: null,
        bank_transfer: null
      },
      MW: {
        airtel: airtelMoneyService,
        mtn_money: null,
        bank_transfer: null
      }
    };

    this.transactionLimits = {
      TZ: { daily: 10000000, monthly: 100000000, per_transaction: 5000000 },
      KE: { daily: 300000, monthly: 3000000, per_transaction: 150000 },
      UG: { daily: 50000000, monthly: 500000000, per_transaction: 25000000 },
      RW: { daily: 5000000, monthly: 50000000, per_transaction: 2500000 },
      ZM: { daily: 50000, monthly: 500000, per_transaction: 25000 },
      MW: { daily: 500000, monthly: 5000000, per_transaction: 250000 }
    };
  }

  /**
   * Initiate payment
   */
  async initiatePayment(userId, countryCode, amount, paymentMethod, description) {
    try {
      // Validate country
      const config = await localizationService.getCountryConfig(countryCode);
      if (!config.is_active) {
        throw new Error('Country not active');
      }

      // Validate payment method
      if (!config.payment_methods.includes(paymentMethod)) {
        throw new Error(`Payment method ${paymentMethod} not available in ${countryCode}`);
      }

      // Check transaction limits
      await this.validateTransactionLimits(userId, countryCode, amount);

      // Create payment record
      const payment = new Payment({
        user_id: userId,
        country_code: countryCode,
        amount,
        currency: config.currency,
        payment_method: paymentMethod,
        description,
        status: 'pending'
      });

      await payment.save();

      // Process payment based on method
      let result;
      switch (paymentMethod) {
        case 'mpesa':
          result = await this.processMpesaPayment(userId, amount, description, payment._id);
          break;
        case 'airtel':
          result = await this.processAirtelPayment(userId, amount, description, payment._id);
          break;
        case 'mtn_money':
          result = await this.processMTNPayment(userId, amount, description, payment._id);
          break;
        case 'bank_transfer':
          result = await this.processBankTransfer(userId, amount, description, payment._id);
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      if (result.success) {
        payment.status = 'initiated';
        payment.transaction_id = result.transaction_id;
        await payment.save();
      }

      return {
        success: result.success,
        payment_id: payment._id,
        transaction_id: result.transaction_id,
        message: result.message
      };
    } catch (error) {
      console.error('Initiate payment error:', error);
      throw error;
    }
  }

  /**
   * Process M-Pesa payment
   */
  async processMpesaPayment(userId, amount, description, paymentId) {
    try {
      const result = await mpesaService.initiateSTKPush(
        null, // Phone will be fetched from user
        amount,
        description,
        paymentId.toString()
      );

      return {
        success: result.success,
        transaction_id: result.CheckoutRequestID,
        message: 'M-Pesa payment initiated'
      };
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      throw error;
    }
  }

  /**
   * Process Airtel Money payment
   */
  async processAirtelPayment(userId, amount, description, paymentId) {
    try {
      const result = await airtelMoneyService.initiateCollection(
        null, // Phone will be fetched from user
        amount,
        description,
        paymentId.toString()
      );

      return {
        success: result.success,
        transaction_id: result.transaction_id,
        message: 'Airtel Money payment initiated'
      };
    } catch (error) {
      console.error('Airtel payment error:', error);
      throw error;
    }
  }

  /**
   * Process MTN Money payment
   */
  async processMTNPayment(userId, amount, description, paymentId) {
    try {
      // MTN Money integration to be implemented
      return {
        success: false,
        message: 'MTN Money integration coming soon'
      };
    } catch (error) {
      console.error('MTN payment error:', error);
      throw error;
    }
  }

  /**
   * Process bank transfer
   */
  async processBankTransfer(userId, amount, description, paymentId) {
    try {
      // Generate bank transfer details
      const bankDetails = {
        account_name: 'MkulimaLink Ltd',
        account_number: 'XXXX-XXXX-XXXX-1234',
        bank_name: 'Regional Bank',
        reference: paymentId.toString()
      };

      return {
        success: true,
        transaction_id: paymentId.toString(),
        bank_details: bankDetails,
        message: 'Bank transfer details generated'
      };
    } catch (error) {
      console.error('Bank transfer error:', error);
      throw error;
    }
  }

  /**
   * Validate transaction limits
   */
  async validateTransactionLimits(userId, countryCode, amount) {
    try {
      const limits = this.transactionLimits[countryCode];
      if (!limits) {
        throw new Error('Transaction limits not defined for country');
      }

      // Check per-transaction limit
      if (amount > limits.per_transaction) {
        throw new Error(`Amount exceeds per-transaction limit of ${limits.per_transaction}`);
      }

      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dailyTotal = await Payment.aggregate([
        {
          $match: {
            user_id: userId,
            country_code: countryCode,
            status: 'completed',
            created_at: { $gte: today }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const dailyAmount = dailyTotal[0]?.total || 0;
      if (dailyAmount + amount > limits.daily) {
        throw new Error(`Daily limit exceeded. Remaining: ${limits.daily - dailyAmount}`);
      }

      // Check monthly limit
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthlyTotal = await Payment.aggregate([
        {
          $match: {
            user_id: userId,
            country_code: countryCode,
            status: 'completed',
            created_at: { $gte: monthStart }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const monthlyAmount = monthlyTotal[0]?.total || 0;
      if (monthlyAmount + amount > limits.monthly) {
        throw new Error(`Monthly limit exceeded. Remaining: ${limits.monthly - monthlyAmount}`);
      }

      return true;
    } catch (error) {
      console.error('Validate transaction limits error:', error);
      throw error;
    }
  }

  /**
   * Convert amount to local currency
   */
  async convertToLocalCurrency(amount, fromCurrency, countryCode) {
    try {
      const config = await localizationService.getCountryConfig(countryCode);
      const converted = await localizationService.convertCurrency(
        amount,
        fromCurrency,
        config.currency
      );

      return {
        original_amount: amount,
        original_currency: fromCurrency,
        converted_amount: converted,
        converted_currency: config.currency
      };
    } catch (error) {
      console.error('Convert currency error:', error);
      throw error;
    }
  }

  /**
   * Get available payment methods for country
   */
  async getAvailablePaymentMethods(countryCode) {
    try {
      const config = await localizationService.getCountryConfig(countryCode);
      return config.payment_methods;
    } catch (error) {
      console.error('Get payment methods error:', error);
      throw error;
    }
  }

  /**
   * Get transaction limits for country
   */
  getTransactionLimits(countryCode) {
    return this.transactionLimits[countryCode] || null;
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      return {
        payment_id: payment._id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        payment_method: payment.payment_method,
        transaction_id: payment.transaction_id,
        created_at: payment.created_at,
        completed_at: payment.completed_at
      };
    } catch (error) {
      console.error('Get payment status error:', error);
      throw error;
    }
  }

  /**
   * Handle payment callback
   */
  async handlePaymentCallback(paymentMethod, callbackData) {
    try {
      let payment;

      if (paymentMethod === 'mpesa') {
        payment = await this.handleMpesaCallback(callbackData);
      } else if (paymentMethod === 'airtel') {
        payment = await this.handleAirtelCallback(callbackData);
      }

      return payment;
    } catch (error) {
      console.error('Handle payment callback error:', error);
      throw error;
    }
  }

  /**
   * Handle M-Pesa callback
   */
  async handleMpesaCallback(callbackData) {
    try {
      const paymentId = callbackData.reference;
      const payment = await Payment.findById(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (callbackData.success) {
        payment.status = 'completed';
        payment.transaction_id = callbackData.transaction_id;
        payment.completed_at = new Date();
      } else {
        payment.status = 'failed';
        payment.error_message = callbackData.error_message;
      }

      await payment.save();
      return payment;
    } catch (error) {
      console.error('Handle M-Pesa callback error:', error);
      throw error;
    }
  }

  /**
   * Handle Airtel callback
   */
  async handleAirtelCallback(callbackData) {
    try {
      const paymentId = callbackData.reference;
      const payment = await Payment.findById(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (callbackData.success) {
        payment.status = 'completed';
        payment.transaction_id = callbackData.transaction_id;
        payment.completed_at = new Date();
      } else {
        payment.status = 'failed';
        payment.error_message = callbackData.error_message;
      }

      await payment.save();
      return payment;
    } catch (error) {
      console.error('Handle Airtel callback error:', error);
      throw error;
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId, countryCode, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const payments = await Payment.find({
        user_id: userId,
        country_code: countryCode
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

      const total = await Payment.countDocuments({
        user_id: userId,
        country_code: countryCode
      });

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get payment history error:', error);
      throw error;
    }
  }
}

module.exports = new MultiCountryPaymentService();



