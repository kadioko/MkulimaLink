const express = require('express');
const router = express.Router();
const GroupBuy = require('../models/GroupBuy');
const { protect } = require('../middleware/auth');
const { emitToRegion } = require('../utils/socket');

router.post('/create', protect, async (req, res) => {
  try {
    const { title, description, type, product, pricing, quantity, timeline, location, delivery, rules, milestones, visibility, community } = req.body;

    const savingsPercentage = pricing.originalPrice ? 
      ((pricing.originalPrice - pricing.groupPrice) / pricing.originalPrice) * 100 : 0;

    const groupBuy = await GroupBuy.create({
      title,
      description,
      type,
      organizer: req.user._id,
      product,
      pricing: {
        ...pricing,
        savings: pricing.originalPrice - pricing.groupPrice,
        savingsPercentage
      },
      quantity: {
        ...quantity,
        current: 0
      },
      timeline,
      location,
      delivery,
      rules,
      milestones: milestones || [
        { percentage: 50, discount: 5, reached: false },
        { percentage: 100, discount: 10, reached: false },
        { percentage: 150, discount: 15, reached: false }
      ],
      status: 'open',
      visibility,
      community
    });

    if (location?.region) {
      emitToRegion(location.region, 'new_group_buy', {
        id: groupBuy._id,
        title: groupBuy.title,
        product: groupBuy.product.name,
        savings: savingsPercentage
      });
    }

    res.status(201).json(groupBuy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { region, type, category, status, page = 1, limit = 20 } = req.query;

    const query = { visibility: 'public' };
    if (region) query['location.region'] = region;
    if (type) query.type = type;
    if (category) query['product.category'] = category;
    if (status) query.status = status;
    else query.status = { $in: ['open', 'minimum_reached'] };

    const groupBuys = await GroupBuy.find(query)
      .populate('organizer', 'name rating location')
      .sort({ 'timeline.endDate': 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await GroupBuy.countDocuments(query);

    res.json({
      groupBuys,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const groupBuy = await GroupBuy.findById(req.params.id)
      .populate('organizer', 'name rating location phone')
      .populate('participants.user', 'name location')
      .populate('supplier', 'name rating');

    if (!groupBuy) {
      return res.status(404).json({ message: 'Group buy not found' });
    }

    const savings = groupBuy.calculateSavings();

    res.json({
      ...groupBuy.toObject(),
      savings,
      progress: (groupBuy.quantity.current / groupBuy.quantity.minimum) * 100,
      participantCount: groupBuy.participants.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/join', protect, async (req, res) => {
  try {
    const { quantity } = req.body;
    const groupBuy = await GroupBuy.findById(req.params.id);

    if (!groupBuy) {
      return res.status(404).json({ message: 'Group buy not found' });
    }

    if (!['open', 'minimum_reached'].includes(groupBuy.status)) {
      return res.status(400).json({ message: 'This group buy is no longer accepting participants' });
    }

    if (new Date() > new Date(groupBuy.timeline.endDate)) {
      return res.status(400).json({ message: 'This group buy has ended' });
    }

    if (groupBuy.rules?.minQuantityPerPerson && quantity < groupBuy.rules.minQuantityPerPerson) {
      return res.status(400).json({ message: `Minimum quantity is ${groupBuy.rules.minQuantityPerPerson}` });
    }

    if (groupBuy.rules?.maxQuantityPerPerson && quantity > groupBuy.rules.maxQuantityPerPerson) {
      return res.status(400).json({ message: `Maximum quantity is ${groupBuy.rules.maxQuantityPerPerson}` });
    }

    await groupBuy.addParticipant(req.user._id, quantity);

    res.json({
      message: 'Successfully joined group buy',
      groupBuy,
      yourOrder: {
        quantity,
        amount: quantity * groupBuy.pricing.groupPrice
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/leave', protect, async (req, res) => {
  try {
    const groupBuy = await GroupBuy.findById(req.params.id);

    if (!groupBuy) {
      return res.status(404).json({ message: 'Group buy not found' });
    }

    if (!groupBuy.rules?.allowCancellation) {
      return res.status(400).json({ message: 'Cancellation not allowed for this group buy' });
    }

    const participantIndex = groupBuy.participants.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );

    if (participantIndex === -1) {
      return res.status(400).json({ message: 'You are not a participant' });
    }

    const participant = groupBuy.participants[participantIndex];
    groupBuy.quantity.current -= participant.quantity;
    groupBuy.participants.splice(participantIndex, 1);

    if (groupBuy.quantity.current < groupBuy.quantity.minimum && groupBuy.status === 'minimum_reached') {
      groupBuy.status = 'open';
    }

    await groupBuy.save();

    res.json({ message: 'Successfully left group buy' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my/organized', protect, async (req, res) => {
  try {
    const groupBuys = await GroupBuy.find({ organizer: req.user._id })
      .sort('-createdAt');

    res.json(groupBuys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my/joined', protect, async (req, res) => {
  try {
    const groupBuys = await GroupBuy.find({
      'participants.user': req.user._id
    })
    .populate('organizer', 'name')
    .sort('-createdAt');

    res.json(groupBuys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const groupBuy = await GroupBuy.findById(req.params.id);

    if (!groupBuy) {
      return res.status(404).json({ message: 'Group buy not found' });
    }

    if (groupBuy.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only organizer can update status' });
    }

    groupBuy.status = status;
    await groupBuy.save();

    res.json(groupBuy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/message', protect, async (req, res) => {
  try {
    const { message, type } = req.body;
    const groupBuy = await GroupBuy.findById(req.params.id);

    if (!groupBuy) {
      return res.status(404).json({ message: 'Group buy not found' });
    }

    if (groupBuy.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only organizer can send messages' });
    }

    groupBuy.communications.push({
      type: type || 'update',
      message,
      sentAt: new Date()
    });

    await groupBuy.save();

    res.json({ message: 'Message sent to participants' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



