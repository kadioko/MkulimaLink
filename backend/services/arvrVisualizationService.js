/**
 * AR/VR Product Visualization Service
 * Enables augmented and virtual reality product visualization for MkulimaLink
 */

const { Product, ARVRModel } = require('../models/ARVR');
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ARVRVisualizationService {
  constructor() {
    // Configure AWS S3 for 3D model storage
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    this.cloudfrontUrl = process.env.AWS_CLOUDFRONT_URL;

    // Supported 3D formats
    this.supportedFormats = {
      models: ['gltf', 'glb', 'obj', 'fbx', 'dae'],
      textures: ['jpg', 'jpeg', 'png', 'webp'],
      animations: ['json', 'bin']
    };

    // AR/VR settings
    this.maxModelSize = 50 * 1024 * 1024; // 50MB
    this.maxTextureSize = 10 * 1024 * 1024; // 10MB
  }

  /**
   * Upload 3D model for product AR/VR visualization
   */
  async upload3DModel(userId, productId, modelFiles, metadata = {}) {
    try {
      // Verify product ownership
      const product = await Product.findOne({ _id: productId, seller: userId });
      if (!product) {
        throw new Error('Product not found or you are not the owner');
      }

      // Validate and process model files
      const processedFiles = await this.processModelFiles(modelFiles);

      // Generate model ID
      const modelId = uuidv4();

      // Upload files to S3
      const uploadedFiles = {};
      for (const [fileType, files] of Object.entries(processedFiles)) {
        uploadedFiles[fileType] = {};
        for (const [filename, fileData] of Object.entries(files)) {
          const key = `ar-vr/models/${modelId}/${fileType}/${filename}`;
          const url = await this.uploadToS3(fileData.buffer, key, fileData.mimetype);
          uploadedFiles[fileType][filename] = {
            url,
            size: fileData.size,
            format: fileData.format
          };
        }
      }

      // Create AR/VR model record
      const arvrModel = new ARVRModel({
        _id: modelId,
        product: productId,
        uploaded_by: userId,
        model_files: uploadedFiles,
        metadata: {
          ...metadata,
          upload_date: new Date(),
          processing_status: 'completed'
        }
      });

      await arvrModel.save();

      // Update product with AR/VR capability
      if (!product.arvr_enabled) {
        product.arvr_enabled = true;
        product.arvr_model = modelId;
        await product.save();
      }

      return {
        success: true,
        model_id: modelId,
        model_url: uploadedFiles.model ? Object.values(uploadedFiles.model)[0].url : null,
        message: '3D model uploaded successfully'
      };

    } catch (error) {
      console.error('Upload 3D model error:', error);
      throw error;
    }
  }

  /**
   * Process and validate model files
   */
  async processModelFiles(files) {
    const processedFiles = {
      model: {},
      textures: {},
      animations: {}
    };

    for (const file of files) {
      const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);

      // Determine file type
      let fileType;
      if (this.supportedFormats.models.includes(fileExtension)) {
        fileType = 'model';
        if (file.size > this.maxModelSize) {
          throw new Error(`Model file size exceeds maximum limit of ${this.maxModelSize / (1024 * 1024)}MB`);
        }
      } else if (this.supportedFormats.textures.includes(fileExtension)) {
        fileType = 'textures';
        if (file.size > this.maxTextureSize) {
          throw new Error(`Texture file size exceeds maximum limit of ${this.maxTextureSize / (1024 * 1024)}MB`);
        }
      } else if (this.supportedFormats.animations.includes(fileExtension)) {
        fileType = 'animations';
      } else {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      processedFiles[fileType][file.originalname] = {
        buffer: file.buffer,
        mimetype: file.mimetype,
        size: file.size,
        format: fileExtension
      };
    }

    // Validate that at least one model file exists
    if (Object.keys(processedFiles.model).length === 0) {
      throw new Error('At least one 3D model file (GLTF, GLB, OBJ, FBX, or DAE) is required');
    }

    return processedFiles;
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
      ACL: 'public-read'
    };

    const result = await this.s3.upload(params).promise();

    if (this.cloudfrontUrl) {
      const cloudfrontKey = key.replace(/^ar-vr\//, '');
      return `${this.cloudfrontUrl}/${cloudfrontKey}`;
    }

    return result.Location;
  }

  /**
   * Get AR/VR model for product
   */
  async getProductARVRModel(productId) {
    try {
      const model = await ARVRModel.findOne({ product: productId })
        .populate('product', 'name category price description');

      if (!model) {
        return null;
      }

      return {
        model_id: model._id,
        product: model.product,
        model_files: model.model_files,
        metadata: model.metadata,
        view_count: model.view_count,
        like_count: model.like_count,
        created_at: model.createdAt
      };

    } catch (error) {
      console.error('Get product AR/VR model error:', error);
      throw error;
    }
  }

  /**
   * Create AR marker for product
   */
  async createARMarker(productId, markerImage, markerData = {}) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Validate marker image
      if (!markerImage.mimetype.startsWith('image/')) {
        throw new Error('Marker must be an image file');
      }

      if (markerImage.size > 2 * 1024 * 1024) { // 2MB limit
        throw new Error('Marker image size exceeds maximum limit of 2MB');
      }

      // Upload marker image
      const markerId = uuidv4();
      const markerKey = `ar-vr/markers/${markerId}.jpg`;
      const markerUrl = await this.uploadToS3(markerImage.buffer, markerKey, markerImage.mimetype);

      // Create marker data
      const marker = {
        id: markerId,
        image_url: markerUrl,
        product_id: productId,
        pattern_data: markerData.pattern_data || null,
        physical_width: markerData.physical_width || 0.1, // Default 10cm
        metadata: {
          ...markerData,
          created_at: new Date()
        }
      };

      // Update product with AR marker
      if (!product.ar_markers) product.ar_markers = [];
      product.ar_markers.push(marker);
      await product.save();

      return {
        success: true,
        marker_id: markerId,
        marker_url: markerUrl,
        message: 'AR marker created successfully'
      };

    } catch (error) {
      console.error('Create AR marker error:', error);
      throw error;
    }
  }

  /**
   * Generate AR experience configuration
   */
  async generateARExperience(productId, userPreferences = {}) {
    try {
      const product = await Product.findById(productId)
        .populate('ar_markers')
        .populate('arvr_model');

      if (!product) {
        throw new Error('Product not found');
      }

      const experienceConfig = {
        product_id: product._id,
        product_name: product.name,
        product_description: product.description,
        product_price: product.price,
        ar_enabled: product.arvr_enabled,
        vr_enabled: product.arvr_enabled,
        experience_type: userPreferences.experience_type || 'marker_based', // 'marker_based' or 'markerless'
        lighting_conditions: userPreferences.lighting_conditions || 'normal',
        surface_requirements: userPreferences.surface_requirements || 'flat_surface',
        tracking_quality: userPreferences.tracking_quality || 'medium'
      };

      // Add AR markers if available
      if (product.ar_markers && product.ar_markers.length > 0) {
        experienceConfig.ar_markers = product.ar_markers.map(marker => ({
          id: marker.id,
          image_url: marker.image_url,
          physical_width: marker.physical_width,
          pattern_data: marker.pattern_data
        }));
      }

      // Add 3D model if available
      if (product.arvr_model) {
        experienceConfig.model_3d = {
          model_url: product.arvr_model.model_files?.model ?
            Object.values(product.arvr_model.model_files.model)[0].url : null,
          textures: product.arvr_model.model_files?.textures || {},
          animations: product.arvr_model.model_files?.animations || {},
          scale: userPreferences.model_scale || 1.0,
          position_offset: userPreferences.position_offset || { x: 0, y: 0, z: 0 },
          rotation: userPreferences.rotation || { x: 0, y: 0, z: 0 }
        };
      }

      // Add interaction features
      experienceConfig.interactions = {
        allow_scaling: userPreferences.allow_scaling !== false,
        allow_rotation: userPreferences.allow_rotation !== false,
        allow_positioning: userPreferences.allow_positioning !== false,
        show_measurements: userPreferences.show_measurements || false,
        show_price_info: userPreferences.show_price_info !== false,
        enable_sharing: userPreferences.enable_sharing !== false
      };

      // Add environmental settings
      experienceConfig.environment = {
        lighting: userPreferences.lighting || 'auto',
        shadows: userPreferences.shadows !== false,
        reflections: userPreferences.reflections || false,
        background: userPreferences.background || 'transparent'
      };

      return experienceConfig;

    } catch (error) {
      console.error('Generate AR experience error:', error);
      throw error;
    }
  }

  /**
   * Generate VR showroom experience
   */
  async generateVRShowroom(category, userPreferences = {}) {
    try {
      // Find products in category with AR/VR support
      const products = await Product.find({
        category: category,
        arvr_enabled: true
      })
      .populate('arvr_model')
      .limit(20);

      const showroomConfig = {
        category: category,
        theme: userPreferences.theme || 'modern_farm',
        layout: userPreferences.layout || 'grid', // 'grid', 'circular', 'scattered'
        navigation_type: userPreferences.navigation_type || 'teleport', // 'walk', 'teleport', 'fly'
        products: []
      };

      // Configure each product in the showroom
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const position = this.calculateShowroomPosition(i, userPreferences.layout);

        const productConfig = {
          id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          position: position,
          rotation: { x: 0, y: i * 45, z: 0 }, // Rotate products for visual interest
          scale: userPreferences.product_scale || 1.0,
          model_3d: product.arvr_model ? {
            model_url: product.arvr_model.model_files?.model ?
              Object.values(product.arvr_model.model_files.model)[0].url : null,
            textures: product.arvr_model.model_files?.textures || {}
          } : null,
          interactions: {
            allow_inspection: true,
            allow_purchase: true,
            show_info_panel: true
          }
        };

        showroomConfig.products.push(productConfig);
      }

      // Add showroom environment
      showroomConfig.environment = {
        skybox: userPreferences.skybox || 'farm_sunset',
        ground_texture: userPreferences.ground_texture || 'grass',
        lighting: userPreferences.lighting || 'natural',
        ambient_sound: userPreferences.ambient_sound || 'farm_ambience',
        weather_effects: userPreferences.weather_effects || false
      };

      // Add navigation waypoints
      showroomConfig.navigation = {
        waypoints: this.generateNavigationWaypoints(products.length, userPreferences.layout),
        teleport_zones: userPreferences.teleport_zones || []
      };

      return showroomConfig;

    } catch (error) {
      console.error('Generate VR showroom error:', error);
      throw error;
    }
  }

  /**
   * Calculate position in VR showroom
   */
  calculateShowroomPosition(index, layout) {
    const spacing = 3; // Distance between products

    switch (layout) {
      case 'grid':
        const gridSize = Math.ceil(Math.sqrt(index + 1));
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        return {
          x: (col - gridSize / 2) * spacing,
          y: 0,
          z: (row - gridSize / 2) * spacing
        };

      case 'circular':
        const radius = Math.max(5, Math.ceil((index + 1) / 8) * 3);
        const angle = (index * 45) * (Math.PI / 180); // 45 degrees apart
        return {
          x: Math.cos(angle) * radius,
          y: 0,
          z: Math.sin(angle) * radius
        };

      case 'scattered':
      default:
        // Random scattered positions
        const scatterRadius = 10;
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * scatterRadius;
        return {
          x: Math.cos(angle) * distance,
          y: 0,
          z: Math.sin(angle) * distance
        };
    }
  }

  /**
   * Generate navigation waypoints
   */
  generateNavigationWaypoints(productCount, layout) {
    const waypoints = [];

    if (layout === 'circular') {
      // Add waypoints around the circle
      for (let i = 0; i < 8; i++) {
        const angle = (i * 45) * (Math.PI / 180);
        const radius = 8;
        waypoints.push({
          id: `waypoint_${i}`,
          position: {
            x: Math.cos(angle) * radius,
            y: 0,
            z: Math.sin(angle) * radius
          },
          label: `View Area ${i + 1}`
        });
      }
    } else {
      // Add corner waypoints for grid/scattered layouts
      const corners = [
        { x: -10, z: -10, label: 'Northwest Corner' },
        { x: 10, z: -10, label: 'Northeast Corner' },
        { x: 10, z: 10, label: 'Southeast Corner' },
        { x: -10, z: 10, label: 'Southwest Corner' }
      ];

      corners.forEach((corner, index) => {
        waypoints.push({
          id: `waypoint_${index}`,
          position: { ...corner, y: 0 },
          label: corner.label
        });
      });
    }

    return waypoints;
  }

  /**
   * Record AR/VR interaction analytics
   */
  async recordInteraction(modelId, interactionType, userId = null, metadata = {}) {
    try {
      const model = await ARVRModel.findById(modelId);
      if (model) {
        // Update interaction counts
        if (interactionType === 'view') {
          model.view_count += 1;
        } else if (interactionType === 'like') {
          model.like_count += 1;
        } else if (interactionType === 'share') {
          model.share_count = (model.share_count || 0) + 1;
        }

        // Add interaction record
        if (!model.interactions) model.interactions = [];
        model.interactions.push({
          type: interactionType,
          user: userId,
          timestamp: new Date(),
          metadata: metadata
        });

        await model.save();
      }
    } catch (error) {
      console.error('Record interaction error:', error);
      // Don't throw - analytics shouldn't break the experience
    }
  }

  /**
   * Get AR/VR analytics for seller
   */
  async getARVRAnalytics(userId, productId = null) {
    try {
      let filter = { uploaded_by: userId };
      if (productId) {
        filter.product = productId;
      }

      const models = await ARVRModel.find(filter);

      const analytics = {
        total_models: models.length,
        total_views: models.reduce((sum, model) => sum + model.view_count, 0),
        total_likes: models.reduce((sum, model) => sum + model.like_count, 0),
        total_shares: models.reduce((sum, model) => sum + (model.share_count || 0), 0),
        models_breakdown: models.map(model => ({
          model_id: model._id,
          product_id: model.product,
          views: model.view_count,
          likes: model.like_count,
          shares: model.share_count || 0,
          created_at: model.createdAt
        }))
      };

      return analytics;

    } catch (error) {
      console.error('Get AR/VR analytics error:', error);
      throw error;
    }
  }

  /**
   * Delete AR/VR model
   */
  async deleteARVRModel(modelId, userId) {
    try {
      const model = await ARVRModel.findOne({ _id: modelId, uploaded_by: userId });
      if (!model) {
        throw new Error('AR/VR model not found or you are not the owner');
      }

      // Remove files from S3
      await this.deleteModelFiles(model.model_files);

      // Remove from product
      await Product.updateOne(
        { _id: model.product },
        {
          $unset: { arvr_model: 1, arvr_enabled: 1 },
          $pull: { ar_markers: { id: modelId } }
        }
      );

      // Delete model record
      await ARVRModel.deleteOne({ _id: modelId });

      return { success: true, message: 'AR/VR model deleted successfully' };

    } catch (error) {
      console.error('Delete AR/VR model error:', error);
      throw error;
    }
  }

  /**
   * Delete model files from S3
   */
  async deleteModelFiles(modelFiles) {
    try {
      const deletePromises = [];

      for (const [fileType, files] of Object.entries(modelFiles)) {
        for (const [filename, fileData] of Object.entries(files)) {
          if (fileData.url) {
            // Extract key from URL
            let key;
            if (this.cloudfrontUrl && fileData.url.startsWith(this.cloudfrontUrl)) {
              key = fileData.url.replace(this.cloudfrontUrl + '/', '');
              key = `ar-vr/${key}`;
            } else {
              const urlParts = fileData.url.split('/');
              key = urlParts.slice(-3).join('/'); // Get last three parts
            }

            deletePromises.push(
              this.s3.deleteObject({
                Bucket: this.bucketName,
                Key: key
              }).promise()
            );
          }
        }
      }

      await Promise.all(deletePromises);

    } catch (error) {
      console.error('Delete model files error:', error);
      // Don't throw - cleanup shouldn't break the main operation
    }
  }
}

module.exports = new ARVRVisualizationService();
