const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const mpesaService = require('../services/mpesaService');
const airtelMoneyService = require('../services/airtelMoneyService');
const walletService = require('../services/walletService');

// Enhanced M-Pesa integration with the service class

const getMpesaToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  try {
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    throw new Error('Failed to get M-Pesa token');
  }
};

// Enhanced M-Pesa STK Push with service integration
router.post('/mpesa/initiate', protect, async (req, res) => {
  try {
    const { transactionId, phoneNumber } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Use the enhanced M-Pesa service
    const result = await mpesaService.initiateSTKPush({
      phoneNumber,
      amount: Math.round(transaction.totalAmount),
      accountReference: `MKUL${transaction._id}`,
      transactionDesc: `Payment for ${transaction.product}`,
      callbackUrl: process.env.MPESA_CALLBACK_URL,
      userId: req.user._id
    });

    transaction.paymentReference = result.checkoutRequestId;
    await transaction.save();

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      checkoutRequestId: result.checkoutRequestId,
      merchantRequestId: result.merchantRequestId,
      customerMessage: result.customerMessage
    });
  } catch (error) {
    console.error('M-Pesa error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Payment initiation failed',
      error: error.message
    });
  }
});

// Enhanced M-Pesa callback with service integration
router.post('/mpesa/callback', async (req, res) => {
  try {
    await mpesaService.handleCallback(req.body);
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('Callback error:', error);
    res.json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
});

// New: Query payment status
router.get('/mpesa/status/:checkoutRequestId', protect, async (req, res) => {
  try {
    const result = await mpesaService.querySTKPushStatus(req.params.checkoutRequestId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Status query failed', error: error.message });
  }
});

// New: Register C2B URLs (Admin only)
router.post('/mpesa/c2b/register', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const result = await mpesaService.registerC2BUrls();
    res.json({ success: true, message: 'C2B URLs registered', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

// New: C2B validation URL
router.post('/mpesa/c2b/validation', (req, res) => {
  console.log('C2B Validation request:', req.body);
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// New: C2B confirmation URL
router.post('/mpesa/c2b/confirmation', async (req, res) => {
  try {
    console.log('C2B Confirmation received:', req.body);
    const { TransID, TransAmount, BillRefNumber } = req.body;

    // Process C2B payment (wallet top-up, etc.)
    if (BillRefNumber.startsWith('WALLET_')) {
      const userId = BillRefNumber.replace('WALLET_', '');
      const user = await User.findById(userId);
      if (user) {
        user.balance += TransAmount;
        await user.save();
      }
    }

    res.json({ ResultCode: 0, ResultDesc: 'Confirmation received successfully' });
  } catch (error) {
    console.error('C2B confirmation error:', error);
    res.json({ ResultCode: 1, ResultDesc: 'Confirmation failed' });
  }
});

// New: B2C payout
router.post('/mpesa/b2c', protect, async (req, res) => {
  try {
    const { phoneNumber, amount, remarks } = req.body;

    if (!['admin', 'business'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    if (req.user.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const result = await mpesaService.initiateB2CPayment({
      phoneNumber,
      amount,
      remarks: remarks || 'MkulimaLink Payout'
    });

    // Deduct from user balance
    req.user.balance -= amount;
    await req.user.save();

    res.json({
      success: true,
      message: 'Payout initiated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payout failed', error: error.message });
  }
});

// Airtel Money Collection (Customer Payment)
router.post('/airtel/initiate', protect, async (req, res) => {
  try {
    const { transactionId, phoneNumber } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Use Airtel Money service
    const result = await airtelMoneyService.initiateCollection({
      phoneNumber,
      amount: Math.round(transaction.totalAmount),
      reference: `MKUL${transaction._id}`,
      transactionDesc: `Payment for ${transaction.product}`
    });

    transaction.paymentReference = result.transactionId;
    await transaction.save();

    res.json({
      success: true,
      message: 'Airtel Money payment initiated successfully',
      transactionId: result.transactionId,
      status: result.status
    });
  } catch (error) {
    console.error('Airtel Money payment error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Airtel Money payment initiation failed',
      error: error.message
    });
  }
});

// Airtel Money callback handler
router.post('/airtel/callback', async (req, res) => {
  try {
    await airtelMoneyService.handleCallback(req.body);
    res.json({ success: true, message: 'Callback processed successfully' });
  } catch (error) {
    console.error('Airtel callback error:', error);
    res.status(500).json({ success: false, message: 'Callback processing failed' });
  }
});

// Query Airtel Money transaction status
router.get('/airtel/status/:transactionId', protect, async (req, res) => {
  try {
    const result = await airtelMoneyService.checkTransactionStatus(req.params.transactionId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Status query failed', error: error.message });
  }
});

// Airtel Money disbursement (payout)
router.post('/airtel/payout', protect, async (req, res) => {
  try {
    const { phoneNumber, amount, remarks } = req.body;

    if (!['admin', 'business'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    if (req.user.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const result = await airtelMoneyService.initiateDisbursement({
      phoneNumber,
      amount,
      reference: `PAYOUT_${req.user._id}_${Date.now()}`,
      description: remarks || 'MkulimaLink Payout'
    });

    // Deduct from user balance
    req.user.balance -= amount;
    await req.user.save();

    res.json({
      success: true,
      message: 'Airtel Money payout initiated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payout failed', error: error.message });
  }
});

// Premium subscription with enhanced features
router.post('/premium/subscribe', protect, async (req, res) => {
  try {
    const { plan, phoneNumber, paymentMethod = 'mpesa' } = req.body;

    const prices = {
      monthly: parseInt(process.env.PREMIUM_MONTHLY_PRICE) || 10000,
      yearly: parseInt(process.env.PREMIUM_YEARLY_PRICE) || 100000
    };

    const amount = prices[plan];
    if (!amount) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    let paymentResult;

    if (paymentMethod === 'mpesa') {
      paymentResult = await mpesaService.initiateSTKPush({
        phoneNumber,
        amount,
        accountReference: `PREMIUM_${req.user._id}`,
        transactionDesc: `MkulimaLink Premium ${plan} subscription`,
        callbackUrl: `${process.env.MPESA_CALLBACK_URL}/premium`,
        userId: req.user._id
      });
    } else if (paymentMethod === 'airtel') {
      paymentResult = await initiateAirtelPayment({
        phoneNumber,
        amount,
        reference: `PREMIUM_${req.user._id}`,
        userId: req.user._id
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    // Activate premium subscription
    const expiryDate = new Date();
    if (plan === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    req.user.isPremium = true;
    req.user.premiumExpiresAt = expiryDate;
    await req.user.save();

    res.json({
      success: true,
      message: 'Premium subscription activated',
      expiresAt: expiryDate,
      paymentReference: paymentResult.checkoutRequestId || paymentResult.transactionId
    });
  } catch (error) {
    console.error('Premium subscription error:', error);
    res.status(500).json({ success: false, message: 'Subscription failed', error: error.message });
  }
});

// Enhanced balance and wallet management
router.get('/balance', protect, async (req, res) => {
  try {
    const balance = {
      available: req.user.balance,
      currency: 'KES',
      lastUpdated: req.user.updatedAt
    };

    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enhanced withdrawal with better validation
router.post('/withdraw', protect, async (req, res) => {
  try {
    const { amount, phoneNumber, paymentMethod = 'mpesa' } = req.body;

    if (amount > req.user.balance) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    if (amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is KES 100' });
    }

    if (amount > 50000) {
      return res.status(400).json({ success: false, message: 'Maximum withdrawal is KES 50,000 per transaction' });
    }

    // Deduct from balance immediately
    req.user.balance -= amount;
    await req.user.save();

    // Initiate payout
    let payoutResult;
    if (paymentMethod === 'mpesa') {
      payoutResult = await mpesaService.initiateB2CPayment({
        phoneNumber,
        amount,
        remarks: 'MkulimaLink Withdrawal'
      });
    } else {
      // Handle other payment methods
      payoutResult = { success: true, message: 'Withdrawal queued' };
    }

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      newBalance: req.user.balance,
      payoutReference: payoutResult.conversationID || 'queued'
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Transaction history with pagination
router.get('/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({
      $or: [
        { buyer: req.user._id },
        { seller: req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('buyer', 'name')
    .populate('seller', 'name')
    .populate('product', 'name category');

    const total = await Transaction.countDocuments({
      $or: [
        { buyer: req.user._id },
        { seller: req.user._id }
      ]
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================
// WALLET ROUTES
// =====================================

// Get wallet balance
router.get('/wallet/balance', protect, async (req, res) => {
  try {
    const balance = await walletService.getWalletBalance(req.user._id);
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Top up wallet
router.post('/wallet/topup', protect, async (req, res) => {
  try {
    const { amount, paymentMethod, phoneNumber } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum top-up amount is KES 100' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const result = await walletService.topUpWallet(
      req.user._id,
      amount,
      paymentMethod || 'mpesa',
      phoneNumber
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Wallet withdrawal
router.post('/wallet/withdraw', protect, async (req, res) => {
  try {
    const { amount, phoneNumber, paymentMethod = 'mpesa' } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is KES 100' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Debit wallet
    const transaction = await walletService.debitWallet(
      req.user._id,
      amount,
      `Wallet withdrawal via ${paymentMethod.toUpperCase()}`,
      `WITHDRAWAL_${req.user._id}_${Date.now()}`
    );

    // Initiate payout
    let payoutResult;
    if (paymentMethod === 'mpesa') {
      payoutResult = await mpesaService.initiateB2CPayment({
        phoneNumber,
        amount,
        remarks: 'MkulimaLink Wallet Withdrawal'
      });
    } else if (paymentMethod === 'airtel') {
      payoutResult = await airtelMoneyService.initiateDisbursement({
        phoneNumber,
        amount,
        reference: transaction.reference,
        description: 'MkulimaLink Wallet Withdrawal'
      });
    }

    res.json({
      success: true,
      message: 'Withdrawal initiated successfully',
      transactionId: transaction._id,
      payoutReference: payoutResult?.conversationID || payoutResult?.transactionId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Transfer between wallets
router.post('/wallet/transfer', protect, async (req, res) => {
  try {
    const { recipientId, amount, description } = req.body;

    if (!recipientId || !amount) {
      return res.status(400).json({ success: false, message: 'Recipient and amount are required' });
    }

    if (amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum transfer amount is KES 100' });
    }

    const result = await walletService.transferFunds(
      req.user._id,
      recipientId,
      amount,
      description || 'Wallet transfer'
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Set wallet PIN
router.post('/wallet/pin', protect, async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ success: false, message: 'PIN must be exactly 4 digits' });
    }

    const result = await walletService.setWalletPin(req.user._id, pin);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify wallet PIN
router.post('/wallet/pin/verify', protect, async (req, res) => {
  try {
    const { pin } = req.body;

    const isValid = await walletService.verifyWalletPin(req.user._id, pin);
    res.json({ success: true, valid: isValid });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Change wallet PIN
router.post('/wallet/pin/change', protect, async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;

    const result = await walletService.changeWalletPin(req.user._id, oldPin, newPin);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get wallet transaction history
router.get('/wallet/transactions', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const result = await walletService.getTransactionHistory(
      req.user._id,
      page,
      limit,
      type,
      startDate,
      endDate
    );

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Set wallet limits
router.post('/wallet/limits', protect, async (req, res) => {
  try {
    const { daily_limit, monthly_limit } = req.body;

    const limits = {};
    if (daily_limit) limits.daily_limit = daily_limit;
    if (monthly_limit) limits.monthly_limit = monthly_limit;

    const result = await walletService.setWalletLimits(req.user._id, limits);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Configure auto top-up
router.post('/wallet/auto-topup', protect, async (req, res) => {
  try {
    const config = req.body;

    const result = await walletService.configureAutoTopup(req.user._id, config);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process auto top-up
router.post('/wallet/auto-topup/process', protect, async (req, res) => {
  try {
    const result = await walletService.processAutoTopup(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
