const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { protect } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const existing = await Supplier.findOne({ user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You already have a supplier profile' });
    }

    const supplier = await Supplier.create({
      ...req.body,
      user: req.user._id
    });

    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { type, region, search, verified, page = 1, limit = 20 } = req.query;
    const query = { status: 'active' };

    if (type) query.type = type;
    if (region) query['location.region'] = region;
    if (verified === 'true') query.isVerified = true;
    if (search) {
      query.$text = { $search: search };
    }

    const suppliers = await Supplier.find(query)
      .populate('user', 'name rating')
      .sort({ isFeatured: -1, 'ratings.average': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Supplier.countDocuments(query);

    res.json({
      suppliers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/types', (req, res) => {
  res.json([
    { id: 'seeds', name: 'Seeds & Seedlings', icon: '🌱' },
    { id: 'fertilizer', name: 'Fertilizers', icon: '🧪' },
    { id: 'pesticides', name: 'Pesticides & Herbicides', icon: '🔬' },
    { id: 'equipment', name: 'Farm Equipment', icon: '🚜' },
    { id: 'livestock', name: 'Livestock & Feed', icon: '🐄' },
    { id: 'packaging', name: 'Packaging Materials', icon: '📦' },
    { id: 'transport', name: 'Transport Services', icon: '🚛' }
  ]);
});

router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate('user', 'name rating phone')
      .populate('reviews.user', 'name');

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    if (supplier.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(supplier, req.body);
    await supplier.save();

    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/products', protect, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier || supplier.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    supplier.products.push(req.body);
    await supplier.save();

    res.status(201).json(supplier.products[supplier.products.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const existingReview = supplier.reviews.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment;
    } else {
      supplier.reviews.push({ user: req.user._id, rating, comment });
    }

    const totalRating = supplier.reviews.reduce((sum, r) => sum + r.rating, 0);
    supplier.ratings.average = totalRating / supplier.reviews.length;
    supplier.ratings.count = supplier.reviews.length;

    await supplier.save();

    res.json({ message: 'Review submitted', ratings: supplier.ratings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my/profile', protect, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ user: req.user._id });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;



