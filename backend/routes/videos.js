/**
 * Video Marketplace Routes
 * Handles video uploads, browsing, and marketplace operations
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const videoMarketplaceService = require('../services/videoMarketplaceService');
const { Video } = require('../models/Video');
const { Product } = require('../models/Product');

// Configure multer for video uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, MOV, AVI, and WebM videos are allowed.'), false);
    }
  }
});

// Upload product video
router.post('/upload/:productId', protect, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    const { productId } = req.params;
    const metadata = req.body;

    const result = await videoMarketplaceService.uploadProductVideo(
      req.user._id,
      productId,
      req.file,
      metadata
    );

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: result
    });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload video',
      error: error.message
    });
  }
});

// Get product videos
router.get('/product/:productId', async (req, res) => {
  try {
    const videos = await videoMarketplaceService.getProductVideos(req.params.productId);

    res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    console.error('Get product videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product videos',
      error: error.message
    });
  }
});

// Browse video marketplace
router.get('/browse', async (req, res) => {
  try {
    const {
      category,
      location,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (location) filters.location = location;
    if (search) filters.search = search;

    const result = await videoMarketplaceService.browseVideos(filters, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Browse videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to browse videos',
      error: error.message
    });
  }
});

// Get popular videos
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const videos = await Video.getPopularVideos(limit);

    res.json({
      success: true,
      data: videos.map(video => ({
        id: video._id,
        title: video.title,
        thumbnail_url: video.thumbnail_url,
        views: video.views,
        likes: video.likes,
        product: video.product,
        uploaded_by: video.uploaded_by
      }))
    });
  } catch (error) {
    console.error('Get popular videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular videos',
      error: error.message
    });
  }
});

// Get trending videos
router.get('/trending', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const limit = parseInt(req.query.limit) || 10;

    const videos = await Video.getTrendingVideos(days, limit);

    res.json({
      success: true,
      data: videos.map(video => ({
        id: video._id,
        title: video.title,
        thumbnail_url: video.thumbnail_url,
        views: video.views,
        likes: video.likes,
        product: video.product,
        uploaded_by: video.uploaded_by
      }))
    });
  } catch (error) {
    console.error('Get trending videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending videos',
      error: error.message
    });
  }
});

// Search videos
router.get('/search', async (req, res) => {
  try {
    const { q: query, category, region, minDuration, maxDuration, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const filters = {};
    if (category) filters.category = category;
    if (region) filters.region = region;
    if (minDuration) filters.minDuration = parseInt(minDuration);
    if (maxDuration) filters.maxDuration = parseInt(maxDuration);

    const videos = await Video.searchVideos(query, filters, parseInt(limit));

    res.json({
      success: true,
      data: videos.map(video => ({
        id: video._id,
        title: video.title,
        description: video.description,
        thumbnail_url: video.thumbnail_url,
        views: video.views,
        likes: video.likes,
        product: video.product,
        uploaded_by: video.uploaded_by
      }))
    });
  } catch (error) {
    console.error('Search videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search videos',
      error: error.message
    });
  }
});

// Record video view
router.post('/:videoId/view', async (req, res) => {
  try {
    const { userId, sessionId } = req.body;

    await videoMarketplaceService.recordVideoView(req.params.videoId, userId, sessionId);

    res.json({ success: true });
  } catch (error) {
    console.error('Record video view error:', error);
    // Don't return error - view tracking shouldn't break video playback
    res.json({ success: false });
  }
});

// Like/unlike video
router.post('/:videoId/like', protect, async (req, res) => {
  try {
    const result = await videoMarketplaceService.toggleVideoLike(req.params.videoId, req.user._id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Toggle video like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle video like',
      error: error.message
    });
  }
});

// Get user's liked videos
router.get('/liked', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await videoMarketplaceService.getUserLikedVideos(req.user._id, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get liked videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch liked videos',
      error: error.message
    });
  }
});

// Get video analytics (for video owner)
router.get('/:videoId/analytics', protect, async (req, res) => {
  try {
    const analytics = await videoMarketplaceService.getVideoAnalytics(req.params.videoId, req.user._id);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get video analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video analytics',
      error: error.message
    });
  }
});

// Delete video
router.delete('/:videoId', protect, async (req, res) => {
  try {
    const result = await videoMarketplaceService.deleteVideo(req.params.videoId, req.user._id);

    res.json(result);
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video',
      error: error.message
    });
  }
});

// Get videos by region
router.get('/region/:region', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const videos = await Video.getVideosByRegion(req.params.region, limit);

    res.json({
      success: true,
      data: videos.map(video => ({
        id: video._id,
        title: video.title,
        thumbnail_url: video.thumbnail_url,
        views: video.views,
        likes: video.likes,
        product: video.product,
        uploaded_by: video.uploaded_by
      }))
    });
  } catch (error) {
    console.error('Get videos by region error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch videos by region',
      error: error.message
    });
  }
});

// Update video metadata
router.put('/:videoId/metadata', protect, async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.videoId,
      uploaded_by: req.user._id
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found or you are not the owner'
      });
    }

    const { title, description, tags, location } = req.body;

    if (title) video.title = title;
    if (description) video.description = description;
    if (tags) await video.addTags(tags);
    if (location) await video.updateLocation(location);

    await video.save();

    res.json({
      success: true,
      message: 'Video metadata updated successfully',
      data: {
        id: video._id,
        title: video.title,
        description: video.description,
        tags: video.tags,
        location: video.location
      }
    });
  } catch (error) {
    console.error('Update video metadata error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video metadata',
      error: error.message
    });
  }
});

// Admin routes for video moderation
router.use('/admin', protect);

// Get videos pending moderation
router.get('/admin/pending-moderation', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const videos = await Video.find({ moderation_status: 'pending' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name')
      .populate('uploaded_by', 'name email');

    const total = await Video.countDocuments({ moderation_status: 'pending' });

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get pending moderation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch videos pending moderation',
      error: error.message
    });
  }
});

// Moderate video
router.post('/admin/:videoId/moderate', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { status, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be approved or rejected'
      });
    }

    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    video.moderation_status = status;
    video.moderated_by = req.user._id;
    video.moderated_at = new Date();
    if (notes) video.moderation_notes = notes;

    await video.save();

    res.json({
      success: true,
      message: `Video ${status}`,
      data: {
        video_id: video._id,
        moderation_status: video.moderation_status,
        moderated_at: video.moderated_at
      }
    });
  } catch (error) {
    console.error('Moderate video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate video',
      error: error.message
    });
  }
});

// Bulk moderate videos
router.post('/admin/bulk-moderate', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { videoIds, status, notes } = req.body;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Video IDs array is required'
      });
    }

    const result = await Video.updateMany(
      { _id: { $in: videoIds } },
      {
        $set: {
          moderation_status: status,
          moderated_by: req.user._id,
          moderated_at: new Date(),
          moderation_notes: notes || ''
        }
      }
    );

    res.json({
      success: true,
      message: `Moderated ${result.modifiedCount} videos`,
      data: {
        modified_count: result.modifiedCount,
        status: status
      }
    });
  } catch (error) {
    console.error('Bulk moderate videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk moderate videos',
      error: error.message
    });
  }
});

module.exports = router;
