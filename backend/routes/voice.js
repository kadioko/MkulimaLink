const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const voiceCommerceService = require('../services/voiceCommerceService');

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/ogg',
      'audio/webm',
      'audio/flac'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}. Supported formats: WAV, MP3, OGG, WebM, FLAC`), false);
    }
  }
});

// Legacy Swahili commands (keep for backward compatibility)
const SWAHILI_COMMANDS = {
  'tafuta': 'search',
  'nunua': 'buy',
  'uza': 'sell',
  'bei': 'price',
  'hali ya hewa': 'weather',
  'akaunti': 'account',
  'malipo': 'payment',
  'orodha': 'list'
};

const PRODUCT_CATEGORIES_SW = {
  'nafaka': 'grains',
  'mboga': 'vegetables',
  'matunda': 'fruits',
  'mifugo': 'livestock',
  'maziwa': 'dairy'
};

// Enhanced voice processing with speech-to-text
router.post('/process', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    const { language, user_id } = req.body;
    const userId = req.user?.id || user_id;

    // Validate audio file
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Audio file too large. Maximum size is 10MB.'
      });
    }

    // Process the voice input with enhanced service
    const result = await voiceCommerceService.processVoiceInput(
      req.file.buffer,
      userId,
      language || 'en-US'
    );

    res.json({
      success: result.success,
      message: result.message,
      data: {
        transcription: result.transcription,
        confidence: result.confidence,
        command: result.command,
        parameters: result.parameters,
        response: result.response,
        audio_response: result.audio_response,
        suggested_actions: result.actions,
        language: language || 'en-US'
      }
    });

  } catch (error) {
    console.error('Voice processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice input',
      error: error.message
    });
  }
});

// Process text input (for testing or fallback)
router.post('/process-text', async (req, res) => {
  try {
    const { text, language, user_id } = req.body;
    const userId = req.user?.id || user_id;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text input is required'
      });
    }

    const result = await voiceCommerceService.processTextCommand(text, userId);

    res.json({
      success: true,
      data: {
        command: result.command,
        parameters: result.parameters,
        response: result.response,
        audio_response: await voiceCommerceService.generateAudioResponse(result.response),
        suggested_actions: result.actions,
        language: language || 'en-US'
      }
    });

  } catch (error) {
    console.error('Text processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process text input',
      error: error.message
    });
  }
});

// Legacy command endpoint (keep for backward compatibility)
router.post('/command', protect, async (req, res) => {
  try {
    const { text, language = 'sw' } = req.body;
    const lowerText = text.toLowerCase();

    let command = null;
    let params = {};

    // Check for enhanced voice commands first
    try {
      const result = await voiceCommerceService.processTextCommand(text, req.user.id);

      if (result.command !== 'unknown') {
        return res.json({
          success: true,
          command: result.command,
          message: result.response,
          data: result.data,
          voiceResponse: result.response, // For backward compatibility
          suggested_actions: result.actions,
          enhanced: true
        });
      }
    } catch (enhancedError) {
      // Fall back to legacy processing
    }

    // Legacy Swahili command processing
    for (const [swahili, english] of Object.entries(SWAHILI_COMMANDS)) {
      if (lowerText.includes(swahili)) {
        command = english;
        break;
      }
    }

    if (!command) {
      return res.json({
        success: false,
        message: language === 'sw'
          ? 'Samahani, sijaelewa amri yako. Jaribu tena.'
          : 'Sorry, I did not understand your command. Please try again.',
        suggestions: language === 'sw'
          ? ['Tafuta mahindi', 'Nunua nyanya', 'Hali ya hewa', 'Akaunti yangu']
          : ['Search maize', 'Buy tomatoes', 'Weather', 'My account']
      });
    }

    let response = {};

    switch (command) {
      case 'search':
        for (const [swahili, category] of Object.entries(PRODUCT_CATEGORIES_SW)) {
          if (lowerText.includes(swahili)) {
            params.category = category;
            break;
          }
        }

        // Use enhanced search
        const searchParams = { product: text.replace(/tafuta/i, '').trim() };
        const searchResult = await voiceCommerceService.executeCommand('search_product', searchParams, req.user.id);

        response = {
          success: true,
          command: 'search',
          message: searchResult.response,
          data: searchResult.data,
          voiceResponse: searchResult.response,
          suggested_actions: searchResult.actions
        };
        break;

      case 'weather':
        response = {
          success: true,
          command: 'weather',
          message: language === 'sw'
            ? 'Ninakupelekea kwenye hali ya hewa'
            : 'Redirecting to weather',
          redirect: '/weather'
        };
        break;

      case 'account':
        response = {
          success: true,
          command: 'account',
          message: language === 'sw'
            ? `Akaunti yako: ${req.user.name}. Salio: ${req.user.balance} shilingi`
            : `Your account: ${req.user.name}. Balance: ${req.user.balance} shillings`,
          data: {
            name: req.user.name,
            balance: req.user.balance,
            role: req.user.role
          },
          voiceResponse: language === 'sw'
            ? `Jina lako ni ${req.user.name}. Salio lako ni shilingi ${req.user.balance}`
            : `Your name is ${req.user.name}. Your balance is ${req.user.balance} shillings`
        };
        break;

      case 'list':
        response = {
          success: true,
          command: 'list',
          message: language === 'sw'
            ? 'Ninakupelekea kwenye orodha ya bidhaa zako'
            : 'Redirecting to your product listings',
          redirect: '/dashboard'
        };
        break;

      default:
        response = {
          success: true,
          command,
          message: language === 'sw'
            ? `Amri "${command}" imepokelewa`
            : `Command "${command}" received`
        };
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get voice commerce analytics (protected)
router.get('/analytics', protect, async (req, res) => {
  try {
    const { time_range } = req.query;

    const analytics = await voiceCommerceService.getAnalytics(
      req.user.id,
      time_range || '30d'
    );

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// Get voice interaction history (protected)
router.get('/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Mock history for now (would need VoiceInteraction model)
    const mockHistory = {
      interactions: [
        {
          id: '1',
          timestamp: new Date(Date.now() - 86400000),
          command: 'search_product',
          transcription: 'find maize in Nairobi',
          response: 'I found 3 maize products in Nairobi...',
          success: true,
          confidence: 0.89,
          language: 'en-US'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 172800000),
          command: 'get_price',
          transcription: 'how much is rice',
          response: 'Rice costs 120 shillings per kilogram.',
          success: true,
          confidence: 0.95,
          language: 'en-US'
        }
      ],
      pagination: {
        page,
        limit,
        total: 2,
        pages: 1
      }
    };

    res.json({
      success: true,
      data: mockHistory
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interaction history',
      error: error.message
    });
  }
});

// Enhanced help endpoint
router.get('/help', (req, res) => {
  const { language = 'en', enhanced = false } = req.query;

  if (enhanced === 'true') {
    // Return enhanced help with all available commands
    const commands = {
      'en-US': [
        { name: 'search_product', description: 'Search for products', examples: ['Find maize in Nairobi', 'Show me tomatoes'] },
        { name: 'get_product_details', description: 'Get product information', examples: ['Tell me about carrots', 'Details on beans'] },
        { name: 'get_price', description: 'Check product prices', examples: ['How much is maize', 'Price of rice'] },
        { name: 'add_to_cart', description: 'Add items to cart', examples: ['Add rice to cart', 'Buy tomatoes'] },
        { name: 'place_order', description: 'Complete purchase', examples: ['Place my order', 'Buy now'] },
        { name: 'check_order_status', description: 'Check order progress', examples: ['Order status', 'How is my order'] },
        { name: 'find_nearby_sellers', description: 'Locate local sellers', examples: ['Nearby sellers', 'Who sells maize near me'] },
        { name: 'compare_products', description: 'Compare options', examples: ['Compare maize and rice'] },
        { name: 'get_recommendations', description: 'Get suggestions', examples: ['Recommend vegetables', 'What do you suggest'] },
        { name: 'help', description: 'Get assistance', examples: ['Help', 'What can you do'] }
      ],
      'sw-KE': [
        { name: 'tafuta', description: 'Tafuta bidhaa', examples: ['Tafuta mahindi', 'Onyesha nyanya'] },
        { name: 'bei', description: 'Angalia bei', examples: ['Bei ya mahindi', 'Ni kiasi gani mchele'] },
        { name: 'nunua', description: 'Nunua bidhaa', examples: ['Nunua mchele', 'Ninunue nyanya'] },
        { name: 'orodha', description: 'Orodha ya bidhaa', examples: ['Orodha yangu', 'Bidhaa zangu'] },
        { name: 'msaada', description: 'Pata msaada', examples: ['Msaada', 'Nisaidie'] }
      ]
    };

    res.json({
      success: true,
      language,
      enhanced: true,
      commands: commands[language] || commands['en-US'],
      tips: [
        'Speak clearly and at a normal pace',
        'Use natural language phrases',
        'Mention locations when searching',
        'You can combine commands'
      ],
      supported_languages: ['en-US', 'sw-KE', 'fr-FR', 'ar-SA']
    });
  } else {
    // Legacy help response
    const commands = language === 'sw' ? {
      'Tafuta [bidhaa]': 'Tafuta bidhaa unazotaka kununua',
      'Nunua [bidhaa]': 'Nunua bidhaa',
      'Uza [bidhaa]': 'Weka bidhaa kwenye soko',
      'Bei ya [bidhaa]': 'Angalia bei za soko',
      'Hali ya hewa': 'Angalia hali ya hewa',
      'Akaunti yangu': 'Angalia taarifa za akaunti yako',
      'Malipo': 'Angalia malipo yako',
      'Orodha yangu': 'Angalia bidhaa zako'
    } : {
      'Search [product]': 'Search for products to buy',
      'Buy [product]': 'Purchase a product',
      'Sell [product]': 'List a product for sale',
      'Price of [product]': 'Check market prices',
      'Weather': 'Check weather forecast',
      'My account': 'View your account information',
      'Payments': 'View your payments',
      'My listings': 'View your product listings'
    };

    res.json({
      language,
      commands,
      examples: language === 'sw'
        ? ['Tafuta mahindi', 'Bei ya nyanya', 'Hali ya hewa Arusha', 'Akaunti yangu']
        : ['Search maize', 'Price of tomatoes', 'Weather in Arusha', 'My account']
    });
  }
});

// Get supported languages
router.get('/languages', (req, res) => {
  res.json({
    success: true,
    data: {
      primary: 'en-US',
      supported: [
        { code: 'en-US', name: 'English (US)' },
        { code: 'sw-KE', name: 'Swahili (Kenya)' },
        { code: 'fr-FR', name: 'French (France)' },
        { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' }
      ]
    }
  });
});

// Get voice processing status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      service_status: 'active',
      speech_to_text: 'available',
      text_to_speech: 'available',
      nlp_processing: 'active',
      supported_formats: ['wav', 'mp3', 'ogg', 'webm', 'flac'],
      max_file_size: '10MB',
      supported_languages: ['en-US', 'sw-KE', 'fr-FR', 'ar-SA'],
      average_processing_time: '2-3 seconds',
      last_updated: new Date().toISOString()
    }
  });
});

// Test voice processing (development endpoint)
router.post('/test', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    // Mock enhanced processing for testing
    const mockResult = {
      success: true,
      transcription: 'find fresh tomatoes',
      confidence: 0.87,
      command: 'search_product',
      parameters: { product: 'fresh tomatoes' },
      response: 'I found 5 fresh tomato products. The closest one is 2 kilometers away. Fresh Farm Tomatoes cost 80 shillings per kilogram. Would you like more details?',
      suggested_actions: ['get_product_details', 'add_to_cart'],
      language: 'en-US'
    };

    res.json({
      success: true,
      data: mockResult
    });

  } catch (error) {
    console.error('Test processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Test processing failed',
      error: error.message
    });
  }
});

// Voice commerce settings (protected)
router.get('/settings', protect, async (req, res) => {
  try {
    // Mock settings (would retrieve from user profile)
    const settings = {
      preferred_language: 'en-US',
      voice_speed: 1.0,
      voice_pitch: 0.0,
      enable_audio_responses: true,
      auto_start_listening: false,
      wake_word: 'hey kulima',
      privacy_mode: false
    };

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
});

// Update voice commerce settings (protected)
router.put('/settings', protect, async (req, res) => {
  try {
    const { preferred_language, voice_speed, voice_pitch, enable_audio_responses, wake_word } = req.body;

    // Validate settings
    const validLanguages = ['en-US', 'sw-KE', 'fr-FR', 'ar-SA'];
    if (preferred_language && !validLanguages.includes(preferred_language)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language code'
      });
    }

    if (voice_speed && (voice_speed < 0.5 || voice_speed > 2.0)) {
      return res.status(400).json({
        success: false,
        message: 'Voice speed must be between 0.5 and 2.0'
      });
    }

    // Mock settings update (would save to user profile)
    const updatedSettings = {
      preferred_language: preferred_language || 'en-US',
      voice_speed: voice_speed || 1.0,
      voice_pitch: voice_pitch || 0.0,
      enable_audio_responses: enable_audio_responses !== false,
      wake_word: wake_word || 'hey kulima'
    };

    res.json({
      success: true,
      message: 'Voice settings updated successfully',
      data: updatedSettings
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
});

module.exports = router;
