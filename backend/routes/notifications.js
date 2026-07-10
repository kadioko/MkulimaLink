const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const { protect } = require('../middleware/auth');
const { success, error } = require('../utils/apiResponse');
const logger = require('../utils/logger');

router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { user: req.user._id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Notification.countDocuments(query);

    res.json({
      notifications,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.deleteOne();
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      read: false
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Push notification subscription
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return error(res, 'Invalid push subscription payload', 400);
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { user: req.user._id, endpoint, keys, isActive: true },
      { upsert: true, new: true }
    );

    return success(res, null, 'Push subscription saved');
  } catch (err) {
    logger.error('Push subscription error:', err);
    return error(res, err.message, 500);
  }
});

router.post('/unsubscribe', protect, async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.findOneAndUpdate(
      { endpoint, user: req.user._id },
      { isActive: false }
    );
    return success(res, null, 'Push subscription deactivated');
  } catch (err) {
    logger.error('Push unsubscribe error:', err);
    return error(res, err.message, 500);
  }
});

// Send push to a user (internal helper)
async function sendPushNotification(userId, payload) {
  try {
    const subscriptions = await PushSubscription.find({ user: userId, isActive: true });
    if (subscriptions.length === 0) return;

    let webpush;
    try {
      webpush = require('web-push');
    } catch {
      logger.warn('web-push not installed; cannot send push notifications');
      return;
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:push@mkulimalink.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    await Promise.all(
      subscriptions.map((sub) =>
        webpush
          .sendNotification(sub.toObject(), JSON.stringify(payload))
          .catch((err) => logger.error('Push send error:', err.message))
      )
    );
  } catch (err) {
    logger.error('sendPushNotification error:', err);
  }
}

module.exports = router;
module.exports.sendPushNotification = sendPushNotification;
