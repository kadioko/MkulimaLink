/**
 * Wallet Service
 * Handles digital wallet operations including balance management, transactions, and security
 */

const { Wallet, WalletTransaction } = require('../models/Wallet');
const mpesaService = require('./mpesaService');
const airtelMoneyService = require('./airtelMoneyService');
const crypto = require('crypto');

class WalletService {
  /**
   * Create or get user wallet
   */
  async getWallet(userId) {
    return await Wallet.getByUser(userId);
  }

  /**
   * Top up wallet balance
   */
  async topUpWallet(userId, amount, paymentMethod = 'mpesa', phoneNumber = null) {
    const wallet = await this.getWallet(userId);

    if (amount < 100) {
      throw new Error('Minimum top-up amount is KES 100');
    }

    if (amount > 150000) {
      throw new Error('Maximum top-up amount is KES 150,000');
    }

    let paymentResult;

    if (paymentMethod === 'mpesa') {
      if (!phoneNumber) {
        throw new Error('Phone number required for M-Pesa payment');
      }

      paymentResult = await mpesaService.initiateSTKPush({
        phoneNumber,
        amount,
        accountReference: `WALLET_TOPUP_${userId}_${Date.now()}`,
        transactionDesc: `Wallet top-up of KES ${amount}`,
        userId
      });
    } else if (paymentMethod === 'airtel') {
      if (!phoneNumber) {
        throw new Error('Phone number required for Airtel Money payment');
      }

      paymentResult = await airtelMoneyService.initiateCollection({
        phoneNumber,
        amount,
        reference: `WALLET_TOPUP_${userId}_${Date.now()}`,
        transactionDesc: `Wallet top-up of KES ${amount}`
      });
    } else {
      throw new Error('Unsupported payment method');
    }

    // Create pending transaction record
    const transaction = new WalletTransaction({
      type: 'credit',
      amount,
      currency: 'KES',
      balance_before: wallet.balance,
      balance_after: wallet.balance, // Will be updated when payment completes
      description: `Wallet top-up via ${paymentMethod.toUpperCase()}`,
      reference: paymentResult.checkoutRequestId || paymentResult.transactionId,
      payment_method: paymentMethod,
      status: 'pending'
    });

    await transaction.save();

    return {
      success: true,
      transactionId: transaction._id,
      paymentReference: paymentResult.checkoutRequestId || paymentResult.transactionId,
      message: 'Top-up initiated successfully'
    };
  }

  /**
   * Debit wallet (for payments)
   */
  async debitWallet(userId, amount, description, reference = null) {
    const wallet = await this.getWallet(userId);

    if (wallet.status !== 'active') {
      throw new Error('Wallet is not active');
    }

    if (!wallet.kyc_verified && amount > 50000) {
      throw new Error('KYC verification required for transactions over KES 50,000');
    }

    return await wallet.addTransaction({
      type: 'debit',
      amount,
      description,
      reference,
      payment_method: 'wallet'
    });
  }

  /**
   * Credit wallet (from payments received)
   */
  async creditWallet(userId, amount, description, reference = null, paymentMethod = 'wallet') {
    const wallet = await this.getWallet(userId);
    return await wallet.addTransaction({
      type: 'credit',
      amount,
      description,
      reference,
      payment_method: paymentMethod
    });
  }

  /**
   * Transfer funds between wallets
   */
  async transferFunds(fromUserId, toUserId, amount, description = 'Wallet transfer') {
    if (fromUserId === toUserId) {
      throw new Error('Cannot transfer to the same wallet');
    }

    if (amount < 100) {
      throw new Error('Minimum transfer amount is KES 100');
    }

    const fromWallet = await this.getWallet(fromUserId);
    const toWallet = await this.getWallet(toUserId);

    const session = await Wallet.startSession();
    session.startTransaction();

    try {
      const reference = `TRANSFER_${fromUserId}_${toUserId}_${Date.now()}`;

      // Debit sender
      const debitTransaction = await fromWallet.addTransaction({
        type: 'debit',
        amount,
        description: `Transfer to ${toUserId}: ${description}`,
        reference,
        payment_method: 'wallet_transfer'
      });

      // Credit receiver
      const creditTransaction = await toWallet.addTransaction({
        type: 'credit',
        amount,
        description: `Transfer from ${fromUserId}: ${description}`,
        reference,
        payment_method: 'wallet_transfer'
      });

      await session.commitTransaction();

      return {
        success: true,
        debitTransaction,
        creditTransaction,
        message: 'Transfer completed successfully'
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Set wallet PIN
   */
  async setWalletPin(userId, pin) {
    const wallet = await this.getWallet(userId);

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      throw new Error('PIN must be exactly 4 digits');
    }

    // Hash the PIN for security
    const hashedPin = this.hashPin(pin);

    wallet.pin = hashedPin;
    wallet.pin_attempts = 0;
    wallet.pin_locked_until = null;

    await wallet.save();

    return { success: true, message: 'PIN set successfully' };
  }

  /**
   * Verify wallet PIN
   */
  async verifyWalletPin(userId, pin) {
    const wallet = await this.getWallet(userId);

    if (!wallet.pin) {
      throw new Error('No PIN set for this wallet');
    }

    const hashedPin = this.hashPin(pin);
    return await wallet.verifyPin(hashedPin);
  }

  /**
   * Change wallet PIN
   */
  async changeWalletPin(userId, oldPin, newPin) {
    // Verify old PIN
    await this.verifyWalletPin(userId, oldPin);

    // Set new PIN
    return await this.setWalletPin(userId, newPin);
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId) {
    const wallet = await this.getWallet(userId);

    return {
      balance: wallet.balance,
      available_balance: wallet.available_balance,
      currency: wallet.currency,
      daily_used: wallet.daily_used,
      daily_limit: wallet.daily_limit,
      monthly_used: wallet.monthly_used,
      monthly_limit: wallet.monthly_limit,
      kyc_verified: wallet.kyc_verified
    };
  }

  /**
   * Get wallet transaction history
   */
  async getTransactionHistory(userId, page = 1, limit = 20, type = null, startDate = null, endDate = null) {
    const skip = (page - 1) * limit;

    let filter = { user: userId };

    if (type) {
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const transactions = await WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('related_transaction');

    const total = await WalletTransaction.countDocuments(filter);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Set wallet limits
   */
  async setWalletLimits(userId, limits) {
    const wallet = await this.getWallet(userId);

    if (limits.daily_limit) {
      wallet.daily_limit = Math.max(1000, Math.min(200000, limits.daily_limit));
    }

    if (limits.monthly_limit) {
      wallet.monthly_limit = Math.max(10000, Math.min(2000000, limits.monthly_limit));
    }

    await wallet.save();

    return {
      success: true,
      daily_limit: wallet.daily_limit,
      monthly_limit: wallet.monthly_limit
    };
  }

  /**
   * Configure auto top-up
   */
  async configureAutoTopup(userId, config) {
    const wallet = await this.getWallet(userId);

    wallet.auto_topup = {
      enabled: config.enabled || false,
      threshold: Math.max(500, config.threshold || 1000),
      amount: Math.max(1000, config.amount || 5000),
      payment_method: config.payment_method || 'mpesa'
    };

    await wallet.save();

    return {
      success: true,
      auto_topup: wallet.auto_topup
    };
  }

  /**
   * Process auto top-up if needed
   */
  async processAutoTopup(userId) {
    const wallet = await this.getWallet(userId);

    if (!wallet.auto_topup.enabled) {
      return { processed: false, message: 'Auto top-up not enabled' };
    }

    if (wallet.balance >= wallet.auto_topup.threshold) {
      return { processed: false, message: 'Balance above threshold' };
    }

    // Get user's phone number from user model (assuming it's stored there)
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user || !user.phoneNumber) {
      return { processed: false, message: 'User phone number not available' };
    }

    // Initiate top-up
    const result = await this.topUpWallet(
      userId,
      wallet.auto_topup.amount,
      wallet.auto_topup.payment_method,
      user.phoneNumber
    );

    return {
      processed: true,
      message: 'Auto top-up initiated',
      result
    };
  }

  /**
   * Process payment completion (called by payment callbacks)
   */
  async processPaymentCompletion(userId, paymentReference, amount, paymentMethod) {
    const wallet = await this.getWallet(userId);

    // Find the pending transaction
    const pendingTransaction = await WalletTransaction.findOne({
      reference: paymentReference,
      status: 'pending',
      type: 'credit'
    });

    if (!pendingTransaction) {
      throw new Error('Pending transaction not found');
    }

    // Update the transaction
    pendingTransaction.status = 'completed';
    pendingTransaction.balance_after = wallet.balance + amount;

    // Update wallet balance
    wallet.balance += amount;

    await pendingTransaction.save();
    await wallet.save();

    return { success: true, message: 'Payment processed successfully' };
  }

  // Utility methods

  hashPin(pin) {
    return crypto.createHash('sha256').update(pin).digest('hex');
  }

  generateReference(prefix = 'WALLET') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new WalletService();
