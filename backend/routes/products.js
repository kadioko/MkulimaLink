const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const { detectPests, compressImage } = require('../utils/imageProcessing');
const { generateAIInsights } = require('../utils/aiInsights');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

router.post('/', protect, authorize('farmer'), upload.array('images', 5), async (req, res) => {
  try {
    const { name, category, description, price, unit, quantity, location, harvestDate, quality, organic } = req.body;
    const productLocation = typeof location === 'string'
      ? JSON.parse(location)
      : location || req.user.location;

    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const compressedPath = await compressImage(file.path);
        const pestDetection = await detectPests(compressedPath);
        
        images.push({
          url: `/uploads/products/${path.basename(compressedPath)}`,
          pestDetection
        });
      }
    }

    const product = await Product.create({
      seller: req.user._id,
      name,
      category,
      description,
      price,
      unit,
      quantity,
      images,
      location: productLocation,
      harvestDate,
      quality,
      organic: organic === true || organic === 'true'
    });

    if (req.user.isPremium) {
      const aiInsights = await generateAIInsights(product);
      product.aiInsights = aiInsights;
      await product.save();
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      region, 
      district, 
      minPrice, 
      maxPrice, 
      quality, 
      organic, 
      search,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query = { status: 'active' };

    if (category) query.category = category;
    if (region) query['location.region'] = region;
    if (district) query['location.district'] = district;
    if (quality) query.quality = quality;
    if (organic) query.organic = organic === 'true';
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const pageNumber = Number.parseInt(page, 10) || 1;
    const limitNumber = Number.parseInt(limit, 10) || 20;

    const products = await Product.find(query)
      .populate('seller', 'name phone location rating')
      .sort(sort)
      .limit(limitNumber)
      .skip((pageNumber - 1) * limitNumber)
      .lean();

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limitNumber),
      currentPage: pageNumber,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name phone location rating totalRatings');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.views += 1;
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const { name, description, price, quantity, status, quality } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (quantity !== undefined) product.quantity = quantity;
    if (status) product.status = status;
    if (quality) product.quality = quality;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/favorite', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const index = product.favorites.indexOf(req.user._id);
    if (index > -1) {
      product.favorites.splice(index, 1);
    } else {
      product.favorites.push(req.user._id);
    }

    await product.save();
    res.json({ favorites: product.favorites.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my/listings', protect, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .sort('-createdAt');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
