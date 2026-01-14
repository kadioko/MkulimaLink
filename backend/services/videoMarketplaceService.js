/**
 * Video Marketplace Service
 * Handles video uploads, processing, and marketplace functionality for agricultural products
 */

const AWS = require('aws-sdk');
const { Product } = require('../models/Product');
const { Video } = require('../models/Video');
const fs = require('fs').promises;
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');

class VideoMarketplaceService {
  constructor() {
    // Configure AWS S3
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    this.cloudfrontUrl = process.env.AWS_CLOUDFRONT_URL;

    // Video processing settings
    this.videoSettings = {
      maxDuration: 300, // 5 minutes max
      maxSize: 500 * 1024 * 1024, // 500MB max
      allowedFormats: ['mp4', 'mov', 'avi', 'webm'],
      thumbnailSettings: {
        width: 320,
        height: 180,
        quality: 80
      },
      compressionSettings: {
        resolution: '720p',
        bitrate: '1500k',
        preset: 'medium'
      }
    };
  }

  /**
   * Upload and process product video
   */
  async uploadProductVideo(userId, productId, videoFile, metadata = {}) {
    try {
      // Verify product ownership
      const product = await Product.findOne({ _id: productId, seller: userId });
      if (!product) {
        throw new Error('Product not found or you are not the owner');
      }

      // Validate video file
      await this.validateVideoFile(videoFile);

      // Generate unique video ID
      const videoId = uuidv4();
      const fileExtension = path.extname(videoFile.originalname);
      const baseFilename = `${videoId}${fileExtension}`;

      // Upload original video to S3
      const originalKey = `videos/original/${baseFilename}`;
      const originalUrl = await this.uploadToS3(videoFile.buffer, originalKey, videoFile.mimetype);

      // Process video (compression, thumbnail generation)
      const processedVideoUrl = await this.processVideo(videoFile.buffer, videoId);
      const thumbnailUrl = await this.generateThumbnail(videoFile.buffer, videoId);

      // Create video record
      const video = new Video({
        _id: videoId,
        product: productId,
        uploaded_by: userId,
        title: metadata.title || `${product.name} - Product Video`,
        description: metadata.description || `Video showcasing ${product.name}`,
        original_url: originalUrl,
        processed_url: processedVideoUrl,
        thumbnail_url: thumbnailUrl,
        duration: metadata.duration || 0,
        file_size: videoFile.size,
        format: fileExtension.substring(1),
        status: 'processed',
        views: 0,
        likes: 0,
        metadata: {
          ...metadata,
          processing_completed_at: new Date(),
          original_filename: videoFile.originalname
        }
      });

      await video.save();

      // Add video to product
      if (!product.videos) product.videos = [];
      product.videos.push(videoId);
      product.updatedAt = new Date();
      await product.save();

      return {
        success: true,
        video_id: videoId,
        video_url: processedVideoUrl,
        thumbnail_url: thumbnailUrl,
        message: 'Video uploaded and processed successfully'
      };

    } catch (error) {
      console.error('Upload product video error:', error);
      throw error;
    }
  }

  /**
   * Validate video file
   */
  async validateVideoFile(file) {
    // Check file size
    if (file.size > this.videoSettings.maxSize) {
      throw new Error(`Video file size exceeds maximum limit of ${this.videoSettings.maxSize / (1024 * 1024)}MB`);
    }

    // Check file format
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    if (!this.videoSettings.allowedFormats.includes(fileExtension)) {
      throw new Error(`Unsupported video format. Allowed formats: ${this.videoSettings.allowedFormats.join(', ')}`);
    }

    // Basic video validation (duration check would require ffprobe)
    // For now, we'll rely on client-side validation
  }

  /**
   * Upload file to S3
   */
  async uploadToS3(buffer, key, contentType) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read' // Make videos publicly accessible
    };

    const result = await this.s3.upload(params).promise();

    if (this.cloudfrontUrl) {
      // Return CloudFront URL for better performance
      const cloudfrontKey = key.replace(/^videos\//, '');
      return `${this.cloudfrontUrl}/${cloudfrontKey}`;
    }

    return result.Location;
  }

  /**
   * Process video (compression and optimization)
   */
  async processVideo(videoBuffer, videoId) {
    return new Promise((resolve, reject) => {
      const inputPath = path.join('/tmp', `input_${videoId}.mp4`);
      const outputPath = path.join('/tmp', `processed_${videoId}.mp4`);
      const outputKey = `videos/processed/${videoId}.mp4`;

      // Write buffer to temporary file
      fs.writeFile(inputPath, videoBuffer)
        .then(() => {
          // Process video with ffmpeg
          ffmpeg(inputPath)
            .videoCodec('libx264')
            .audioCodec('aac')
            .size('1280x720') // 720p
            .videoBitrate('1500k')
            .audioBitrate('128k')
            .fps(30)
            .preset('medium')
            .on('end', async () => {
              try {
                // Read processed file and upload to S3
                const processedBuffer = await fs.readFile(outputPath);
                const url = await this.uploadToS3(processedBuffer, outputKey, 'video/mp4');

                // Clean up temporary files
                await fs.unlink(inputPath);
                await fs.unlink(outputPath);

                resolve(url);
              } catch (error) {
                reject(error);
              }
            })
            .on('error', (err) => {
              console.error('Video processing error:', err);
              reject(new Error('Video processing failed'));
            })
            .save(outputPath);
        })
        .catch(reject);
    });
  }

  /**
   * Generate video thumbnail
   */
  async generateThumbnail(videoBuffer, videoId) {
    return new Promise((resolve, reject) => {
      const inputPath = path.join('/tmp', `thumb_input_${videoId}.mp4`);
      const outputPath = path.join('/tmp', `thumb_${videoId}.jpg`);
      const thumbnailKey = `videos/thumbnails/${videoId}.jpg`;

      // Write buffer to temporary file
      fs.writeFile(inputPath, videoBuffer)
        .then(() => {
          // Generate thumbnail at 1 second mark
          ffmpeg(inputPath)
            .screenshots({
              timestamps: ['1'],
              filename: `thumb_${videoId}.jpg`,
              folder: '/tmp',
              size: '320x180'
            })
            .on('end', async () => {
              try {
                // Read thumbnail file and upload to S3
                const thumbnailBuffer = await fs.readFile(outputPath);
                const url = await this.uploadToS3(thumbnailBuffer, thumbnailKey, 'image/jpeg');

                // Clean up temporary files
                await fs.unlink(inputPath);
                await fs.unlink(outputPath);

                resolve(url);
              } catch (error) {
                reject(error);
              }
            })
            .on('error', (err) => {
              console.error('Thumbnail generation error:', err);
              reject(new Error('Thumbnail generation failed'));
            });
        })
        .catch(reject);
    });
  }

  /**
   * Get product videos
   */
  async getProductVideos(productId) {
    try {
      const videos = await Video.find({ product: productId, status: 'processed' })
        .sort({ createdAt: -1 })
        .select('title description thumbnail_url processed_url duration views likes createdAt');

      return videos.map(video => ({
        id: video._id,
        title: video.title,
        description: video.description,
        thumbnail_url: video.thumbnail_url,
        video_url: video.processed_url,
        duration: video.duration,
        views: video.views,
        likes: video.likes,
        uploaded_at: video.createdAt
      }));

    } catch (error) {
      console.error('Get product videos error:', error);
      throw error;
    }
  }

  /**
   * Browse video marketplace
   */
  async browseVideos(filters = {}, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      let query = { status: 'processed' };

      // Apply filters
      if (filters.category) {
        // Join with products to filter by category
        const productsInCategory = await Product.find({ category: filters.category }).select('_id');
        const productIds = productsInCategory.map(p => p._id);
        query.product = { $in: productIds };
      }

      if (filters.location) {
        // Join with products to filter by location
        const productsInLocation = await Product.find({
          'location.region': filters.location
        }).select('_id');
        const productIds = productsInLocation.map(p => p._id);
        query.product = { $in: productIds };
      }

      if (filters.search) {
        query.$or = [
          { title: new RegExp(filters.search, 'i') },
          { description: new RegExp(filters.search, 'i') }
        ];
      }

      // Get videos with product information
      const videos = await Video.find(query)
        .populate({
          path: 'product',
          select: 'name category price location seller',
          populate: {
            path: 'seller',
            select: 'name rating business_info'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Video.countDocuments(query);

      const formattedVideos = videos.map(video => ({
        id: video._id,
        title: video.title,
        description: video.description,
        thumbnail_url: video.thumbnail_url,
        video_url: video.processed_url,
        duration: video.duration,
        views: video.views,
        likes: video.likes,
        uploaded_at: video.createdAt,
        product: {
          id: video.product._id,
          name: video.product.name,
          category: video.product.category,
          price: video.product.price,
          location: video.product.location,
          seller: {
            name: video.product.seller.name,
            rating: video.product.seller.rating,
            business_name: video.product.seller.business_info?.name
          }
        }
      }));

      return {
        videos: formattedVideos,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('Browse videos error:', error);
      throw error;
    }
  }

  /**
   * Record video view
   */
  async recordVideoView(videoId, userId = null, sessionId = null) {
    try {
      const video = await Video.findById(videoId);
      if (!video) return;

      // Increment view count
      video.views += 1;
      video.last_viewed_at = new Date();

      // Track unique viewers (simplified - in production use Redis or similar)
      if (!video.viewers) video.viewers = [];
      const viewerId = userId || sessionId;
      if (viewerId && !video.viewers.includes(viewerId)) {
        video.viewers.push(viewerId);
        video.unique_views = video.viewers.length;
      }

      await video.save();

    } catch (error) {
      console.error('Record video view error:', error);
      // Don't throw - view tracking shouldn't break video playback
    }
  }

  /**
   * Like/unlike video
   */
  async toggleVideoLike(videoId, userId) {
    try {
      const video = await Video.findById(videoId);
      if (!video) {
        throw new Error('Video not found');
      }

      if (!video.liked_by) video.liked_by = [];

      const userIndex = video.liked_by.indexOf(userId);

      if (userIndex > -1) {
        // Unlike
        video.liked_by.splice(userIndex, 1);
        video.likes -= 1;
      } else {
        // Like
        video.liked_by.push(userId);
        video.likes += 1;
      }

      await video.save();

      return {
        liked: userIndex === -1,
        likes_count: video.likes
      };

    } catch (error) {
      console.error('Toggle video like error:', error);
      throw error;
    }
  }

  /**
   * Get user's liked videos
   */
  async getUserLikedVideos(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const videos = await Video.find({
        liked_by: userId,
        status: 'processed'
      })
      .populate({
        path: 'product',
        select: 'name category price location'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      const total = await Video.countDocuments({ liked_by: userId });

      return {
        videos: videos.map(video => ({
          id: video._id,
          title: video.title,
          description: video.description,
          thumbnail_url: video.thumbnail_url,
          product: video.product,
          liked_at: video.updatedAt // Approximate
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('Get user liked videos error:', error);
      throw error;
    }
  }

  /**
   * Delete video
   */
  async deleteVideo(videoId, userId) {
    try {
      const video = await Video.findOne({ _id: videoId, uploaded_by: userId });
      if (!video) {
        throw new Error('Video not found or you are not the owner');
      }

      // Remove from S3
      await this.deleteFromS3(video.original_url);
      await this.deleteFromS3(video.processed_url);
      await this.deleteFromS3(video.thumbnail_url);

      // Remove from product
      await Product.updateOne(
        { _id: video.product },
        { $pull: { videos: videoId } }
      );

      // Delete video record
      await Video.deleteOne({ _id: videoId });

      return { success: true, message: 'Video deleted successfully' };

    } catch (error) {
      console.error('Delete video error:', error);
      throw error;
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFromS3(url) {
    try {
      if (!url) return;

      // Extract key from URL
      let key;
      if (this.cloudfrontUrl && url.startsWith(this.cloudfrontUrl)) {
        key = url.replace(this.cloudfrontUrl + '/', '');
        key = `videos/${key}`;
      } else {
        const urlParts = url.split('/');
        key = urlParts.slice(-2).join('/'); // Get last two parts
      }

      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();

    } catch (error) {
      console.error('Delete from S3 error:', error);
      // Don't throw - cleanup shouldn't break the main operation
    }
  }

  /**
   * Get video analytics
   */
  async getVideoAnalytics(videoId, userId) {
    try {
      const video = await Video.findOne({ _id: videoId, uploaded_by: userId });
      if (!video) {
        throw new Error('Video not found or you are not the owner');
      }

      return {
        video_id: video._id,
        title: video.title,
        views: video.views,
        unique_views: video.unique_views || 0,
        likes: video.likes,
        upload_date: video.createdAt,
        last_viewed: video.last_viewed_at,
        processing_status: video.status,
        file_size: video.file_size,
        duration: video.duration
      };

    } catch (error) {
      console.error('Get video analytics error:', error);
      throw error;
    }
  }
}

module.exports = new VideoMarketplaceService();
