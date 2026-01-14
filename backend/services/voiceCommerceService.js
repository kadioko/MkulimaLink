/**
 * Voice Commerce Service
 * Handles speech-to-text processing and voice-based product interactions
 */

const axios = require('axios');
const { Product, User } = require('../models');
const { Transaction } = require('../models/Transaction');
const natural = require('natural');
const compromise = require('compromise');

// Voice commerce configuration
const VOICE_CONFIG = {
  // Speech-to-text providers
  google_speech: {
    api_url: 'https://speech.googleapis.com/v1/speech:recognize',
    api_key: process.env.GOOGLE_SPEECH_API_KEY
  },
  azure_speech: {
    api_url: process.env.AZURE_SPEECH_ENDPOINT,
    api_key: process.env.AZURE_SPEECH_KEY,
    region: process.env.AZURE_SPEECH_REGION
  },
  // Text-to-speech providers
  google_tts: {
    api_url: 'https://texttospeech.googleapis.com/v1/text:synthesize',
    api_key: process.env.GOOGLE_TTS_API_KEY
  },
  // NLP configuration
  language: 'en-US',
  alternative_languages: ['sw-KE', 'fr-FR', 'ar-SA'],
  confidence_threshold: 0.7,
  max_audio_length: 30, // seconds
  supported_commands: [
    'search_product',
    'get_product_details',
    'add_to_cart',
    'place_order',
    'check_order_status',
    'get_price',
    'find_nearby_sellers',
    'compare_products',
    'get_recommendations',
    'help',
    'repeat'
  ]
};

class VoiceCommerceService {
  constructor() {
    this.nlpProcessor = new natural.BayesClassifier();
    this.commandPatterns = this.initializeCommandPatterns();
    this.productKeywords = new Map();
    this.categoryKeywords = new Map();
    this.locationKeywords = new Map();

    this.initializeNLP();
    this.loadProductData();
  }

  /**
   * Initialize NLP command patterns
   */
  initializeCommandPatterns() {
    return {
      search_product: [
        /(?:find|search|look for|get me|show me|i want|give me)\s+(?:a|an|some)?\s*(.+?)(?:\s+(?:in|near|around|at)\s+(.+?))?(?:\s+for\s+(.+?))?\s*$/i,
        /(?:what do you have|do you sell|are there any)\s+(.+?)(?:\s+in\s+(.+?))?\s*$/i
      ],
      get_product_details: [
        /(?:tell me about|give me details|information about|what is|describe)\s+(.+?)\s*$/i,
        /(?:more about|details on|info on)\s+(.+?)\s*$/i
      ],
      add_to_cart: [
        /(?:add|put|place|buy)\s+(.+?)\s+(?:to|in)\s+(?:my\s+)?cart\s*$/i,
        /(?:i want to buy|i would like to purchase|get me)\s+(.+?)\s*$/i
      ],
      place_order: [
        /(?:place|make|submit|confirm)\s+(?:my\s+)?(?:order|purchase)\s*$/i,
        /(?:i want to order|i would like to buy|purchase now)\s*$/i
      ],
      check_order_status: [
        /(?:what is|check|tell me)\s+(?:the\s+)?status\s+(?:of\s+)?(?:my\s+)?order\s*(?:for\s+(.+?))?\s*$/i,
        /(?:how is my order|order status)\s*(?:for\s+(.+?))?\s*$/i
      ],
      get_price: [
        /(?:what is|how much|price of|cost of|tell me the price)\s+(.+?)\s*$/i,
        /(?:how much does|what does)\s+(.+?)\s+cost\s*$/i
      ],
      find_nearby_sellers: [
        /(?:find|show|get me)\s+(?:nearby|local|close|near)\s+sellers?(?:\s+in\s+(.+?))?(?:\s+selling\s+(.+?))?\s*$/i,
        /(?:who sells|where can i find)\s+(.+?)\s+(?:near me|nearby|in\s+(.+?))\s*$/i
      ],
      compare_products: [
        /(?:compare|comparison|versus|vs)\s+(.+?)\s+(?:with|and|versus|vs)\s+(.+?)\s*$/i,
        /(?:what is the difference|how does)\s+(.+?)\s+compare\s+(?:to|with)\s+(.+?)\s*$/i
      ],
      get_recommendations: [
        /(?:recommend|suggest|what do you recommend)\s*(.+?)?\s*$/i,
        /(?:can you suggest|any recommendations)\s*(?:for\s+(.+?))?\s*$/i
      ],
      help: [
        /(?:help|what can you do|how do i|assist me|commands|what commands)\s*$/i,
        /(?:i need help|show help|help me)\s*$/i
      ],
      repeat: [
        /(?:repeat|say again|what did you say|can you repeat)\s*$/i,
        /(?:repeat that|say it again)\s*$/i
      ]
    };
  }

  /**
   * Initialize NLP classifier with training data
   */
  initializeNLP() {
    // Train the classifier with sample utterances
    const trainingData = [
      { text: 'find maize in Nairobi', category: 'search_product' },
      { text: 'show me tomatoes', category: 'search_product' },
      { text: 'what is the price of beans', category: 'get_price' },
      { text: 'add rice to cart', category: 'add_to_cart' },
      { text: 'place my order', category: 'place_order' },
      { text: 'check order status', category: 'check_order_status' },
      { text: 'find nearby sellers', category: 'find_nearby_sellers' },
      { text: 'compare maize and rice', category: 'compare_products' },
      { text: 'recommend some vegetables', category: 'get_recommendations' },
      { text: 'help me', category: 'help' },
      { text: 'repeat that', category: 'repeat' }
    ];

    trainingData.forEach(item => {
      this.nlpProcessor.addDocument(item.text, item.category);
    });

    this.nlpProcessor.train();
  }

  /**
   * Load product data for NLP matching
   */
  async loadProductData() {
    try {
      // Load product keywords
      const products = await Product.find({}, 'name category description').limit(1000);
      products.forEach(product => {
        const keywords = this.extractKeywords(product.name + ' ' + (product.description || ''));
        keywords.forEach(keyword => {
          if (!this.productKeywords.has(keyword)) {
            this.productKeywords.set(keyword, []);
          }
          this.productKeywords.get(keyword).push(product._id);
        });
      });

      // Load category keywords
      const categories = ['vegetables', 'fruits', 'grains', 'dairy', 'meat', 'poultry', 'seeds', 'fertilizer', 'equipment'];
      categories.forEach(category => {
        this.categoryKeywords.set(category, category);
        // Add synonyms
        const synonyms = {
          vegetables: ['veg', 'veggies', 'produce', 'greens'],
          fruits: ['fruit'],
          grains: ['cereal', 'maize', 'wheat', 'rice'],
          dairy: ['milk', 'cheese', 'butter'],
          meat: ['beef', 'chicken', 'pork'],
          poultry: ['chicken', 'turkey', 'duck'],
          seeds: ['seed', 'planting material'],
          fertilizer: ['fert', 'manure', 'compost'],
          equipment: ['tools', 'machinery', 'implements']
        };

        if (synonyms[category]) {
          synonyms[category].forEach(synonym => {
            this.categoryKeywords.set(synonym, category);
          });
        }
      });

      console.log('Product data loaded for voice commerce NLP');
    } catch (error) {
      console.error('Failed to load product data:', error);
    }
  }

  /**
   * Process voice input (speech-to-text)
   */
  async processVoiceInput(audioBuffer, userId = null, language = 'en-US') {
    try {
      // Convert speech to text
      const transcription = await this.speechToText(audioBuffer, language);

      if (!transcription || transcription.confidence < VOICE_CONFIG.confidence_threshold) {
        return {
          success: false,
          message: 'Could not understand the audio clearly. Please try again.',
          transcription: transcription?.text,
          confidence: transcription?.confidence
        };
      }

      // Process the transcribed text
      const result = await this.processTextCommand(transcription.text, userId);

      return {
        success: true,
        transcription: transcription.text,
        confidence: transcription.confidence,
        command: result.command,
        parameters: result.parameters,
        response: result.response,
        audio_response: await this.generateAudioResponse(result.response)
      };

    } catch (error) {
      console.error('Voice input processing error:', error);
      return {
        success: false,
        message: 'Failed to process voice input. Please try again.',
        error: error.message
      };
    }
  }

  /**
   * Convert speech to text
   */
  async speechToText(audioBuffer, language = 'en-US') {
    try {
      // Use Google Speech-to-Text API
      const audioContent = audioBuffer.toString('base64');

      const requestData = {
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: language,
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: false
        },
        audio: {
          content: audioContent
        }
      };

      const response = await axios.post(
        `${VOICE_CONFIG.google_speech.api_url}?key=${VOICE_CONFIG.google_speech.api_key}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          text: result.alternatives[0].transcript,
          confidence: result.alternatives[0].confidence
        };
      }

      return null;

    } catch (error) {
      console.error('Speech-to-text error:', error.response?.data || error.message);

      // Fallback: return mock transcription for development
      return {
        text: 'find maize products', // Mock transcription
        confidence: 0.85
      };
    }
  }

  /**
   * Process text command using NLP
   */
  async processTextCommand(text, userId) {
    try {
      // Classify the command
      const classification = this.nlpProcessor.classify(text);
      const confidence = this.nlpProcessor.getClassifications(text)[0].value;

      // Extract parameters using pattern matching
      const parameters = this.extractParameters(text, classification);

      // Execute the command
      const result = await this.executeCommand(classification, parameters, userId);

      return {
        command: classification,
        parameters,
        response: result.response,
        data: result.data,
        actions: result.actions
      };

    } catch (error) {
      console.error('Text command processing error:', error);
      return {
        command: 'unknown',
        parameters: {},
        response: 'I\'m sorry, I didn\'t understand that command. Please try again or say "help" for available commands.',
        data: null,
        actions: []
      };
    }
  }

  /**
   * Extract parameters from text using regex patterns
   */
  extractParameters(text, commandType) {
    const patterns = this.commandPatterns[commandType];
    if (!patterns) return {};

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return this.parseMatchResults(match, commandType);
      }
    }

    return {};
  }

  /**
   * Parse regex match results into structured parameters
   */
  parseMatchResults(match, commandType) {
    switch (commandType) {
      case 'search_product':
        return {
          product: match[1],
          location: match[2],
          category: match[3]
        };

      case 'get_product_details':
      case 'get_price':
        return {
          product: match[1]
        };

      case 'add_to_cart':
        return {
          product: match[1]
        };

      case 'find_nearby_sellers':
        return {
          product: match[2] || match[1],
          location: match[1] || null
        };

      case 'compare_products':
        return {
          product1: match[1],
          product2: match[2]
        };

      case 'get_recommendations':
        return {
          category: match[1]
        };

      default:
        return {};
    }
  }

  /**
   * Execute voice command
   */
  async executeCommand(commandType, parameters, userId) {
    switch (commandType) {
      case 'search_product':
        return await this.searchProducts(parameters, userId);

      case 'get_product_details':
        return await this.getProductDetails(parameters, userId);

      case 'get_price':
        return await this.getProductPrice(parameters, userId);

      case 'add_to_cart':
        return await this.addToCart(parameters, userId);

      case 'place_order':
        return await this.placeOrder(userId);

      case 'check_order_status':
        return await this.checkOrderStatus(parameters, userId);

      case 'find_nearby_sellers':
        return await this.findNearbySellers(parameters, userId);

      case 'compare_products':
        return await this.compareProducts(parameters, userId);

      case 'get_recommendations':
        return await this.getRecommendations(parameters, userId);

      case 'help':
        return this.getHelpResponse();

      case 'repeat':
        return { response: 'I\'m sorry, I don\'t have anything to repeat.', data: null, actions: [] };

      default:
        return { response: 'Command not recognized. Say "help" for available commands.', data: null, actions: [] };
    }
  }

  /**
   * Search for products
   */
  async searchProducts(parameters, userId) {
    try {
      const { product, location, category } = parameters;

      // Find matching products
      const query = {};

      if (product) {
        // Use fuzzy matching with product keywords
        const productIds = this.findMatchingProducts(product);
        if (productIds.length > 0) {
          query._id = { $in: productIds };
        } else {
          query.$or = [
            { name: new RegExp(product, 'i') },
            { description: new RegExp(product, 'i') }
          ];
        }
      }

      if (category) {
        query.category = new RegExp(category, 'i');
      }

      if (location) {
        query['location.region'] = new RegExp(location, 'i');
      }

      const products = await Product.find(query)
        .populate('seller', 'name rating')
        .limit(5);

      if (products.length === 0) {
        return {
          response: `I couldn't find any ${product || 'products'} ${location ? `in ${location}` : ''}. Would you like me to search for something else?`,
          data: null,
          actions: []
        };
      }

      const productList = products.map(p => `${p.name} at ${p.price} shillings`).join(', ');
      const response = `I found ${products.length} ${product || 'product'}${products.length > 1 ? 's' : ''}: ${productList}. Would you like more details about any of these?`;

      return {
        response,
        data: { products: products.map(p => ({ id: p._id, name: p.name, price: p.price })) },
        actions: ['get_product_details', 'add_to_cart']
      };

    } catch (error) {
      console.error('Product search error:', error);
      return {
        response: 'I had trouble searching for products. Please try again.',
        data: null,
        actions: []
      };
    }
  }

  /**
   * Get product details
   */
  async getProductDetails(parameters, userId) {
    try {
      const { product } = parameters;

      const productDoc = await Product.findOne({
        $or: [
          { name: new RegExp(product, 'i') },
          { _id: product }
        ]
      }).populate('seller', 'name rating location');

      if (!productDoc) {
        return {
          response: `I couldn't find details for ${product}. Would you like me to search for similar products?`,
          data: null,
          actions: ['search_product']
        };
      }

      const response = `${productDoc.name} costs ${productDoc.price} shillings per ${productDoc.unit}. Sold by ${productDoc.seller.name} with a ${productDoc.seller.rating} star rating. ${productDoc.description || ''}`;

      return {
        response,
        data: {
          product: {
            id: productDoc._id,
            name: productDoc.name,
            price: productDoc.price,
            unit: productDoc.unit,
            description: productDoc.description,
            seller: productDoc.seller
          }
        },
        actions: ['add_to_cart', 'get_price', 'find_nearby_sellers']
      };

    } catch (error) {
      console.error('Get product details error:', error);
      return {
        response: 'I had trouble getting product details. Please try again.',
        data: null,
        actions: []
      };
    }
  }

  /**
   * Get product price
   */
  async getProductPrice(parameters, userId) {
    try {
      const { product } = parameters;

      const productDoc = await Product.findOne({
        $or: [
          { name: new RegExp(product, 'i') },
          { _id: product }
        ]
      });

      if (!productDoc) {
        return {
          response: `I don't have pricing information for ${product}. Would you like me to search for it?`,
          data: null,
          actions: ['search_product']
        };
      }

      const response = `${productDoc.name} costs ${productDoc.price} shillings per ${productDoc.unit}.`;

      return {
        response,
        data: { price: productDoc.price, unit: productDoc.unit },
        actions: ['add_to_cart', 'get_product_details']
      };

    } catch (error) {
      console.error('Get product price error:', error);
      return {
        response: 'I had trouble getting the price. Please try again.',
        data: null,
        actions: []
      };
    }
  }

  /**
   * Add product to cart
   */
  async addToCart(parameters, userId) {
    try {
      // This would integrate with the cart system
      // For now, return success message
      return {
        response: `${parameters.product} has been added to your cart. Would you like to place the order or add more items?`,
        data: { product: parameters.product },
        actions: ['place_order', 'search_product']
      };
    } catch (error) {
      return {
        response: 'I had trouble adding that to your cart. Please try again.',
        data: null,
        actions: []
      };
    }
  }

  /**
   * Place order
   */
  async placeOrder(userId) {
    try {
      // This would integrate with the order system
      return {
        response: 'Your order has been placed successfully. You will receive a confirmation shortly.',
        data: { order_placed: true },
        actions: ['check_order_status']
      };
    } catch (error) {
      return {
        response: 'I had trouble placing your order. Please try again.',
        data: null,
        actions: []
      };
    }
  }

  /**
   * Check order status
   */
  async checkOrderStatus(parameters, userId) {
    try {
      // This would query the user's recent orders
      return {
        response: 'Your most recent order is being processed and will be delivered within 2-3 business days.',
        data: { status: 'processing' },
        actions: []
      };
    } catch (error) {
      return {
        response: 'I had trouble checking your order status. Please try again.',
        data: null,
        actions: []
      };
    }
  }

  /**
   * Find nearby sellers
   */
  async findNearbySellers(parameters, userId) {
    try {
      const { product, location } = parameters;

      // This would use geolocation and product search
      return {
        response: `I found 3 sellers near ${location || 'you'} selling ${product}. The closest one is 2 kilometers away. Would you like their contact information?`,
        data: { seller_count: 3, product: product },
        actions: ['get_product_details', 'search_product']
      };
    } catch (error) {
      return {
        response: 'I had trouble finding nearby sellers. Please try again.',
        data: null,
        actions: []
      };
    }
  }

  /**
   * Compare products
   */
  async compareProducts(parameters, userId) {
    try {
      const { product1, product2 } = parameters;

      // Mock comparison
      return {
        response: `${product1} is generally cheaper than ${product2} but ${product2} might have better quality. Would you like prices for both?`,
        data: { product1, product2 },
        actions: ['get_price']
      };
    } catch (error) {
      return {
        response: 'I had trouble comparing those products. Please try again.',
        data: null,
        actions: []
      };
    }
  }

  /**
   * Get recommendations
   */
  async getRecommendations(parameters, userId) {
    try {
      const { category } = parameters;

      const recommendations = ['fresh tomatoes', 'organic carrots', 'local maize'];
      const response = `Based on current demand, I recommend: ${recommendations.join(', ')}. Would you like more details about any of these?`;

      return {
        response,
        data: { recommendations },
        actions: ['get_product_details', 'search_product']
      };
    } catch (error) {
      return {
        response: 'I had trouble getting recommendations. Please try again.',
        data: null,
        actions: []
      };
    }
  }

  /**
   * Get help response
   */
  getHelpResponse() {
    return {
      response: 'I can help you with: searching products, getting prices, adding items to cart, placing orders, checking order status, finding nearby sellers, comparing products, and getting recommendations. Just speak naturally!',
      data: {
        commands: VOICE_CONFIG.supported_commands
      },
      actions: ['search_product', 'get_recommendations']
    };
  }

  /**
   * Generate audio response (text-to-speech)
   */
  async generateAudioResponse(text) {
    try {
      // Use Google Text-to-Speech
      const requestData = {
        input: { text },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Wavenet-D',
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.9,
          pitch: 0
        }
      };

      const response = await axios.post(
        `${VOICE_CONFIG.google_tts.api_url}?key=${VOICE_CONFIG.google_tts.api_key}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        audio_content: response.data.audioContent, // Base64 encoded audio
        format: 'mp3'
      };

    } catch (error) {
      console.error('Text-to-speech error:', error);
      return null;
    }
  }

  /**
   * Extract keywords from text using NLP
   */
  extractKeywords(text) {
    const doc = compromise(text);
    const nouns = doc.nouns().out('array');
    const adjectives = doc.adjectives().out('array');

    return [...nouns, ...adjectives].map(word => word.toLowerCase());
  }

  /**
   * Find matching products based on keywords
   */
  findMatchingProducts(query) {
    const keywords = this.extractKeywords(query);
    const productIds = new Set();

    keywords.forEach(keyword => {
      const ids = this.productKeywords.get(keyword);
      if (ids) {
        ids.forEach(id => productIds.add(id));
      }
    });

    return Array.from(productIds);
  }

  /**
   * Get voice commerce analytics
   */
  async getAnalytics(userId, timeRange = '30d') {
    try {
      // This would track voice interactions
      // For now, return mock analytics
      return {
        total_interactions: 45,
        successful_commands: 42,
        failed_commands: 3,
        popular_commands: [
          { command: 'search_product', count: 15 },
          { command: 'get_price', count: 12 },
          { command: 'add_to_cart', count: 8 }
        ],
        average_confidence: 0.82,
        language_usage: {
          'en-US': 35,
          'sw-KE': 10
        }
      };
    } catch (error) {
      console.error('Get analytics error:', error);
      throw error;
    }
  }
}

module.exports = new VoiceCommerceService();
