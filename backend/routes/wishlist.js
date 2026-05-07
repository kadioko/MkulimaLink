const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const auth = require('../middleware/auth');

// Get user's wishlist
router.get('/', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.getOrCreate(req.user.id);
    
    await wishlist.populate({
      path: 'items.product',
      select: 'name price currency unit images category location quality status seller',
      populate: {
        path: 'seller',
        select: 'name profilePicture verified'
      }
    });
    
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add item to wishlist
router.post('/items', auth, async (req, res) => {
  try {
    const { productId, notes = '', priority = 'medium' } = req.body;
    const wishlist = await Wishlist.getOrCreate(req.user.id);
    
    await wishlist.addItem(productId, notes, priority);
    await wishlist.populate('items.product', 'name price currency unit images category');
    
    res.status(201).json({
      success: true,
      item: wishlist.items[wishlist.items.length - 1],
      totalItems: wishlist.items.length
    });
  } catch (error) {
    if (error.message === 'Item already in wishlist') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Remove item from wishlist
router.delete('/items/:productId', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.getOrCreate(req.user.id);
    await wishlist.removeItem(req.params.productId);
    
    res.json({
      success: true,
      totalItems: wishlist.items.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle wishlist item (add if not exists, remove if exists)
router.post('/toggle/:productId', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.getOrCreate(req.user.id);
    const exists = wishlist.hasItem(req.params.productId);
    
    if (exists) {
      await wishlist.removeItem(req.params.productId);
      res.json({ inWishlist: false, totalItems: wishlist.items.length });
    } else {
      await wishlist.addItem(req.params.productId);
      res.json({ inWishlist: true, totalItems: wishlist.items.length });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if product is in wishlist
router.get('/check/:productId', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.getOrCreate(req.user.id);
    const inWishlist = wishlist.hasItem(req.params.productId);
    res.json({ inWishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wishlist count
router.get('/count', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.getOrCreate(req.user.id);
    res.json({ count: wishlist.items.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update wishlist item
router.patch('/items/:productId', auth, async (req, res) => {
  try {
    const { notes, priority } = req.body;
    const wishlist = await Wishlist.getOrCreate(req.user.id);
    
    const item = wishlist.items.find(i => 
      i.product.toString() === req.params.productId
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found in wishlist' });
    }
    
    if (notes !== undefined) item.notes = notes;
    if (priority !== undefined) item.priority = priority;
    
    await wishlist.save();
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create collection
router.post('/collections', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const wishlist = await Wishlist.getOrCreate(req.user.id);
    
    wishlist.collections.push({
      name,
      items: [],
      createdAt: new Date()
    });
    
    await wishlist.save();
    res.status(201).json({
      success: true,
      collection: wishlist.collections[wishlist.collections.length - 1]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add item to collection
router.post('/collections/:collectionId/items', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    const wishlist = await Wishlist.getOrCreate(req.user.id);
    
    const collection = wishlist.collections.id(req.params.collectionId);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    if (!collection.items.includes(productId)) {
      collection.items.push(productId);
      await wishlist.save();
    }
    
    res.json({ success: true, collection });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
