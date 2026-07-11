const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MkulimaLink API',
      version: '2.0.0',
      description: 'Agriculture Super-App API for East Africa - Marketplace, Financial Services, Logistics, and Farm Management',
      contact: {
        name: 'MkulimaLink Support',
        email: 'support@mkulimalink.co.tz',
        url: 'https://mkulimalink.co.tz'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.mkulimalink.co.tz/api/v1',
        description: 'Production server'
      }
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Products', description: 'Product listings' },
      { name: 'Transactions', description: 'Order management' },
      { name: 'Chat', description: 'Real-time messaging' },
      { name: 'Delivery', description: 'Logistics and tracking' },
      { name: 'Loans', description: 'Micro-loan services' },
      { name: 'Insurance', description: 'Crop and equipment insurance' },
      { name: 'Group Buy', description: 'Group purchasing' },
      { name: 'Equipment', description: 'Equipment rental' },
      { name: 'Market', description: 'Market prices and trends' },
      { name: 'Weather', description: 'Weather forecasts' },
      { name: 'AI', description: 'AI-powered features' },
      { name: 'Payments', description: 'M-Pesa payments' },
      { name: 'Health', description: 'API health checks' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Mkulima' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', example: '+255712345678' },
            role: { type: 'string', enum: ['farmer', 'buyer', 'admin'], example: 'farmer' },
            location: {
              type: 'object',
              properties: {
                region: { type: 'string', example: 'Arusha' },
                district: { type: 'string', example: 'Arusha Urban' }
              }
            },
            isPremium: { type: 'boolean', example: false },
            rating: { type: 'number', example: 4.5 },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Fresh Tomatoes' },
            description: { type: 'string', example: 'Organic tomatoes from Arusha' },
            category: { type: 'string', enum: ['vegetables', 'fruits', 'grains', 'legumes', 'dairy', 'poultry', 'livestock'] },
            price: { type: 'number', example: 2000 },
            unit: { type: 'string', example: 'kg' },
            quantity: { type: 'number', example: 100 },
            images: { type: 'array', items: { type: 'string' } },
            seller: { $ref: '#/components/schemas/User' },
            location: {
              type: 'object',
              properties: {
                region: { type: 'string' },
                district: { type: 'string' }
              }
            },
            status: { type: 'string', enum: ['available', 'sold', 'reserved'] }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            product: { $ref: '#/components/schemas/Product' },
            buyer: { $ref: '#/components/schemas/User' },
            seller: { $ref: '#/components/schemas/User' },
            quantity: { type: 'number' },
            totalPrice: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
            paymentStatus: { type: 'string', enum: ['pending', 'paid', 'refunded'] }
          }
        },
        Loan: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            borrower: { $ref: '#/components/schemas/User' },
            amount: { type: 'number', example: 500000 },
            purpose: { type: 'string', example: 'seeds' },
            interestRate: { type: 'number', example: 15 },
            term: { type: 'number', example: 6 },
            status: { type: 'string', enum: ['pending', 'approved', 'disbursed', 'repaid', 'defaulted'] }
          }
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'integer', example: 400 },
            error: { type: 'string', example: 'Bad Request' },
            message: { type: 'string', example: 'Validation failed' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'farmer@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'phone', 'role'],
          properties: {
            name: { type: 'string', example: 'John Mkulima' },
            email: { type: 'string', format: 'email', example: 'farmer@example.com' },
            password: { type: 'string', format: 'password', minLength: 6 },
            phone: { type: 'string', example: '+255712345678' },
            role: { type: 'string', enum: ['farmer', 'buyer'] },
            location: {
              type: 'object',
              properties: {
                region: { type: 'string', example: 'Arusha' },
                district: { type: 'string', example: 'Arusha Urban' }
              }
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./backend/routes/*.js', './backend/routes/v1/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;



