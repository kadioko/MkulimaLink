const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const User = require('../models/User');
const Dispute = require('../models/Dispute');
const { protect } = require('../middleware/auth');
const { sendSMS } = require('../utils/sms');
const { calculateTransactionRisk } = require('../services/marketplaceIntelligence');

const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['paid', 'cancelled'],
  paid: ['in_delivery', 'disputed', 'cancelled'],
  in_delivery: ['completed', 'disputed'],
  shipped: ['completed', 'disputed'],
  delivered: ['completed', 'disputed'],
  completed: [],
  cancelled: [],
  disputed: []
};

const ROLE_TRANSITIONS = {
  buyer: ['paid', 'completed', 'cancelled', 'disputed'],
  seller: ['confirmed', 'in_delivery', 'cancelled', 'disputed']
};

const getTransactionRole = (transaction, userId) => {
  if (transaction.buyer.toString() === userId.toString()) return 'buyer';
  if (transaction.seller.toString() === userId.toString()) return 'seller';
  return null;
};

const releaseProductReservation = async (transaction) => {
  const product = await Product.findById(transaction.product);
  if (!product) return;

  product.reservedQuantity = Math.max(0, (product.reservedQuantity || 0) - transaction.quantity);
  if (product.status === 'reserved' || product.status === 'sold') {
    product.status = 'active';
  }
  await product.save();
};

const finalizeProductStock = async (transaction) => {
  if (transaction.stockFinalized) return;

  const product = await Product.findById(transaction.product);
  if (!product) return;

  product.reservedQuantity = Math.max(0, (product.reservedQuantity || 0) - transaction.quantity);
  product.quantity = Math.max(0, product.quantity - transaction.quantity);
  if (product.quantity === 0) {
    product.status = 'sold';
  } else if (product.status === 'reserved') {
    product.status = 'active';
  }
  await product.save();

  transaction.stockFinalized = true;
};

router.post('/', protect, async (req, res) => {
  try {
    const { productId, quantity, deliveryDetails } = req.body;

    const product = await Product.findById(productId).populate('seller');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.status !== 'active') {
      return res.status(400).json({ message: 'Product is not active for purchase' });
    }

    const availableQuantity = product.quantity - (product.reservedQuantity || 0);
    if (availableQuantity < quantity) {
      return res.status(400).json({ message: 'Insufficient quantity available' });
    }

    if (product.seller._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot buy your own product' });
    }

    const totalAmount = product.price * quantity;
    const commissionRate = parseFloat(process.env.COMMISSION_RATE) || 0.05;
    const commission = totalAmount * commissionRate;
    const sellerAmount = totalAmount - commission;

    const transaction = await Transaction.create({
      product: productId,
      buyer: req.user._id,
      seller: product.seller._id,
      quantity,
      unitPrice: product.price,
      totalAmount,
      commission,
      sellerAmount,
      deliveryDetails,
      timeline: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Transaction created'
      }]
    });

    const transactionRisk = await calculateTransactionRisk(transaction);
    transaction.risk = { ...transactionRisk, assessedAt: new Date() };
    await transaction.save();

    product.reservedQuantity = (product.reservedQuantity || 0) + Number(quantity);
    if (product.reservedQuantity >= product.quantity) {
      product.status = 'reserved';
    }
    await product.save();

    await sendSMS(
      product.seller.phone,
      `New order for ${product.name}! Quantity: ${quantity}. Buyer: ${req.user.name}. Total: TZS ${sellerAmount.toLocaleString()}`
    );

    await sendSMS(
      req.user.phone,
      `Order confirmed for ${product.name}. Quantity: ${quantity}. Total: TZS ${totalAmount.toLocaleString()}. Seller: ${product.seller.name}`
    );

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my/purchases', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ buyer: req.user._id })
      .populate('product')
      .populate('seller', 'name phone rating')
      .sort('-createdAt');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my/sales', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ seller: req.user._id })
      .populate('product')
      .populate('buyer', 'name phone rating')
      .sort('-createdAt');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats/dashboard', protect, async (req, res) => {
  try {
    const isFarmer = req.user.role === 'farmer';
    const query = isFarmer ? { seller: req.user._id } : { buyer: req.user._id };

    const totalTransactions = await Transaction.countDocuments(query);
    const completedTransactions = await Transaction.countDocuments({ ...query, status: 'completed' });
    
    const revenueData = await Transaction.aggregate([
      { $match: { ...query, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: isFarmer ? '$sellerAmount' : '$totalAmount' },
          totalCommission: { $sum: '$commission' }
        }
      }
    ]);

    const revenue = revenueData.length > 0 ? revenueData[0] : { totalRevenue: 0, totalCommission: 0 };

    res.json({
      totalTransactions,
      completedTransactions,
      totalRevenue: revenue.totalRevenue,
      totalCommission: revenue.totalCommission
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('product')
      .populate('buyer', 'name phone location')
      .populate('seller', 'name phone location');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.buyer._id.toString() !== req.user._id.toString() &&
        transaction.seller._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, note, cancellationReason } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const role = getTransactionRole(transaction, req.user._id);
    if (!role) {
      return res.status(403).json({ message: 'Not authorized to update this transaction' });
    }

    const allowedNextStatuses = STATUS_FLOW[transaction.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        message: `Cannot move transaction from ${transaction.status} to ${status}`,
        allowedNextStatuses
      });
    }

    if (!ROLE_TRANSITIONS[role].includes(status)) {
      return res.status(403).json({ message: `${role} cannot set transaction status to ${status}` });
    }

    if (status === 'cancelled' && !cancellationReason) {
      return res.status(400).json({ message: 'Cancellation reason is required' });
    }

    const previousStatus = transaction.status;
    transaction.status = status;

    if (status === 'cancelled') {
      transaction.cancellation = {
        reason: cancellationReason,
        cancelledBy: req.user._id,
        cancelledAt: new Date()
      };
      if (previousStatus !== 'cancelled') {
        await releaseProductReservation(transaction);
      }
    }

    if (status === 'paid') {
      transaction.escrow = {
        status: 'held',
        amountHeld: transaction.totalAmount,
        heldAt: new Date()
      };
      transaction.paymentStatus = 'paid';
    }

    if (status === 'in_delivery') {
      transaction.escrow = {
        ...(transaction.escrow || {}),
        status: transaction.escrow?.status === 'held' ? 'held' : transaction.escrow?.status || 'none'
      };
    }

    if (status === 'completed') {
      await finalizeProductStock(transaction);
      transaction.escrow = {
        ...(transaction.escrow || {}),
        status: 'released',
        releasedAt: new Date()
      };
      transaction.paymentStatus = 'paid';
    }

    if (status === 'disputed') {
      transaction.escrow = {
        ...(transaction.escrow || {}),
        status: 'disputed'
      };
    }

    transaction.timeline.push({
      status,
      timestamp: new Date(),
      note: note || (status === 'cancelled' ? cancellationReason : `Status updated to ${status}`)
    });

    await transaction.save();
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/dispute', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const role = getTransactionRole(transaction, req.user._id);
    if (!role) return res.status(403).json({ message: 'Not authorized to dispute this transaction' });

    const dispute = await Dispute.findOneAndUpdate(
      { transaction: transaction._id },
      {
        $setOnInsert: {
          transaction: transaction._id,
          openedBy: req.user._id,
          reason,
          timeline: [{ status: 'opened', note: reason, actor: req.user._id }]
        }
      },
      { upsert: true, new: true }
    );

    transaction.status = 'disputed';
    transaction.escrow = { ...(transaction.escrow || {}), status: 'disputed' };
    transaction.timeline.push({ status: 'disputed', timestamp: new Date(), note: reason || 'Dispute opened' });
    await transaction.save();

    res.status(201).json({ success: true, data: dispute });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/dispute', protect, async (req, res) => {
  try {
    const { status, message, adminNotes } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const role = getTransactionRole(transaction, req.user._id);
    if (!role && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this dispute' });
    }

    const dispute = await Dispute.findOne({ transaction: transaction._id });
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    if (role === 'seller' && status === 'seller_responded') {
      dispute.sellerResponse = { message, respondedAt: new Date() };
    }

    if (req.user.role === 'admin') {
      dispute.adminNotes = adminNotes || dispute.adminNotes;
      if (['resolved_buyer', 'resolved_seller', 'refunded'].includes(status)) {
        dispute.resolvedBy = req.user._id;
        dispute.resolvedAt = new Date();
        transaction.status = status === 'refunded' ? 'cancelled' : 'completed';
        transaction.escrow = {
          ...(transaction.escrow || {}),
          status: status === 'refunded' ? 'refunded' : 'released',
          refundedAt: status === 'refunded' ? new Date() : transaction.escrow?.refundedAt,
          releasedAt: status !== 'refunded' ? new Date() : transaction.escrow?.releasedAt
        };
        if (status === 'refunded') {
          await releaseProductReservation(transaction);
        } else {
          await finalizeProductStock(transaction);
        }
      }
    }

    dispute.status = status || dispute.status;
    dispute.timeline.push({ status: dispute.status, note: message || adminNotes, actor: req.user._id });
    await Promise.all([dispute.save(), transaction.save()]);

    res.json({ success: true, data: dispute });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed transactions' });
    }

    const isBuyer = transaction.buyer.toString() === req.user._id.toString();
    const isSeller = transaction.seller.toString() === req.user._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized to rate this transaction' });
    }

    if (isBuyer) {
      transaction.ratings.sellerRating = {
        score: rating,
        comment,
        createdAt: new Date()
      };
      const seller = await User.findById(transaction.seller);
      seller.updateRating(rating);
      await seller.save();
    } else {
      transaction.ratings.buyerRating = {
        score: rating,
        comment,
        createdAt: new Date()
      };
      const buyer = await User.findById(transaction.buyer);
      buyer.updateRating(rating);
      await buyer.save();
    }

    await transaction.save();
    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
