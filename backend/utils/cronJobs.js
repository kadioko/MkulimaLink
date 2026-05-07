const cron = require('node-cron');
const { scrapeMarketPrices } = require('./marketScraper');
const User = require('../models/User');
const Product = require('../models/Product');
const Auction = require('../models/Auction');
const { sendSMS } = require('./sms');
const { handleAuctionEnding, handleEndedAuctions } = require('./socketHandlers');

const startCronJobs = () => {
  cron.schedule('0 6 * * *', async () => {
    console.log('Running daily market price update...');
    await scrapeMarketPrices();
  });

  cron.schedule('0 8 * * *', async () => {
    console.log('Checking for expiring products...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldProducts = await Product.find({
      status: 'active',
      createdAt: { $lt: thirtyDaysAgo }
    }).populate('seller');

    for (const product of oldProducts) {
      if (product.seller && product.seller.phone) {
        await sendSMS(
          product.seller.phone,
          `Your listing "${product.name}" has been active for 30+ days. Consider updating the price or status.`
        );
      }
    }
  });

  cron.schedule('0 0 * * *', async () => {
    console.log('Checking premium subscriptions...');
    
    const expiredUsers = await User.find({
      isPremium: true,
      premiumExpiresAt: { $lt: new Date() }
    });

    for (const user of expiredUsers) {
      user.isPremium = false;
      await user.save();

      if (user.phone) {
        await sendSMS(
          user.phone,
          'Your MkulimaLink Premium subscription has expired. Renew now to continue enjoying premium features!'
        );
      }
    }
  });

  cron.schedule('0 */6 * * *', async () => {
    console.log('Updating product AI insights for premium users...');
    
    const premiumUsers = await User.find({ isPremium: true });
    const premiumUserIds = premiumUsers.map(u => u._id);

    const products = await Product.find({
      seller: { $in: premiumUserIds },
      status: 'active'
    }).limit(50);

    const { generateAIInsights } = require('./aiInsights');
    
    for (const product of products) {
      try {
        const insights = await generateAIInsights(product);
        product.aiInsights = insights;
        await product.save();
      } catch (error) {
        console.error(`Error updating insights for product ${product._id}:`, error);
      }
    }
  });

  // Auction ending soon notifications (every minute)
  cron.schedule('* * * * *', async () => {
    const io = global.io;
    if (io) {
      await handleAuctionEnding(io);
    }
  });

  // End expired auctions (every minute)
  cron.schedule('* * * * *', async () => {
    const io = global.io;
    if (io) {
      await handleEndedAuctions(io);
    }
  });

  console.log('Cron jobs started successfully');
};

module.exports = { startCronJobs };
