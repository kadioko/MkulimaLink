const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'first_sale', 'first_purchase', 'verified_seller', 'top_rated',
      'volume_milestone', 'referral_champion', 'community_leader',
      'early_adopter', 'premium_member', 'loan_repaid', 'streak_7',
      'streak_30', 'streak_90', 'quality_seller', 'fast_responder'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String
  },
  points: {
    type: Number,
    default: 0
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

achievementSchema.index({ user: 1, type: 1 });
achievementSchema.index({ user: 1, unlockedAt: -1 });

const userLevelSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  nextLevelXP: {
    type: Number,
    default: 100
  },
  achievements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  }],
  badges: [String],
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActive: { type: Date }
  },
  stats: {
    totalSales: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalReferrals: { type: Number, default: 0 },
    communityPosts: { type: Number, default: 0 },
    helpfulReviews: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

userLevelSchema.methods.addExperience = function(xp) {
  this.experience += xp;
  
  while (this.experience >= this.nextLevelXP) {
    this.level += 1;
    this.experience -= this.nextLevelXP;
    this.nextLevelXP = Math.floor(this.nextLevelXP * 1.5);
  }
  
  return this.level;
};

userLevelSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!this.streak.lastActive) {
    this.streak.current = 1;
    this.streak.lastActive = today;
  } else {
    const lastActive = new Date(this.streak.lastActive);
    lastActive.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      this.streak.current += 1;
      if (this.streak.current > this.streak.longest) {
        this.streak.longest = this.streak.current;
      }
    } else if (daysDiff > 1) {
      this.streak.current = 1;
    }
    
    this.streak.lastActive = today;
  }
  
  return this.streak.current;
};

const Achievement = mongoose.model('Achievement', achievementSchema);
const UserLevel = mongoose.model('UserLevel', userLevelSchema);

module.exports = { Achievement, UserLevel };



