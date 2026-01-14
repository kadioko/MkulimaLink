/**
 * Supply Chain Finance Routes
 * Handles advance payments, dynamic discounting, and supply chain financing
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supplyChainFinanceService = require('../services/supplyChainFinanceService');
const { Transaction } = require('../models');

// Apply authentication middleware to all routes
router.use(protect);

// Request advance payment for a transaction
router.post('/advance/request/:transactionId', async (req, res) => {
  try {
    const { advance_percentage } = req.body;

    // Verify transaction ownership (must be seller)
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only request advance payment for your own sales'
      });
    }

    const result = await supplyChainFinanceService.requestAdvancePayment(
      req.user._id,
      req.params.transactionId,
      advance_percentage || 0.8
    );

    res.json({
      success: true,
      message: 'Advance payment request submitted successfully',
      data: result
    });
  } catch (error) {
    console.error('Request advance payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request advance payment',
      error: error.message
    });
  }
});

// Get advance payment status for a transaction
router.get('/advance/status/:transactionId', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user is seller or buyer
    if (transaction.seller.toString() !== req.user._id.toString() &&
        transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this advance payment'
      });
    }

    const advanceData = transaction.advance_payment;

    if (!advanceData) {
      return res.json({
        success: true,
        data: {
          has_advance_request: false,
          message: 'No advance payment request for this transaction'
        }
      });
    }

    res.json({
      success: true,
      data: {
        has_advance_request: true,
        status: advanceData.status,
        requested_amount: advanceData.requested_amount,
        approved_amount: advanceData.approved_amount,
        disbursed_amount: advanceData.disbursed_amount,
        finance_terms: advanceData.finance_terms,
        requested_at: advanceData.requested_at,
        approved_at: advanceData.approved_at,
        disbursed_at: advanceData.disbursed_at,
        repaid_at: advanceData.repaid_at,
        payments: advanceData.payments,
        eligibility_score: advanceData.eligibility_score
      }
    });
  } catch (error) {
    console.error('Get advance status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get advance payment status',
      error: error.message
    });
  }
});

// Make repayment for advance payment
router.post('/advance/repay/:transactionId', async (req, res) => {
  try {
    const { amount, payment_method } = req.body;

    // Verify transaction ownership (must be buyer)
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only make repayments for transactions you purchased'
      });
    }

    const result = await supplyChainFinanceService.processAdvanceRepayment(
      req.params.transactionId,
      amount,
      payment_method || 'wallet'
    );

    res.json({
      success: true,
      message: 'Repayment processed successfully',
      data: result
    });
  } catch (error) {
    console.error('Advance repayment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process repayment',
      error: error.message
    });
  }
});

// Get supply chain finance statistics
router.get('/stats', async (req, res) => {
  try {
    const userType = req.user.role === 'business' ? 'seller' : 'buyer';

    const stats = await supplyChainFinanceService.getFinanceStats(req.user._id, userType);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get finance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get finance statistics',
      error: error.message
    });
  }
});

// Create dynamic discount offer (for sellers)
router.post('/discount/create/:transactionId', async (req, res) => {
  try {
    // Verify transaction ownership (must be seller)
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only create discount offers for your own sales'
      });
    }

    const result = await supplyChainFinanceService.createDiscountOffer(req.params.transactionId);

    res.json({
      success: true,
      message: 'Discount offer created successfully',
      data: result
    });
  } catch (error) {
    console.error('Create discount offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create discount offer',
      error: error.message
    });
  }
});

// Accept discount offer (for buyers)
router.post('/discount/accept/:transactionId', async (req, res) => {
  try {
    const { payment_method } = req.body;

    // Verify transaction ownership (must be buyer)
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only accept discount offers for your own purchases'
      });
    }

    const result = await supplyChainFinanceService.acceptDiscountOffer(
      req.params.transactionId,
      payment_method || 'wallet'
    );

    res.json({
      success: true,
      message: 'Discount offer accepted and payment processed',
      data: result
    });
  } catch (error) {
    console.error('Accept discount offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept discount offer',
      error: error.message
    });
  }
});

// Get discount offer status
router.get('/discount/status/:transactionId', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user is seller or buyer
    if (transaction.seller.toString() !== req.user._id.toString() &&
        transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this discount offer'
      });
    }

    const discountData = transaction.discount_offer;

    if (!discountData) {
      return res.json({
        success: true,
        data: {
          has_discount_offer: false,
          message: 'No discount offer for this transaction'
        }
      });
    }

    res.json({
      success: true,
      data: {
        has_discount_offer: true,
        original_amount: discountData.original_amount,
        discounted_amount: discountData.discounted_amount,
        discount_amount: discountData.discount_amount,
        discount_rate: discountData.discount_rate,
        valid_until: discountData.valid_until,
        status: discountData.status,
        created_at: discountData.created_at,
        accepted_at: discountData.accepted_at
      }
    });
  } catch (error) {
    console.error('Get discount status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discount offer status',
      error: error.message
    });
  }
});

// Get available financing options for a transaction
router.get('/options/:transactionId', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user is seller (for advance payment options)
    if (transaction.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view financing options for this transaction'
      });
    }

    // Calculate available options
    const options = [];

    // Advance payment option
    if (['confirmed', 'in_transit'].includes(transaction.status)) {
      const eligibility = await supplyChainFinanceService.checkSellerEligibility(req.user._id, transaction);

      if (eligibility.eligible) {
        const financeTerms = await supplyChainFinanceService.calculateFinanceTerms(
          transaction.totalAmount * 0.8, // 80% advance
          transaction
        );

        options.push({
          type: 'advance_payment',
          name: 'Advance Payment',
          description: 'Get paid upfront for your produce',
          eligible: true,
          max_advance: transaction.totalAmount * 0.9,
          recommended_advance: transaction.totalAmount * 0.8,
          finance_terms: financeTerms,
          eligibility_score: eligibility.score
        });
      } else {
        options.push({
          type: 'advance_payment',
          name: 'Advance Payment',
          description: 'Get paid upfront for your produce',
          eligible: false,
          reason: eligibility.reason
        });
      }
    }

    // Dynamic discounting option (for buyers)
    if (transaction.buyer.toString() === req.user._id.toString() &&
        transaction.status === 'confirmed') {

      const daysToDue = Math.max(1, Math.floor((transaction.dueDate - new Date()) / (1000 * 60 * 60 * 24)));
      let discountRate = 0;

      if (daysToDue >= 30) discountRate = 0.03;
      else if (daysToDue >= 14) discountRate = 0.02;
      else if (daysToDue >= 7) discountRate = 0.01;

      if (discountRate > 0) {
        options.push({
          type: 'dynamic_discounting',
          name: 'Early Payment Discount',
          description: 'Pay early and save on your purchase',
          eligible: true,
          discount_rate: discountRate * 100,
          discounted_amount: transaction.totalAmount * (1 - discountRate),
          savings: transaction.totalAmount * discountRate,
          valid_for_days: daysToDue
        });
      }
    }

    res.json({
      success: true,
      data: {
        transaction_id: req.params.transactionId,
        transaction_amount: transaction.totalAmount,
        options: options
      }
    });
  } catch (error) {
    console.error('Get financing options error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get financing options',
      error: error.message
    });
  }
});

// Admin routes for managing supply chain finance
router.use('/admin', protect);

// Get all advance payment requests (admin)
router.get('/admin/advances', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    // Find transactions with advance payments
    let matchStage = {};
    if (status) {
      matchStage = { 'advance_payment.status': status };
    }

    const transactions = await Transaction.aggregate([
      { $match: { advance_payment: { $exists: true }, ...matchStage } },
      { $lookup: { from: 'users', localField: 'seller', foreignField: '_id', as: 'seller' } },
      { $lookup: { from: 'users', localField: 'buyer', foreignField: '_id', as: 'buyer' } },
      { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
      { $unwind: '$seller' },
      { $unwind: '$buyer' },
      { $unwind: '$product' },
      { $sort: { 'advance_payment.requested_at': -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    const total = await Transaction.countDocuments({
      advance_payment: { $exists: true },
      ...(status && { 'advance_payment.status': status })
    });

    res.json({
      success: true,
      data: {
        advances: transactions.map(t => ({
          transaction_id: t._id,
          seller: { id: t.seller._id, name: t.seller.name, phone: t.seller.phone },
          buyer: { id: t.buyer._id, name: t.buyer.name, phone: t.buyer.phone },
          product: { name: t.product.name, category: t.product.category },
          amount: t.totalAmount,
          advance_data: t.advance_payment,
          created_at: t.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get advances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch advance payment requests',
      error: error.message
    });
  }
});

// Approve advance payment request (admin)
router.post('/admin/advance/approve/:transactionId', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { approved_amount } = req.body;

    if (!approved_amount || approved_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid approved amount is required'
      });
    }

    const result = await supplyChainFinanceService.approveAdvancePayment(
      req.params.transactionId,
      approved_amount,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Advance payment request approved',
      data: result
    });
  } catch (error) {
    console.error('Admin approve advance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve advance payment',
      error: error.message
    });
  }
});

// Disburse approved advance payment (admin)
router.post('/admin/advance/disburse/:transactionId', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const result = await supplyChainFinanceService.disburseAdvancePayment(req.params.transactionId);

    res.json({
      success: true,
      message: 'Advance payment disbursed successfully',
      data: result
    });
  } catch (error) {
    console.error('Admin disburse advance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disburse advance payment',
      error: error.message
    });
  }
});

module.exports = router;
