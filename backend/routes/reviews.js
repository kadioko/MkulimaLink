const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const { transactionId, rating, qualityRating, communicationRating, deliveryRating, comment, images } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed transactions' });
    }

    const isBuyer = transaction.buyer.toString() === req.user._id.toString();
    const isSeller = transaction.seller.toString() === req.user._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized to review this transaction' });
    }

    const existingReview = await Review.findOne({ transaction: transactionId, reviewer: req.user._id });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this transaction' });
    }

    const reviewee = isBuyer ? transaction.seller : transaction.buyer;

    const review = await Review.create({
      transaction: transactionId,
      reviewer: req.user._id,
      reviewee,
      product: transaction.product,
      rating,
      qualityRating,
      communicationRating,
      deliveryRating,
      comment,
      images: images || []
    });

    const user = await User.findById(reviewee);
    user.updateRating(rating);
    await user.save();

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name location')
      .populate('product', 'name')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Review.countDocuments({ reviewee: req.params.userId });

    const stats = await Review.aggregate([
      { $match: { reviewee: mongoose.Types.ObjectId(req.params.userId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          avgQuality: { $avg: '$qualityRating' },
          avgCommunication: { $avg: '$communicationRating' },
          avgDelivery: { $avg: '$deliveryRating' },
          total: { $sum: 1 },
          fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      reviews,
      stats: stats[0] || {},
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('reviewer', 'name location rating')
      .sort('-createdAt')
      .limit(20);

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/helpful', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const index = review.helpful.indexOf(req.user._id);
    if (index > -1) {
      review.helpful.splice(index, 1);
    } else {
      review.helpful.push(req.user._id);
    }

    await review.save();
    res.json({ helpfulCount: review.helpful.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/report', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.reported = true;
    await review.save();

    res.json({ message: 'Review reported for moderation' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



