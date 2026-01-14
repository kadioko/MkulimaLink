/**
 * AR/VR Routes
 * Handles augmented and virtual reality product visualization
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const arvrVisualizationService = require('../services/arvrVisualizationService');
const { ARVRModel } = require('../models/ARVR');
const { Product } = require('../models/Product');

// Configure multer for AR/VR file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for 3D models
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // 3D models
      'model/gltf+json', 'model/gltf-binary', 'application/octet-stream',
      // Images (textures, markers)
      'image/jpeg', 'image/png', 'image/webp',
      // Other
      'application/json'
    ];

    const allowedExtensions = ['.gltf', '.glb', '.obj', '.fbx', '.dae', '.jpg', '.jpeg', '.png', '.webp', '.json', '.bin'];

    const fileExtension = require('path').extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype} or extension: ${fileExtension}`), false);
    }
  }
});

// Upload 3D model for product
router.post('/upload/:productId', protect, upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      });
    }

    const { productId } = req.params;
    const metadata = req.body;

    const result = await arvrVisualizationService.upload3DModel(
      req.user._id,
      productId,
      req.files,
      metadata
    );

    res.status(201).json({
      success: true,
      message: '3D model uploaded successfully',
      data: result
    });
  } catch (error) {
    console.error('Upload 3D model error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload 3D model',
      error: error.message
    });
  }
});

// Get AR/VR model for product
router.get('/model/:productId', async (req, res) => {
  try {
    const model = await arvrVisualizationService.getProductARVRModel(req.params.productId);

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'No AR/VR model found for this product'
      });
    }

    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error('Get AR/VR model error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AR/VR model',
      error: error.message
    });
  }
});

// Create AR marker for product
router.post('/marker/:productId', protect, upload.single('marker'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No marker image provided'
      });
    }

    const markerData = req.body;
    const result = await arvrVisualizationService.createARMarker(
      req.params.productId,
      req.file,
      markerData
    );

    res.status(201).json({
      success: true,
      message: 'AR marker created successfully',
      data: result
    });
  } catch (error) {
    console.error('Create AR marker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create AR marker',
      error: error.message
    });
  }
});

// Generate AR experience configuration
router.get('/experience/:productId', async (req, res) => {
  try {
    const userPreferences = {
      experience_type: req.query.experience_type,
      lighting_conditions: req.query.lighting,
      surface_requirements: req.query.surface,
      tracking_quality: req.query.tracking,
      model_scale: req.query.scale ? parseFloat(req.query.scale) : undefined,
      allow_scaling: req.query.allow_scaling !== 'false',
      allow_rotation: req.query.allow_rotation !== 'false',
      show_measurements: req.query.show_measurements === 'true',
      show_price_info: req.query.show_price_info !== 'false'
    };

    const experienceConfig = await arvrVisualizationService.generateARExperience(
      req.params.productId,
      userPreferences
    );

    res.json({
      success: true,
      data: experienceConfig
    });
  } catch (error) {
    console.error('Generate AR experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AR experience',
      error: error.message
    });
  }
});

// Generate VR showroom experience
router.get('/showroom/:category', async (req, res) => {
  try {
    const userPreferences = {
      theme: req.query.theme,
      layout: req.query.layout,
      navigation_type: req.query.navigation,
      product_scale: req.query.scale ? parseFloat(req.query.scale) : undefined,
      skybox: req.query.skybox,
      lighting: req.query.lighting,
      ambient_sound: req.query.sound,
      weather_effects: req.query.weather === 'true'
    };

    const showroomConfig = await arvrVisualizationService.generateVRShowroom(
      req.params.category,
      userPreferences
    );

    res.json({
      success: true,
      data: showroomConfig
    });
  } catch (error) {
    console.error('Generate VR showroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate VR showroom',
      error: error.message
    });
  }
});

// Record AR/VR interaction
router.post('/interaction/:modelId', async (req, res) => {
  try {
    const { interaction_type, user_id, metadata } = req.body;

    await arvrVisualizationService.recordInteraction(
      req.params.modelId,
      interaction_type,
      user_id,
      metadata
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Record interaction error:', error);
    // Don't return error - analytics shouldn't break the experience
    res.json({ success: false });
  }
});

// Get AR/VR analytics for seller
router.get('/analytics', protect, async (req, res) => {
  try {
    const productId = req.query.product_id;
    const analytics = await arvrVisualizationService.getARVRAnalytics(req.user._id, productId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get AR/VR analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AR/VR analytics',
      error: error.message
    });
  }
});

// Browse AR/VR models
router.get('/browse', async (req, res) => {
  try {
    const {
      category,
      search,
      supports_ar,
      supports_vr,
      min_file_size,
      max_file_size,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (supports_ar !== undefined) filters.supportsAR = supports_ar === 'true';
    if (supports_vr !== undefined) filters.supportsVR = supports_vr === 'true';
    if (min_file_size) filters.minFileSize = parseInt(min_file_size);
    if (max_file_size) filters.maxFileSize = parseInt(max_file_size);

    // For now, return popular models (enhance with proper filtering later)
    const models = await ARVRModel.getPopularModels(parseInt(limit));

    const formattedModels = models.map(model => ({
      id: model._id,
      title: model.metadata?.title || 'AR/VR Model',
      description: model.metadata?.description,
      thumbnail_url: model.model_files?.model ?
        Object.values(model.model_files.model)[0]?.url?.replace(/\.[^/.]+$/, '_thumb.jpg') : null,
      views: model.view_count,
      likes: model.like_count,
      product: model.product,
      uploaded_by: model.uploaded_by,
      compatibility: model.compatibility,
      created_at: model.createdAt
    }));

    res.json({
      success: true,
      data: {
        models: formattedModels,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: formattedModels.length,
          pages: 1
        }
      }
    });
  } catch (error) {
    console.error('Browse AR/VR models error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to browse AR/VR models',
      error: error.message
    });
  }
});

// Search AR/VR models
router.get('/search', async (req, res) => {
  try {
    const { q: query, category, supports_ar, supports_vr, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const filters = {};
    if (category) filters.category = category;
    if (supports_ar !== undefined) filters.supportsAR = supports_ar === 'true';
    if (supports_vr !== undefined) filters.supportsVR = supports_vr === 'true';

    const models = await ARVRModel.searchModels(query, filters, parseInt(limit));

    res.json({
      success: true,
      data: models.map(model => ({
        id: model._id,
        title: model.metadata?.title || 'AR/VR Model',
        description: model.metadata?.description,
        thumbnail_url: model.model_files?.model ?
          Object.values(model.model_files.model)[0]?.url?.replace(/\.[^/.]+$/, '_thumb.jpg') : null,
        views: model.view_count,
        likes: model.like_count,
        product: model.product,
        uploaded_by: model.uploaded_by,
        compatibility: model.compatibility
      }))
    });
  } catch (error) {
    console.error('Search AR/VR models error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search AR/VR models',
      error: error.message
    });
  }
});

// Delete AR/VR model
router.delete('/model/:modelId', protect, async (req, res) => {
  try {
    const result = await arvrVisualizationService.deleteARVRModel(req.params.modelId, req.user._id);

    res.json(result);
  } catch (error) {
    console.error('Delete AR/VR model error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete AR/VR model',
      error: error.message
    });
  }
});

// Update AR/VR model metadata
router.put('/model/:modelId/metadata', protect, async (req, res) => {
  try {
    const model = await ARVRModel.findOne({
      _id: req.params.modelId,
      uploaded_by: req.user._id
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'AR/VR model not found or you are not the owner'
      });
    }

    const { title, description, tags, compatibility } = req.body;

    if (title) model.metadata.title = title;
    if (description) model.metadata.description = description;
    if (tags) await model.addTags(tags);
    if (compatibility) {
      model.compatibility = { ...model.compatibility, ...compatibility };
    }

    await model.save();

    res.json({
      success: true,
      message: 'AR/VR model metadata updated successfully',
      data: {
        id: model._id,
        title: model.metadata.title,
        description: model.metadata.description,
        tags: model.tags,
        compatibility: model.compatibility
      }
    });
  } catch (error) {
    console.error('Update AR/VR metadata error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update AR/VR metadata',
      error: error.message
    });
  }
});

// Get AR/VR device compatibility
router.get('/compatibility/:modelId', async (req, res) => {
  try {
    const model = await ARVRModel.findById(req.params.modelId);

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'AR/VR model not found'
      });
    }

    const userAgent = req.get('User-Agent') || '';
    const deviceInfo = req.query;

    // Basic compatibility check
    const compatibility = {
      ar_supported: model.compatibility.ar_supported,
      vr_supported: model.compatibility.vr_supported,
      webxr_supported: model.compatibility.webxr_supported,
      mobile_ar_supported: model.compatibility.mobile_ar_supported,
      device_compatible: this.checkDeviceCompatibility(userAgent, deviceInfo, model.compatibility),
      minimum_requirements: model.compatibility.minimum_device_specs,
      recommended_settings: {
        lighting: 'good',
        surface: 'flat',
        tracking: 'stable'
      }
    };

    res.json({
      success: true,
      data: compatibility
    });
  } catch (error) {
    console.error('Get compatibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check compatibility',
      error: error.message
    });
  }
});

// Helper function to check device compatibility
function checkDeviceCompatibility(userAgent, deviceInfo, modelCompatibility) {
  // Simple device detection - enhance with proper device detection library
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);

  let compatible = true;

  // Check mobile AR support
  if (modelCompatibility.mobile_ar_supported) {
    if (isIOS && parseFloat(deviceInfo.ios_version || '12.0') < 12.0) {
      compatible = false;
    }
    if (isAndroid && parseFloat(deviceInfo.android_version || '7.0') < 7.0) {
      compatible = false;
    }
  }

  // Check WebXR support
  if (modelCompatibility.webxr_supported) {
    // WebXR requires modern browsers
    const isModernBrowser = /Chrome|Firefox|Safari|Edge/i.test(userAgent) &&
                           !/MSIE|Trident/i.test(userAgent);
    if (!isModernBrowser) {
      compatible = false;
    }
  }

  return compatible;
}

// Get popular AR/VR models
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const models = await ARVRModel.getPopularModels(limit);

    res.json({
      success: true,
      data: models.map(model => ({
        id: model._id,
        title: model.metadata?.title || 'AR/VR Model',
        thumbnail_url: model.model_files?.model ?
          Object.values(model.model_files.model)[0]?.url?.replace(/\.[^/.]+$/, '_thumb.jpg') : null,
        views: model.view_count,
        likes: model.like_count,
        product: model.product,
        uploaded_by: model.uploaded_by
      }))
    });
  } catch (error) {
    console.error('Get popular AR/VR models error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular AR/VR models',
      error: error.message
    });
  }
});

// Get trending AR/VR models
router.get('/trending', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const limit = parseInt(req.query.limit) || 10;

    const models = await ARVRModel.getTrendingModels(days, limit);

    res.json({
      success: true,
      data: models.map(model => ({
        id: model._id,
        title: model.metadata?.title || 'AR/VR Model',
        thumbnail_url: model.model_files?.model ?
          Object.values(model.model_files.model)[0]?.url?.replace(/\.[^/.]+$/, '_thumb.jpg') : null,
        views: model.view_count,
        likes: model.like_count,
        product: model.product,
        uploaded_by: model.uploaded_by
      }))
    });
  } catch (error) {
    console.error('Get trending AR/VR models error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending AR/VR models',
      error: error.message
    });
  }
});

module.exports = router;
