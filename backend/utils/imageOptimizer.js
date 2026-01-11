const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class ImageOptimizer {
  constructor(options = {}) {
    this.options = {
      quality: 80,
      format: 'webp',
      sizes: [
        { name: 'thumb', width: 150, height: 150 },
        { name: 'small', width: 400, height: 300 },
        { name: 'medium', width: 800, height: 600 },
        { name: 'large', width: 1200, height: 900 }
      ],
      ...options
    };
  }

  /**
   * Optimize and generate multiple sizes of an image
   * @param {string} inputPath - Path to original image
   * @param {string} outputDir - Directory to save optimized images
   * @param {string} filename - Base filename
   * @returns {Promise<Object>} Object with paths to all generated sizes
   */
  async optimizeImage(inputPath, outputDir, filename) {
    const results = {};
    const baseName = path.parse(filename).name;

    try {
      // Get image metadata
      const metadata = await sharp(inputPath).metadata();
      results.metadata = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size
      };

      // Generate different sizes
      for (const size of this.options.sizes) {
        const outputPath = path.join(outputDir, `${baseName}_${size.name}.webp`);
        
        await sharp(inputPath)
          .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center'
          })
          .webp({
            quality: this.options.quality,
            effort: 6
          })
          .toFile(outputPath);

        results[size.name] = {
          path: outputPath,
          width: size.width,
          height: size.height,
          size: (await fs.stat(outputPath)).size
        };
      }

      // Also save original in WebP format
      const originalWebpPath = path.join(outputDir, `${baseName}_original.webp`);
      await sharp(inputPath)
        .webp({
          quality: this.options.quality,
          effort: 6
        })
        .toFile(originalWebpPath);

      results.original = {
        path: originalWebpPath,
        width: metadata.width,
        height: metadata.height,
        size: (await fs.stat(originalWebpPath)).size
      };

      return results;
    } catch (error) {
      console.error('Image optimization error:', error);
      throw new Error(`Failed to optimize image: ${error.message}`);
    }
  }

  /**
   * Create responsive image set for HTML picture element
   * @param {Object} optimizedImages - Result from optimizeImage
   * @param {string} baseUrl - Base URL for images
   * @returns {Object} Picture element data
   */
  createPictureSet(optimizedImages, baseUrl = '/uploads/') {
    const picture = {
      sources: [],
      img: {
        src: '',
        alt: '',
        loading: 'lazy'
      }
    };

    // Create sources for different sizes
    for (const size of this.options.sizes) {
      if (optimizedImages[size.name]) {
        const relativePath = optimizedImages[size.name].path.replace(/^.*uploads\//, '');
        picture.sources.push({
          srcset: `${baseUrl}${relativePath}`,
          media: `(max-width: ${size.width}px)`
        });
      }
    }

    // Set default image (medium size)
    if (optimizedImages.medium) {
      const relativePath = optimizedImages.medium.path.replace(/^.*uploads\//, '');
      picture.img.src = `${baseUrl}${relativePath}`;
    }

    return picture;
  }

  /**
   * Generate placeholder blur data URL
   * @param {string} inputPath - Path to image
   * @param {number} size - Size of placeholder (default: 20)
   * @returns {Promise<string>} Base64 data URL
   */
  async generatePlaceholder(inputPath, size = 20) {
    try {
      const buffer = await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover'
        })
        .webp({
          quality: 20
        })
        .toBuffer();

      return `data:image/webp;base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error('Placeholder generation error:', error);
      // Return a simple gray placeholder
      return 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAJaQAAQAAAgAAAAI/8AAWAAUAAAAQAAAAAAA';
    }
  }

  /**
   * Validate image file
   * @param {string} filePath - Path to image file
   * @returns {Promise<boolean>} True if valid
   */
  async validateImage(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();
      
      // Check if it's a valid image format
      const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'tiff'];
      if (!validFormats.includes(metadata.format.toLowerCase())) {
        return false;
      }

      // Check dimensions (max 5000x5000)
      if (metadata.width > 5000 || metadata.height > 5000) {
        return false;
      }

      // Check file size (max 10MB)
      const stats = await fs.stat(filePath);
      if (stats.size > 10 * 1024 * 1024) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Image validation error:', error);
      return false;
    }
  }

  /**
   * Clean up old optimized images
   * @param {string} outputDir - Directory to clean
   * @param {number} maxAge - Maximum age in hours (default: 24)
   */
  async cleanup(outputDir, maxAge = 24) {
    try {
      const files = await fs.readdir(outputDir);
      const now = Date.now();
      const maxAgeMs = maxAge * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(outputDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAgeMs) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old image: ${file}`);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Singleton instance
const imageOptimizer = new ImageOptimizer();

// Middleware for Multer to optimize images on upload
const optimizeUpload = (options = {}) => {
  return async (req, res, next) => {
    if (!req.file) return next();

    try {
      const uploadDir = path.dirname(req.file.path);
      const filename = path.basename(req.file.path);
      
      // Optimize the uploaded image
      const optimized = await imageOptimizer.optimizeImage(req.file.path, uploadDir, filename);
      
      // Store optimized image info in request
      req.optimizedImage = optimized;
      
      // Optionally delete original
      if (options.deleteOriginal) {
        await fs.unlink(req.file.path);
      }
      
      next();
    } catch (error) {
      console.error('Upload optimization error:', error);
      next(error);
    }
  };
};

module.exports = {
  ImageOptimizer,
  imageOptimizer,
  optimizeUpload
};
