const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const MarketPrice = require('../models/MarketPrice');
const { protect, authorize } = require('../middleware/auth');
const { detectPests, compressImage } = require('../utils/imageProcessing');
const { generateAIInsights } = require('../utils/aiInsights');
const {
  getPriceRecommendation,
  calculateProductRisk,
  buildFarmerInsights,
  isSellerAvailableToday
} = require('../services/marketplaceIntelligence');
const { success, error, paginate } = require('../utils/apiResponse');
const { productValidation } = require('../middleware/validate');

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

const SELLER_STATUSES = ['draft', 'active', 'reserved', 'expired'];

const getPriceInsight = async ({ category, region, price, unit }) => {
  const numericPrice = Number(price);
  if (!category || !region || !numericPrice) return null;

  const marketPrice = await MarketPrice.findOne({
    category,
    region,
    ...(unit ? { unit } : {})
  }).sort({ date: -1 }).lean();

  const average = marketPrice?.price?.average;
  if (!average) return null;

  const deltaPercent = Math.round(((numericPrice - average) / average) * 100);
  const severity = Math.abs(deltaPercent) >= 25 ? 'warning' : 'ok';
  const direction = deltaPercent > 0 ? 'above' : deltaPercent < 0 ? 'below' : 'at';

  return {
    marketAverage: average,
    deltaPercent,
    severity,
    message: direction === 'at'
      ? 'Price matches the latest market average.'
      : `Price is ${Math.abs(deltaPercent)}% ${direction} the latest market average.`
  };
};

router.get('/price-recommendation', async (req, res) => {
  try {
    const recommendation = await getPriceRecommendation(req.query);
    if (!recommendation) {
      return error(res, 'No market price data available for this category and region', 404);
    }
    return success(res, recommendation, 'Price recommendation retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.post('/', protect, authorize('farmer'), upload.array('images', 5), productValidation, async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      price,
      unit,
      quantity,
      location,
      harvestDate,
      quality,
      organic,
      status,
      availability,
      fulfillment
    } = req.body;
    const productLocation = typeof location === 'string'
      ? JSON.parse(location)
      : location || req.user.location;
    const priceInsight = await getPriceInsight({
      category,
      region: productLocation?.region,
      price,
      unit
    });

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
      organic: organic === true || organic === 'true',
      status: SELLER_STATUSES.includes(status) ? status : 'active',
      availability: typeof availability === 'string' ? JSON.parse(availability) : availability,
      fulfillment: typeof fulfillment === 'string' ? JSON.parse(fulfillment) : fulfillment,
      aiInsights: priceInsight ? {
        priceRecommendation: priceInsight.marketAverage,
        competitorAnalysis: priceInsight.message
      } : undefined
    });

    const productRisk = await calculateProductRisk(await product.populate('seller', 'createdAt verified verification location'));
    product.risk = { ...productRisk, assessedAt: new Date() };
    product.aiInsights = {
      ...(product.aiInsights || {}),
      marketDemand: product.aiInsights?.marketDemand,
      priceRecommendation: product.aiInsights?.priceRecommendation,
      competitorAnalysis: product.aiInsights?.competitorAnalysis,
      farmerInsights: await buildFarmerInsights(product)
    };

    if (req.user.isPremium) {
      const aiInsights = await generateAIInsights(product);
      product.aiInsights = { ...product.aiInsights, ...aiInsights };
    }

    await product.save();

    const productResponse = product.toObject();
    return success(res, { ...productResponse, priceInsight }, 'Product created successfully', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/', async (req, res) => {
  try {
    await Product.expireOldListings();
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
      .populate('seller', 'name phone location rating verified verification')
      .sort(sort)
      .limit(limitNumber)
      .skip((pageNumber - 1) * limitNumber)
      .lean();

    const count = await Product.countDocuments(query);

    const productsWithMeta = products.map((product) => ({
      ...product,
      sellerBadge: product.seller?.verification?.state === 'verified' || product.seller?.verified ? 'verified' : 'unverified',
      sellerAvailableToday: isSellerAvailableToday(product)
    }));

    return paginate(res, productsWithMeta, pageNumber, limitNumber, count, 'Products retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/my/listings', protect, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .sort('-createdAt')
      .lean();
    return success(res, products, 'My listings retrieved');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name phone location rating totalRatings verified verification');
    
    if (!product) {
      return error(res, 'Product not found', 404);
    }

    product.views += 1;
    await product.save();

    const response = product.toObject();
    response.sellerBadge = product.seller?.verification?.state === 'verified' || product.seller?.verified ? 'verified' : 'unverified';
    response.sellerAvailableToday = isSellerAvailableToday(product);
    response.farmerInsights = await buildFarmerInsights(product);

    return success(res, response, 'Product retrieved');
  } catch (err) {
    return error(res, err.message, 500);
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

    const { name, description, price, quantity, status, quality, availability, fulfillment } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (quantity !== undefined) product.quantity = quantity;
    if (status) {
      if (!SELLER_STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Invalid product status for seller update' });
      }
      product.status = status;
    }
    if (quality) product.quality = quality;
    if (availability) product.availability = availability;
    if (fulfillment) product.fulfillment = fulfillment;

    const updatedProduct = await product.save();
    return success(res, updatedProduct, 'Product updated successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized to delete this product', 403);
    }

    await product.deleteOne();
    return success(res, null, 'Product removed');
  } catch (err) {
    return error(res, err.message, 500);
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

module.exports = router;
