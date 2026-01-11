const mongoose = require('mongoose');

/**
 * Database indexes for improved query performance
 */

// User indexes
const userIndexes = [
  { email: 1 }, // Unique email lookup
  { phone: 1 }, // Unique phone lookup
  { role: 1 }, // Filter by role
  { 'location.region': 1 }, // Regional queries
  { 'location.district': 1 }, // District queries
  { isPremium: 1 }, // Premium users
  { createdAt: -1 }, // Recent users
  { rating: -1 }, // Top rated users
  { name: 'text', email: 'text', phone: 'text' } // Search
];

// Product indexes
const productIndexes = [
  { seller: 1 }, // Products by seller
  { category: 1 }, // Category filtering
  { 'location.region': 1 }, // Regional products
  { 'location.district': 1 }, // District products
  { price: 1 }, // Price range queries
  { quantity: 1 }, // Stock availability
  { status: 1 }, // Status filtering
  { createdAt: -1 }, // Recent products
  { views: -1 }, // Popular products
  { rating: -1 }, // Top rated products
  { name: 'text', description: 'text', category: 'text' }, // Search
  { category: 1, 'location.region': 1 }, // Compound index
  { status: 1, createdAt: -1 }, // Active products by date
  { seller: 1, status: 1 }, // Seller's active products
  { price: 1, category: 1 }, // Price by category
  { 'location.region': 1, category: 1, status: 1 } // Regional category filter
];

// Transaction indexes
const transactionIndexes = [
  { buyer: 1 }, // Buyer's transactions
  { seller: 1 }, // Seller's transactions
  { product: 1 }, // Product transactions
  { status: 1 }, // Status filtering
  { paymentStatus: 1 }, // Payment status
  { createdAt: -1 }, // Recent transactions
  { totalPrice: -1 }, // High value transactions
  { buyer: 1, status: 1 }, // Buyer's transactions by status
  { seller: 1, status: 1 }, // Seller's transactions by status
  { createdAt: -1, status: 1 }, // Recent transactions by status
  { product: 1, status: 1 }, // Product transactions by status
  { buyer: 1, createdAt: -1 }, // Buyer's transaction history
  { seller: 1, createdAt: -1 }, // Seller's transaction history
  { 'product.category': 1, status: 1 }, // Category transactions
  { 'product.location.region': 1, status: 1 } // Regional transactions
];

// Chat indexes
const chatIndexes = [
  { participants: 1 }, // User's chats
  { 'lastMessage.timestamp': -1 }, // Recent messages
  { 'lastMessage.sender': 1 }, // Messages by sender
  { createdAt: -1 }, // Recent chats
  { participants: 1, 'lastMessage.timestamp': -1 }, // User's recent chats
  { 'lastMessage.sender': 1, 'lastMessage.timestamp': -1 }, // Sender's recent messages
  { isActive: 1, 'lastMessage.timestamp': -1 } // Active chats
];

// Message indexes
const messageIndexes = [
  { chat: 1 }, // Messages by chat
  { sender: 1 }, // Messages by sender
  { timestamp: -1 }, // Recent messages
  { chat: 1, timestamp: -1 }, // Chat's message history
  { sender: 1, timestamp: -1 }, // Sender's message history
  { chat: 1, sender: 1 }, // Messages by chat and sender
  { chat: 1, isRead: false }, // Unread messages
  { sender: 1, isRead: false }, // Unread sent messages
  { timestamp: -1, isRead: false } // Recent unread messages
];

// Loan indexes
const loanIndexes = [
  { borrower: 1 }, // Borrower's loans
  { status: 1 }, // Status filtering
  { purpose: 1 }, // Loan purpose
  { amount: -1 }, // High value loans
  { createdAt: -1 }, // Recent loans
  { borrower: 1, status: 1 }, // Borrower's loans by status
  { status: 1, createdAt: -1 }, // Recent loans by status
  { purpose: 1, status: 1 }, // Purpose by status
  { amount: -1, status: 1 }, // High value loans by status
  { borrower: 1, createdAt: -1 }, // Borrower's loan history
  { creditScore: -1, status: 1 } // Credit score by status
];

// Insurance indexes
const insuranceIndexes = [
  { policyholder: 1 }, // Policyholder's policies
  { type: 1 }, // Insurance type
  { status: 1 }, // Status filtering
  { premium: -1 }, // High premium policies
  { createdAt: -1 }, // Recent policies
  { policyholder: 1, status: 1 }, // Policyholder's policies by status
  { type: 1, status: 1 }, // Type by status
  { status: 1, createdAt: -1 }, // Recent policies by status
  { policyholder: 1, createdAt: -1 }, // Policyholder's policy history
  { 'coverage.type': 1, status: 1 } // Coverage by status
];

// Group Buy indexes
const groupBuyIndexes = [
  { creator: 1 }, // Creator's group buys
  { product: 1 }, // Product group buys
  { status: 1 }, // Status filtering
  { 'location.region': 1 }, // Regional group buys
  { endDate: -1 }, // Ending soon
  { createdAt: -1 }, // Recent group buys
  { currentQuantity: 1 }, // Participation level
  { creator: 1, status: 1 }, // Creator's group buys by status
  { status: 1, endDate: -1 }, // Active group buys by end date
  { 'location.region': 1, status: 1 }, // Regional active group buys
  { product: 1, status: 1 }, // Product group buys by status
  { endDate: -1, status: 1 } // Ending soon by status
];

// Equipment indexes
const equipmentIndexes = [
  { owner: 1 }, // Owner's equipment
  { category: 1 }, // Equipment category
  { 'location.region': 1 }, // Regional equipment
  { status: 1 }, // Status filtering
  { pricePerDay: 1 }, // Price range
  { availability: 1 }, // Available equipment
  { createdAt: -1 }, // Recent equipment
  { owner: 1, status: 1 }, // Owner's equipment by status
  { category: 1, status: 1 }, // Category by status
  { 'location.region': 1, status: 1 }, // Regional equipment by status
  { pricePerDay: 1, status: 1 }, // Price by status
  { availability: 1, status: 1 }, // Available equipment
  { category: 1, 'location.region': 1, status: 1 } // Regional category filter
];

// Price Alert indexes
const priceAlertIndexes = [
  { user: 1 }, // User's alerts
  { product: 1 }, // Product alerts
  { isActive: 1 }, // Active alerts
  { triggerPrice: 1 }, // Price level
  { createdAt: -1 }, // Recent alerts
  { user: 1, isActive: 1 }, // User's active alerts
  { product: 1, isActive: 1 }, // Product active alerts
  { triggerType: 1, isActive: 1 }, // Type by active status
  { user: 1, createdAt: -1 }, // User's alert history
  { triggerPrice: 1, isActive: 1 } // Price level active alerts
];

// Supplier indexes
const supplierIndexes = [
  { region: 1 }, // Regional suppliers
  { category: 1 }, // Supplier category
  { isVerified: 1 }, // Verified suppliers
  { rating: -1 }, // Top rated suppliers
  { createdAt: -1 }, // Recent suppliers
  { region: 1, category: 1 }, // Regional category
  { region: 1, isVerified: 1 }, // Regional verified
  { category: 1, isVerified: 1 }, // Category verified
  { region: 1, rating: -1 }, // Regional top rated
  { isVerified: 1, rating: -1 }, // Verified top rated
  { name: 'text', businessName: 'text', description: 'text' }, // Search
  { region: 1, category: 1, isVerified: 1 } // Regional category verified
];

// Analytics Event indexes
const analyticsIndexes = [
  { event: 1 }, // Event type
  { userId: 1 }, // User events
  { timestamp: -1 }, // Recent events
  { 'properties.productCategory': 1 }, // Category events
  { 'properties.region': 1 }, // Regional events
  { event: 1, timestamp: -1 }, // Event history
  { userId: 1, timestamp: -1 }, // User's event history
  { event: 1, userId: 1 }, // User's events by type
  { timestamp: -1, event: 1 }, // Recent events by type
  { 'properties.region': 1, event: 1 }, // Regional events by type
  { 'properties.productCategory': 1, event: 1 } // Category events by type
];

/**
 * Create all indexes for a model
 * @param {mongoose.Model} Model - Mongoose model
 * @param {Array} indexes - Array of index definitions
 */
async function createIndexes(Model, indexes) {
  try {
    for (const index of indexes) {
      if (typeof index === 'string') {
        // Simple index
        await Model.createIndex({ [index]: 1 });
      } else if (typeof index === 'object') {
        // Compound or text index
        await Model.createIndex(index);
      }
    }
    console.log(`✅ Indexes created for ${Model.modelName}`);
  } catch (error) {
    console.error(`❌ Error creating indexes for ${Model.modelName}:`, error);
  }
}

/**
 * Create all database indexes
 */
async function createAllIndexes() {
  const models = {
    User: userIndexes,
    Product: productIndexes,
    Transaction: transactionIndexes,
    Chat: chatIndexes,
    Message: messageIndexes,
    Loan: loanIndexes,
    Insurance: insuranceIndexes,
    GroupBuy: groupBuyIndexes,
    Equipment: equipmentIndexes,
    PriceAlert: priceAlertIndexes,
    Supplier: supplierIndexes,
    AnalyticsEvent: analyticsIndexes
  };

  for (const [modelName, indexes] of Object.entries(models)) {
    try {
      const Model = mongoose.model(modelName);
      await createIndexes(Model, indexes);
    } catch (error) {
      console.error(`Model ${modelName} not found, skipping indexes`);
    }
  }

  console.log('🎯 All database indexes created successfully');
}

/**
 * Drop all indexes (for testing/reset)
 */
async function dropAllIndexes() {
  const models = [
    'User', 'Product', 'Transaction', 'Chat', 'Message',
    'Loan', 'Insurance', 'GroupBuy', 'Equipment', 'PriceAlert',
    'Supplier', 'AnalyticsEvent'
  ];

  for (const modelName of models) {
    try {
      const Model = mongoose.model(modelName);
      await Model.collection.dropIndexes();
      console.log(`🗑️ Dropped indexes for ${modelName}`);
    } catch (error) {
      console.error(`Error dropping indexes for ${modelName}:`, error);
    }
  }
}

module.exports = {
  createIndexes,
  createAllIndexes,
  dropAllIndexes,
  userIndexes,
  productIndexes,
  transactionIndexes,
  chatIndexes,
  messageIndexes,
  loanIndexes,
  insuranceIndexes,
  groupBuyIndexes,
  equipmentIndexes,
  priceAlertIndexes,
  supplierIndexes,
  analyticsIndexes
};
