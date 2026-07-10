const mongoose = require('mongoose');
const logger = require('./logger');

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

// Livestock indexes
const livestockIndexes = [
  { owner: 1 }, // Owner's animals
  { workspace: 1 }, // Workspace animals
  { species: 1 }, // Species filtering
  { healthStatus: 1 }, // Health status filtering
  { tagId: 1 }, // Tag lookup
  { isActive: 1 }, // Active animals
  { createdAt: -1 }, // Recent animals
  { owner: 1, species: 1, healthStatus: 1 }, // Owner's animals by species and health
  { owner: 1, workspace: 1 }, // Owner's workspace animals
  { owner: 1, isActive: 1 }, // Owner's active animals
  { owner: 1, createdAt: -1 }, // Owner's recent animals
  { species: 1, healthStatus: 1 }, // Species health filtering
  { name: 'text', tagId: 'text', breed: 'text' } // Search
];

// Livestock Event indexes
const livestockEventIndexes = [
  { livestock: 1 }, // Events per animal
  { type: 1 }, // Event type filtering
  { date: -1 }, // Recent events
  { livestock: 1, type: 1, date: -1 }, // Animal event history
  { createdAt: -1 } // Recent events
];

// Livestock Inventory indexes
const livestockInventoryIndexes = [
  { owner: 1 }, // Owner's inventory
  { workspace: 1 }, // Workspace inventory
  { category: 1 }, // Category filtering
  { itemType: 1 }, // Item type filtering
  { lowStock: 1 }, // Low stock alerts
  { owner: 1, category: 1 }, // Owner's inventory by category
  { owner: 1, lowStock: 1 } // Owner's low stock items
];

// Farm Workspace indexes
const farmWorkspaceIndexes = [
  { owner: 1 }, // Owner's workspaces
  { 'members.user': 1 }, // Member's workspaces
  { createdAt: -1 }, // Recent workspaces
  { owner: 1, createdAt: -1 } // Owner's recent workspaces
];

// Breeds Library indexes
const breedsLibraryIndexes = [
  { species: 1 }, // Species filtering
  { createdBy: 1 }, // Custom breeds by creator
  { name: 'text', species: 'text' } // Search
];

// Reproduction indexes
const reproductionIndexes = [
  { livestock: 1 }, // Reproduction records per animal
  { status: 1 }, // Status filtering
  { expectedDueDate: 1 }, // Upcoming births
  { livestock: 1, status: 1, expectedDueDate: 1 } // Animal reproduction timeline
];

// Failed action indexes with TTL
const failedActionIndexes = [
  { type: 1, createdAt: -1 },
  { user: 1, createdAt: -1 },
  { email: 1, createdAt: -1 },
  { ip: 1, createdAt: -1 },
  [{ createdAt: 1 }, { expireAfterSeconds: 2592000 }] // 30 days TTL
];

// Recent search indexes with TTL
const recentSearchIndexes = [
  [{ user: 1, query: 1 }, { unique: true }],
  { user: 1, lastSearchedAt: -1 },
  [{ createdAt: 1 }, { expireAfterSeconds: 7776000 }] // 90 days TTL
];

// Notification indexes
const notificationIndexes = [
  { user: 1, read: 1, createdAt: -1 },
  { user: 1, type: 1, createdAt: -1 },
  [{ createdAt: 1 }, { expireAfterSeconds: 31536000 }] // 1 year TTL
];

// Payment event indexes with TTL
const paymentEventIndexes = [
  { transaction: 1 },
  { type: 1, createdAt: -1 },
  [{ createdAt: 1 }, { expireAfterSeconds: 15552000 }] // 180 days TTL
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
        await Model.collection.createIndex({ [index]: 1 });
      } else if (Array.isArray(index) && index.length === 2) {
        // Index with options (e.g. TTL, unique)
        await Model.collection.createIndex(index[0], index[1]);
      } else if (typeof index === 'object') {
        // Compound or text index
        await Model.collection.createIndex(index);
      }
    }
    logger.info(`Indexes created for ${Model.modelName}`);
  } catch (error) {
    logger.error(`Error creating indexes for ${Model.modelName}:`, error);
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
    AnalyticsEvent: analyticsIndexes,
    Livestock: livestockIndexes,
    LivestockEvent: livestockEventIndexes,
    LivestockInventory: livestockInventoryIndexes,
    FarmWorkspace: farmWorkspaceIndexes,
    BreedsLibrary: breedsLibraryIndexes,
    Reproduction: reproductionIndexes,
    FailedAction: failedActionIndexes,
    RecentSearch: recentSearchIndexes,
    Notification: notificationIndexes,
    PaymentEvent: paymentEventIndexes
  };

  for (const [modelName, indexes] of Object.entries(models)) {
    try {
      const Model = mongoose.model(modelName);
      await createIndexes(Model, indexes);
    } catch (error) {
      logger.error(`Model ${modelName} not found, skipping indexes`);
    }
  }

  logger.info('All database indexes created successfully');
}

/**
 * Drop all indexes (for testing/reset)
 */
async function dropAllIndexes() {
  const models = [
    'User', 'Product', 'Transaction', 'Chat', 'Message',
    'Loan', 'Insurance', 'GroupBuy', 'Equipment', 'PriceAlert',
    'Supplier', 'AnalyticsEvent', 'Livestock', 'LivestockEvent',
    'LivestockInventory', 'FarmWorkspace', 'BreedsLibrary', 'Reproduction',
    'FailedAction', 'RecentSearch', 'Notification', 'PaymentEvent'
  ];

  for (const modelName of models) {
    try {
      const Model = mongoose.model(modelName);
      await Model.collection.dropIndexes();
      logger.info(`Dropped indexes for ${modelName}`);
    } catch (error) {
      logger.error(`Error dropping indexes for ${modelName}:`, error);
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
  analyticsIndexes,
  livestockIndexes,
  livestockEventIndexes,
  livestockInventoryIndexes,
  farmWorkspaceIndexes,
  breedsLibraryIndexes,
  reproductionIndexes,
  failedActionIndexes,
  recentSearchIndexes,
  notificationIndexes,
  paymentEventIndexes
};
