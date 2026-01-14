/**
 * MkulimaLink Supply Chain Finance Service
 * Enables farmers to get paid upfront while buyers pay later
 * Includes invoice financing, purchase order financing, and dynamic discounting
 */

const { Transaction, Product, User } = require('../models');
const walletService = require('./walletService');
const mpesaService = require('./mpesaService');
const airtelMoneyService = require('./airtelMoneyService');

class SupplyChainFinanceService {
  constructor() {
    this.financeProviders = {
      equity: {
        name: 'Equity Bank Supply Chain Finance',
        api_url: process.env.EQUITY_SCF_API_URL,
        api_key: process.env.EQUITY_SCF_API_KEY,
        max_advance_percentage: 0.85, // 85% of invoice value
        min_advance: 5000,
        max_advance: 500000,
        interest_rate: 0.15, // 15% APR
        tenor_days: 30 // 30 days to repay
      },
      kcb: {
        name: 'KCB Reverse Factoring',
        api_url: process.env.KCB_SCF_API_URL,
        api_key: process.env.KCB_SCF_API_KEY,
        max_advance_percentage: 0.90, // 90% of invoice value
        min_advance: 10000,
        max_advance: 1000000,
        interest_rate: 0.12, // 12% APR
        tenor_days: 45 // 45 days to repay
      },
      cooperative: {
        name: 'Cooperative Bank Agri-Finance',
        api_url: process.env.COOP_SCF_API_URL,
        api_key: process.env.COOP_SCF_API_KEY,
        max_advance_percentage: 0.80, // 80% of invoice value
        min_advance: 2500,
        max_advance: 250000,
        interest_rate: 0.18, // 18% APR
        tenor_days: 21 // 21 days to repay
      }
    };

    this.feeStructure = {
      platform_fee: 0.02, // 2% platform fee
      processing_fee: 0.005, // 0.5% processing fee
      early_payment_discount: 0.03 // 3% discount for early payment
    };
  }

  /**
   * Request advance payment for a transaction
   */
  async requestAdvancePayment(userId, transactionId, advancePercentage = 0.8) {
    try {
      // Find the transaction
      const transaction = await Transaction.findOne({
        _id: transactionId,
        seller: userId,
        status: { $in: ['confirmed', 'in_transit'] }
      }).populate('buyer', 'name email phone business_info')
       .populate('product', 'name category');

      if (!transaction) {
        throw new Error('Transaction not found or not eligible for advance payment');
      }

      if (transaction.advance_payment && transaction.advance_payment.status === 'approved') {
        throw new Error('Advance payment already requested for this transaction');
      }

      // Calculate advance amount
      const advanceAmount = Math.min(
        transaction.totalAmount * advancePercentage,
        transaction.totalAmount * 0.9 // Max 90% advance
      );

      // Calculate fees and interest
      const financeTerms = await this.calculateFinanceTerms(advanceAmount, transaction);

      // Check seller eligibility
      const eligibility = await this.checkSellerEligibility(userId, transaction);

      if (!eligibility.eligible) {
        throw new Error(`Not eligible for advance payment: ${eligibility.reason}`);
      }

      // Create advance payment request
      transaction.advance_payment = {
        requested_amount: advanceAmount,
        approved_amount: 0,
        status: 'pending',
        requested_at: new Date(),
        finance_terms: financeTerms,
        provider: eligibility.preferred_provider,
        eligibility_score: eligibility.score
      };

      await transaction.save();

      return {
        success: true,
        transaction_id: transactionId,
        requested_amount: advanceAmount,
        finance_terms: financeTerms,
        message: 'Advance payment request submitted successfully'
      };

    } catch (error) {
      console.error('Request advance payment error:', error);
      throw error;
    }
  }

  /**
   * Calculate finance terms for advance payment
   */
  async calculateFinanceTerms(advanceAmount, transaction) {
    try {
      // Determine best finance provider
      const provider = await this.selectBestProvider(advanceAmount, transaction);

      const interestAmount = advanceAmount * (provider.interest_rate / 12) * (provider.tenor_days / 30);
      const platformFee = advanceAmount * this.feeStructure.platform_fee;
      const processingFee = advanceAmount * this.feeStructure.processing_fee;

      const totalFees = platformFee + processingFee + interestAmount;
      const disbursementAmount = advanceAmount - totalFees;

      return {
        provider: provider.name,
        advance_percentage: (advanceAmount / transaction.totalAmount) * 100,
        interest_rate: provider.interest_rate * 100, // Convert to percentage
        interest_amount: Math.round(interestAmount),
        platform_fee: Math.round(platformFee),
        processing_fee: Math.round(processingFee),
        total_fees: Math.round(totalFees),
        disbursement_amount: Math.round(disbursementAmount),
        repayment_amount: Math.round(advanceAmount + interestAmount),
        repayment_date: new Date(Date.now() + provider.tenor_days * 24 * 60 * 60 * 1000),
        tenor_days: provider.tenor_days
      };

    } catch (error) {
      console.error('Calculate finance terms error:', error);
      throw error;
    }
  }

  /**
   * Select best finance provider based on transaction details
   */
  async selectBestProvider(advanceAmount, transaction) {
    // For now, select based on amount and simple criteria
    // In production, this would use more sophisticated selection logic

    if (advanceAmount >= 100000) {
      return this.financeProviders.kcb; // Better rates for larger amounts
    } else if (advanceAmount >= 25000) {
      return this.financeProviders.equity;
    } else {
      return this.financeProviders.cooperative; // More accessible for smaller amounts
    }
  }

  /**
   * Check seller eligibility for advance payment
   */
  async checkSellerEligibility(userId, transaction) {
    try {
      const seller = await User.findById(userId);

      let score = 0;
      let reasons = [];

      // Transaction history (40% weight)
      const completedTransactions = await Transaction.countDocuments({
        seller: userId,
        status: 'completed'
      });

      if (completedTransactions >= 20) {
        score += 40;
      } else if (completedTransactions >= 10) {
        score += 30;
      } else if (completedTransactions >= 5) {
        score += 20;
      } else if (completedTransactions >= 1) {
        score += 10;
      }

      // Seller rating (30% weight)
      if (seller.rating >= 4.8) {
        score += 30;
      } else if (seller.rating >= 4.5) {
        score += 25;
      } else if (seller.rating >= 4.0) {
        score += 20;
      } else if (seller.rating >= 3.5) {
        score += 15;
      }

      // Account age (15% weight)
      const accountAgeDays = Math.floor((Date.now() - seller.createdAt) / (1000 * 60 * 60 * 24));
      if (accountAgeDays >= 365) {
        score += 15;
      } else if (accountAgeDays >= 180) {
        score += 12;
      } else if (accountAgeDays >= 90) {
        score += 8;
      } else if (accountAgeDays >= 30) {
        score += 5;
      }

      // Business verification (15% weight)
      if (seller.business_info && seller.business_info.verified) {
        score += 15;
      } else if (seller.business_info) {
        score += 10;
      }

      // Determine eligibility
      let eligible = score >= 50; // Minimum score of 50
      let preferredProvider = 'cooperative'; // Default

      if (score >= 80) {
        preferredProvider = 'kcb';
      } else if (score >= 65) {
        preferredProvider = 'equity';
      }

      if (score < 50) {
        reasons.push('Insufficient transaction history or seller rating');
      }

      return {
        eligible,
        score,
        preferred_provider: preferredProvider,
        reason: reasons.length > 0 ? reasons.join(', ') : null
      };

    } catch (error) {
      console.error('Check seller eligibility error:', error);
      return {
        eligible: false,
        score: 0,
        preferred_provider: 'cooperative',
        reason: 'Eligibility check failed'
      };
    }
  }

  /**
   * Approve advance payment request (admin/finance provider)
   */
  async approveAdvancePayment(transactionId, approvedAmount, approvedBy) {
    try {
      const transaction = await Transaction.findById(transactionId)
        .populate('seller', 'name email phone')
        .populate('buyer', 'name email phone business_info');

      if (!transaction || !transaction.advance_payment) {
        throw new Error('Advance payment request not found');
      }

      if (transaction.advance_payment.status !== 'pending') {
        throw new Error('Advance payment request already processed');
      }

      // Update approval details
      transaction.advance_payment.approved_amount = approvedAmount;
      transaction.advance_payment.status = 'approved';
      transaction.advance_payment.approved_by = approvedBy;
      transaction.advance_payment.approved_at = new Date();

      // Calculate final finance terms
      const financeTerms = transaction.advance_payment.finance_terms;
      const repaymentAmount = approvedAmount + financeTerms.interest_amount;

      transaction.advance_payment.finance_terms.repayment_amount = repaymentAmount;
      transaction.advance_payment.finance_terms.approved_amount = approvedAmount;

      await transaction.save();

      // Notify seller
      await this.notifySellerApproval(transaction);

      return {
        success: true,
        transaction_id: transactionId,
        approved_amount: approvedAmount,
        repayment_amount: repaymentAmount,
        repayment_date: financeTerms.repayment_date
      };

    } catch (error) {
      console.error('Approve advance payment error:', error);
      throw error;
    }
  }

  /**
   * Disburse approved advance payment
   */
  async disburseAdvancePayment(transactionId) {
    try {
      const transaction = await Transaction.findById(transactionId);

      if (!transaction || !transaction.advance_payment) {
        throw new Error('Advance payment request not found');
      }

      if (transaction.advance_payment.status !== 'approved') {
        throw new Error('Advance payment not approved');
      }

      const disbursementAmount = transaction.advance_payment.finance_terms.disbursement_amount;
      const sellerId = transaction.seller;

      // Credit amount to seller's wallet
      await walletService.creditWallet(
        sellerId,
        disbursementAmount,
        `Advance payment for transaction ${transactionId}`,
        `ADVANCE_${transactionId}`
      );

      // Update transaction status
      transaction.advance_payment.status = 'disbursed';
      transaction.advance_payment.disbursed_at = new Date();
      transaction.advance_payment.disbursed_amount = disbursementAmount;

      await transaction.save();

      // Notify seller
      await this.notifySellerDisbursement(transaction);

      return {
        success: true,
        transaction_id: transactionId,
        disbursed_amount: disbursementAmount,
        message: 'Advance payment disbursed successfully'
      };

    } catch (error) {
      console.error('Disburse advance payment error:', error);
      throw error;
    }
  }

  /**
   * Process repayment of advance payment
   */
  async processAdvanceRepayment(transactionId, paymentAmount, paymentMethod = 'wallet') {
    try {
      const transaction = await Transaction.findById(transactionId);

      if (!transaction || !transaction.advance_payment) {
        throw new Error('Advance payment not found');
      }

      if (transaction.advance_payment.status !== 'disbursed') {
        throw new Error('Advance payment not yet disbursed');
      }

      const advanceData = transaction.advance_payment;
      const repaymentAmount = advanceData.finance_terms.repayment_amount;
      const paidSoFar = advanceData.payments ? advanceData.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
      const remainingAmount = repaymentAmount - paidSoFar;

      if (paymentAmount > remainingAmount) {
        throw new Error(`Payment amount exceeds remaining balance of KES ${remainingAmount}`);
      }

      // Process payment based on method
      if (paymentMethod === 'wallet') {
        // Deduct from buyer's wallet
        await walletService.debitWallet(
          transaction.buyer,
          paymentAmount,
          `Repayment of advance for transaction ${transactionId}`,
          `REPAY_${transactionId}`
        );
      } else if (paymentMethod === 'mpesa') {
        // Handle M-Pesa payment
        // This would integrate with M-Pesa payment flow
      }

      // Record payment
      if (!advanceData.payments) advanceData.payments = [];
      advanceData.payments.push({
        amount: paymentAmount,
        date: new Date(),
        method: paymentMethod,
        reference: `REPAY_${Date.now()}`
      });

      // Check if fully repaid
      const totalPaid = paidSoFar + paymentAmount;
      if (totalPaid >= repaymentAmount) {
        advanceData.status = 'repaid';
        advanceData.repaid_at = new Date();
      }

      await transaction.save();

      return {
        success: true,
        payment_amount: paymentAmount,
        remaining_balance: Math.max(0, remainingAmount - paymentAmount),
        fully_repaid: totalPaid >= repaymentAmount
      };

    } catch (error) {
      console.error('Process advance repayment error:', error);
      throw error;
    }
  }

  /**
   * Get supply chain finance statistics for a user
   */
  async getFinanceStats(userId, userType = 'seller') {
    try {
      let filter = {};

      if (userType === 'seller') {
        filter.seller = userId;
      } else {
        filter.buyer = userId;
      }

      const transactions = await Transaction.find(filter).select('advance_payment totalAmount createdAt');

      const stats = {
        total_transactions: transactions.length,
        advance_requests: transactions.filter(t => t.advance_payment).length,
        approved_advances: transactions.filter(t => t.advance_payment && t.advance_payment.status === 'approved').length,
        disbursed_advances: transactions.filter(t => t.advance_payment && t.advance_payment.status === 'disbursed').length,
        repaid_advances: transactions.filter(t => t.advance_payment && t.advance_payment.status === 'repaid').length,
        total_advance_amount: transactions
          .filter(t => t.advance_payment && t.advance_payment.status === 'disbursed')
          .reduce((sum, t) => sum + (t.advance_payment.disbursed_amount || 0), 0),
        total_repayment_amount: transactions
          .filter(t => t.advance_payment)
          .reduce((sum, t) => {
            const payments = t.advance_payment.payments || [];
            return sum + payments.reduce((pSum, p) => pSum + p.amount, 0);
          }, 0)
      };

      return stats;

    } catch (error) {
      console.error('Get finance stats error:', error);
      throw error;
    }
  }

  /**
   * Create dynamic discounting offer for buyer
   */
  async createDiscountOffer(transactionId) {
    try {
      const transaction = await Transaction.findById(transactionId)
        .populate('buyer', 'name email business_info')
        .populate('seller', 'name email');

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'confirmed') {
        throw new Error('Transaction must be confirmed to offer discount');
      }

      const originalAmount = transaction.totalAmount;
      const daysToDue = Math.max(1, Math.floor((transaction.dueDate - new Date()) / (1000 * 60 * 60 * 24)));

      // Calculate discount based on days to payment
      let discountRate = 0;
      if (daysToDue >= 30) discountRate = 0.03; // 3% discount for payment within 30 days
      else if (daysToDue >= 14) discountRate = 0.02; // 2% discount for payment within 14 days
      else if (daysToDue >= 7) discountRate = 0.01; // 1% discount for payment within 7 days

      const discountAmount = Math.round(originalAmount * discountRate);
      const discountedAmount = originalAmount - discountAmount;

      // Create discount offer
      transaction.discount_offer = {
        original_amount: originalAmount,
        discounted_amount: discountedAmount,
        discount_amount: discountAmount,
        discount_rate: discountRate * 100,
        valid_until: new Date(Date.now() + daysToDue * 24 * 60 * 60 * 1000),
        status: 'pending',
        created_at: new Date()
      };

      await transaction.save();

      // Notify buyer
      await this.notifyBuyerDiscountOffer(transaction);

      return {
        success: true,
        transaction_id: transactionId,
        original_amount: originalAmount,
        discounted_amount: discountedAmount,
        discount_amount: discountAmount,
        valid_until: transaction.discount_offer.valid_until
      };

    } catch (error) {
      console.error('Create discount offer error:', error);
      throw error;
    }
  }

  /**
   * Accept discount offer and process early payment
   */
  async acceptDiscountOffer(transactionId, paymentMethod = 'wallet') {
    try {
      const transaction = await Transaction.findById(transactionId);

      if (!transaction || !transaction.discount_offer) {
        throw new Error('Discount offer not found');
      }

      if (transaction.discount_offer.status !== 'pending') {
        throw new Error('Discount offer already processed');
      }

      const discountedAmount = transaction.discount_offer.discounted_amount;

      // Process payment
      if (paymentMethod === 'wallet') {
        await walletService.debitWallet(
          transaction.buyer,
          discountedAmount,
          `Early payment discount for transaction ${transactionId}`,
          `DISCOUNT_${transactionId}`
        );
      } else if (paymentMethod === 'mpesa') {
        // Handle M-Pesa payment
        // This would integrate with M-Pesa payment flow
      }

      // Update transaction
      transaction.totalAmount = discountedAmount;
      transaction.status = 'paid';
      transaction.discount_offer.status = 'accepted';
      transaction.discount_offer.accepted_at = new Date();
      transaction.paidAt = new Date();

      // Credit seller
      await walletService.creditWallet(
        transaction.seller,
        discountedAmount,
        `Payment received with discount for transaction ${transactionId}`,
        `PAYMENT_${transactionId}`
      );

      await transaction.save();

      return {
        success: true,
        paid_amount: discountedAmount,
        discount_saved: transaction.discount_offer.discount_amount,
        message: 'Discount offer accepted and payment processed'
      };

    } catch (error) {
      console.error('Accept discount offer error:', error);
      throw error;
    }
  }

  // Notification helper methods
  async notifySellerApproval(transaction) {
    // Implementation for notifying seller of approval
    console.log(`Notifying seller ${transaction.seller} of advance payment approval`);
  }

  async notifySellerDisbursement(transaction) {
    // Implementation for notifying seller of disbursement
    console.log(`Notifying seller ${transaction.seller} of advance payment disbursement`);
  }

  async notifyBuyerDiscountOffer(transaction) {
    // Implementation for notifying buyer of discount offer
    console.log(`Notifying buyer ${transaction.buyer} of discount offer`);
  }
}

module.exports = new SupplyChainFinanceService();
