const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

router.get('/my-code', protect, async (req, res) => {
  try {
    let referralCode = req.user.referralCode;
    
    if (!referralCode) {
      referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      req.user.referralCode = referralCode;
      await req.user.save();
    }

    const referrals = await Referral.find({ referrer: req.user._id })
      .populate('referred', 'name createdAt')
      .sort('-createdAt');

    const stats = {
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter(r => r.status === 'completed').length,
      pendingRewards: referrals.filter(r => r.status === 'completed' && !r.rewardPaid).length,
      totalEarned: referrals.filter(r => r.rewardPaid).reduce((sum, r) => sum + r.referrerReward, 0)
    };

    res.json({
      referralCode,
      referralLink: `${process.env.FRONTEND_URL}/register?ref=${referralCode}`,
      stats,
      referrals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/apply-code', protect, async (req, res) => {
  try {
    const { referralCode } = req.body;

    const existingReferral = await Referral.findOne({ referred: req.user._id });
    if (existingReferral) {
      return res.status(400).json({ message: 'You have already used a referral code' });
    }

    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }

    if (referrer._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot use your own referral code' });
    }

    const referral = await Referral.create({
      referrer: referrer._id,
      referred: req.user._id,
      referralCode,
      status: 'pending'
    });

    req.user.balance += referral.referredReward;
    await req.user.save();

    res.json({
      message: `Referral applied! You received ${referral.referredReward} TZS credit`,
      reward: referral.referredReward,
      newBalance: req.user.balance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/complete/:id', protect, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);
    
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    if (referral.status !== 'pending') {
      return res.status(400).json({ message: 'Referral already processed' });
    }

    referral.status = 'completed';
    referral.completedAt = new Date();
    await referral.save();

    const referrer = await User.findById(referral.referrer);
    referrer.balance += referral.referrerReward;
    await referrer.save();

    referral.rewardPaid = true;
    await referral.save();

    res.json({
      message: 'Referral completed and rewards paid',
      referral
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Referral.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$referrer',
          totalReferrals: { $sum: 1 },
          totalEarned: { $sum: '$referrerReward' }
        }
      },
      { $sort: { totalReferrals: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          location: '$user.location',
          totalReferrals: 1,
          totalEarned: 1
        }
      }
    ]);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



