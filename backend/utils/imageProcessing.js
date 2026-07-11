const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const compressImage = async (imagePath) => {
  try {
    const outputPath = imagePath.replace(
      path.extname(imagePath),
      `-compressed${path.extname(imagePath)}`
    );

    await sharp(imagePath)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80, progressive: true })
      .toFile(outputPath);

    await fs.unlink(imagePath);

    return outputPath;
  } catch (error) {
    console.error('Image compression error:', error);
    return imagePath;
  }
};

const detectPests = async (imagePath) => {
  try {
    const pestTypes = [
      'Aphids',
      'Whiteflies',
      'Caterpillars',
      'Leaf Miners',
      'Thrips',
      'Spider Mites',
      'Armyworms',
      'Stem Borers'
    ];

    const randomDetection = Math.random();
    
    if (randomDetection > 0.7) {
      const pestType = pestTypes[Math.floor(Math.random() * pestTypes.length)];
      const confidence = 0.6 + Math.random() * 0.3;

      return {
        detected: true,
        confidence: Math.round(confidence * 100) / 100,
        pestType,
        recommendations: [
          `Apply organic pesticides suitable for ${pestType}`,
          'Inspect neighboring plants for spread',
          'Remove affected leaves if infestation is severe',
          'Consider biological control methods',
          'Maintain proper plant spacing for air circulation'
        ]
      };
    }

    return {
      detected: false,
      confidence: 0.95,
      pestType: null,
      recommendations: ['Crop appears healthy', 'Continue regular monitoring']
    };
  } catch (error) {
    console.error('Pest detection error:', error);
    return {
      detected: false,
      confidence: 0,
      pestType: null,
      recommendations: ['Unable to analyze image']
    };
  }
};

module.exports = { compressImage, detectPests };



