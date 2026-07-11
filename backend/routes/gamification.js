const express = require('express');
const router = express.Router();
const { Achievement, UserLevel } = require('../models/Achievement');
const { protect } = require('../middleware/auth');

const ACHIEVEMENT_DEFINITIONS = {
  first_sale: { title: 'First Sale', description: 'Made your first sale', points: 50, icon: '🎉' },
  first_purchase: { title: 'First Purchase', description: 'Made your first purchase', points: 30, icon: '🛒' },
  verified_seller: { title: 'Verified Seller', description: 'Account verified', points: 100, icon: '✓' },
  top_rated: { title: 'Top Rated', description: 'Achieved 4.5+ rating', points: 150, icon: '⭐' },
  volume_milestone: { title: 'Volume Champion', description: 'Sold over 1000kg', points: 200, icon: '📦' },
  referral_champion: { title: 'Referral Champion', description: 'Referred 10+ users', points: 250, icon: '👥' },
  community_leader: { title: 'Community Leader', description: 'Created a community', points: 100, icon: '👑' },
  early_adopter: { title: 'Early Adopter', description: 'Joined in first 1000 users', points: 500, icon: '🚀' },
  premium_member: { title: 'Premium Member', description: 'Subscribed to premium', points: 150, icon: '💎' },
  loan_repaid: { title: 'Trustworthy', description: 'Repaid loan on time', points: 200, icon: '💰' },
  streak_7: { title: '7-Day Streak', description: 'Active for 7 days straight', points: 75, icon: '🔥' },
  streak_30: { title: '30-Day Streak', description: 'Active for 30 days straight', points: 200, icon: '🔥🔥' },
  streak_90: { title: '90-Day Streak', description: 'Active for 90 days straight', points: 500, icon: '🔥🔥🔥' },
  quality_seller: { title: 'Quality Seller', description: 'No complaints in 50+ sales', points: 300, icon: '🏆' },
  fast_responder: { title: 'Fast Responder', description: 'Average response time < 1 hour', points: 100, icon: '⚡' }
};

router.get('/profile', protect, async (req, res) => {
  try {
    let userLevel = await UserLevel.findOne({ user: req.user._id })
      .populate('achievements');

    if (!userLevel) {
      userLevel = await UserLevel.create({
        user: req.user._id,
        level: 1,
        experience: 0,
        nextLevelXP: 100
      });
    }

    userLevel.updateStreak();
    await userLevel.save();

    res.json(userLevel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/unlock-achievement', protect, async (req, res) => {
  try {
    const { type, metadata } = req.body;

    const definition = ACHIEVEMENT_DEFINITIONS[type];
    if (!definition) {
      return res.status(400).json({ message: 'Invalid achievement type' });
    }

    const existing = await Achievement.findOne({
      user: req.user._id,
      type
    });

    if (existing) {
      return res.status(400).json({ message: 'Achievement already unlocked' });
    }

    const achievement = await Achievement.create({
      user: req.user._id,
      type,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      points: definition.points,
      metadata
    });

    let userLevel = await UserLevel.findOne({ user: req.user._id });
    if (!userLevel) {
      userLevel = await UserLevel.create({ user: req.user._id });
    }

    userLevel.achievements.push(achievement._id);
    const newLevel = userLevel.addExperience(definition.points);
    await userLevel.save();

    res.json({
      achievement,
      leveledUp: newLevel > userLevel.level - 1,
      newLevel,
      totalXP: userLevel.experience
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'level', limit = 10 } = req.query;

    let sortField = 'level';
    if (type === 'xp') sortField = 'experience';
    else if (type === 'streak') sortField = 'streak.current';
    else if (type === 'sales') sortField = 'stats.totalSales';

    const leaderboard = await UserLevel.find()
      .populate('user', 'name location avatar')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/daily-checkin', protect, async (req, res) => {
  try {
    let userLevel = await UserLevel.findOne({ user: req.user._id });
    if (!userLevel) {
      userLevel = await UserLevel.create({ user: req.user._id });
    }

    const streak = userLevel.updateStreak();
    const xpGained = 10 + (streak >= 7 ? 20 : 0) + (streak >= 30 ? 50 : 0);
    
    userLevel.addExperience(xpGained);
    await userLevel.save();

    let newAchievement = null;
    if (streak === 7 && !await Achievement.findOne({ user: req.user._id, type: 'streak_7' })) {
      newAchievement = await Achievement.create({
        user: req.user._id,
        type: 'streak_7',
        ...ACHIEVEMENT_DEFINITIONS.streak_7
      });
      userLevel.achievements.push(newAchievement._id);
      await userLevel.save();
    }

    res.json({
      message: 'Daily check-in successful!',
      streak,
      xpGained,
      newAchievement,
      userLevel
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/achievements/available', (req, res) => {
  res.json(ACHIEVEMENT_DEFINITIONS);
});

module.exports = router;



