const express = require('express');
const router = express.Router();
const { PriceAlert, Watchlist } = require('../models/PriceAlert');
const { protect } = require('../middleware/auth');

router.post('/price-alert', protect, async (req, res) => {
  try {
    const { product, category, region, market, condition, notifications, frequency, expiresAt, notes } = req.body;

    const alert = await PriceAlert.create({
      user: req.user._id,
      product,
      category,
      region,
      market,
      condition,
      notifications: notifications || { sms: true, push: true },
      frequency: frequency || 'instant',
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes
    });

    res.status(201).json({
      message: 'Price alert created',
      alert
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/price-alerts', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }

    const alerts = await PriceAlert.find(query).sort('-createdAt');

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/price-alert/:id', protect, async (req, res) => {
  try {
    const alert = await PriceAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (alert.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { condition, notifications, frequency, status } = req.body;

    if (condition) alert.condition = condition;
    if (notifications) alert.notifications = notifications;
    if (frequency) alert.frequency = frequency;
    if (status) alert.status = status;

    await alert.save();

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/price-alert/:id', protect, async (req, res) => {
  try {
    const alert = await PriceAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    if (alert.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await alert.deleteOne();

    res.json({ message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/watchlist', protect, async (req, res) => {
  try {
    const { name } = req.body;

    const watchlist = await Watchlist.create({
      user: req.user._id,
      name: name || 'My Watchlist',
      items: []
    });

    res.status(201).json(watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/watchlist', protect, async (req, res) => {
  try {
    let watchlist = await Watchlist.findOne({ user: req.user._id, isDefault: true });

    if (!watchlist) {
      watchlist = await Watchlist.create({
        user: req.user._id,
        name: 'My Watchlist',
        isDefault: true,
        items: []
      });
    }

    res.json(watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/watchlist/add', protect, async (req, res) => {
  try {
    const { type, referenceId, name, category, region, notes } = req.body;

    let watchlist = await Watchlist.findOne({ user: req.user._id, isDefault: true });

    if (!watchlist) {
      watchlist = await Watchlist.create({
        user: req.user._id,
        name: 'My Watchlist',
        isDefault: true,
        items: []
      });
    }

    const existingItem = watchlist.items.find(
      item => item.type === type && item.referenceId?.toString() === referenceId
    );

    if (existingItem) {
      return res.status(400).json({ message: 'Item already in watchlist' });
    }

    watchlist.items.push({
      type,
      referenceId,
      name,
      category,
      region,
      notes
    });

    await watchlist.save();

    res.json({
      message: 'Added to watchlist',
      watchlist
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/watchlist/item/:itemId', protect, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({ user: req.user._id, isDefault: true });

    if (!watchlist) {
      return res.status(404).json({ message: 'Watchlist not found' });
    }

    watchlist.items = watchlist.items.filter(
      item => item._id.toString() !== req.params.itemId
    );

    await watchlist.save();

    res.json({ message: 'Item removed from watchlist' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/watchlist/item/:itemId/alert', protect, async (req, res) => {
  try {
    const { condition } = req.body;
    const watchlist = await Watchlist.findOne({ user: req.user._id, isDefault: true });

    if (!watchlist) {
      return res.status(404).json({ message: 'Watchlist not found' });
    }

    const item = watchlist.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const alert = await PriceAlert.create({
      user: req.user._id,
      product: item.name,
      category: item.category,
      region: item.region,
      condition,
      notifications: { sms: true, push: true }
    });

    item.alerts.push(alert._id);
    await watchlist.save();

    res.json({
      message: 'Alert added to watchlist item',
      alert
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



