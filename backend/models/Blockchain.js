/**
 * Blockchain Models
 * Models for blockchain-based supply chain tracking
 */

const mongoose = require('mongoose');

const supplyChainRecordSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  recordType: {
    type: String,
    enum: ['batch_creation', 'supply_chain_event', 'ownership_transfer', 'quality_check', 'certification'],
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  previousHash: {
    type: String,
    default: null
  },
  currentHash: {
    type: String,
    required: true,
    index: true
  },
  blockchainTx: {
    type: String,
    index: true
  },
  blockNumber: {
    type: Number
  },
  gasUsed: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  verified: {
    type: Boolean,
    default: false,
    index: true
  },
  verificationAttempts: {
    type: Number,
    default: 0
  },
  lastVerificationAttempt: {
    type: Date
  },
  verificationError: {
    type: String
  },
  // Metadata
  ipfsHash: {
    type: String // For storing large data on IPFS
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
supplyChainRecordSchema.index({ batchId: 1, timestamp: -1 });
supplyChainRecordSchema.index({ product: 1, recordType: 1 });
supplyChainRecordSchema.index({ verified: 1, recordType: 1 });
supplyChainRecordSchema.index({ blockchainTx: 1 });
supplyChainRecordSchema.index({ currentHash: 1 });

// Virtual for record age
supplyChainRecordSchema.virtual('age_days').get(function() {
  return Math.floor((Date.now() - this.timestamp) / (1000 * 60 * 60 * 24));
});

// Virtual for blockchain confirmation status
supplyChainRecordSchema.virtual('blockchain_confirmed').get(function() {
  return !!(this.blockchainTx && this.blockNumber && this.verified);
});

// Method to verify record against blockchain
supplyChainRecordSchema.methods.verifyAgainstBlockchain = async function(blockchainService) {
  try {
    this.verificationAttempts += 1;
    this.lastVerificationAttempt = new Date();

    if (!blockchainService.contract) {
      this.verificationError = 'No blockchain contract available';
      await this.save();
      return false;
    }

    // Query blockchain for this record
    const blockchainData = await blockchainService.contract.methods.getRecord(this.currentHash).call();

    if (blockchainData.exists && blockchainData.hash === this.currentHash) {
      this.verified = true;
      this.blockNumber = parseInt(blockchainData.blockNumber);
      this.verificationError = null;
    } else {
      this.verified = false;
      this.verificationError = 'Record not found on blockchain or hash mismatch';
    }

    await this.save();
    return this.verified;

  } catch (error) {
    this.verificationError = error.message;
    await this.save();
    return false;
  }
};

// Method to calculate record hash
supplyChainRecordSchema.methods.calculateHash = function() {
  const crypto = require('crypto');
  const data = {
    batchId: this.batchId,
    recordType: this.recordType,
    data: JSON.stringify(this.data, Object.keys(this.data).sort()),
    previousHash: this.previousHash,
    timestamp: this.timestamp.toISOString()
  };

  return crypto.createHash('sha256')
    .update(JSON.stringify(data, Object.keys(data).sort()))
    .digest('hex');
};

// Static method to get batch chain
supplyChainRecordSchema.statics.getBatchChain = async function(batchId) {
  return this.find({ batchId })
    .sort({ timestamp: 1 })
    .populate('product', 'name category');
};

// Static method to verify batch integrity
supplyChainRecordSchema.statics.verifyBatchIntegrity = async function(batchId) {
  const records = await this.getBatchChain(batchId);

  if (records.length === 0) return false;
  if (records.length === 1) return records[0].previousHash === null;

  for (let i = 1; i < records.length; i++) {
    if (records[i].previousHash !== records[i - 1].currentHash) {
      return false;
    }
  }

  return true;
};

// Static method to get batch analytics
supplyChainRecordSchema.statics.getBatchAnalytics = async function(batchId) {
  const records = await this.find({ batchId });

  const analytics = {
    batch_id: batchId,
    total_records: records.length,
    record_types: {},
    verified_records: 0,
    blockchain_tx_count: 0,
    date_range: {
      earliest: null,
      latest: null
    },
    actors_involved: new Set()
  };

  records.forEach(record => {
    // Count record types
    analytics.record_types[record.recordType] =
      (analytics.record_types[record.recordType] || 0) + 1;

    // Count verified records
    if (record.verified) analytics.verified_records++;

    // Count blockchain transactions
    if (record.blockchainTx) analytics.blockchain_tx_count++;

    // Track date range
    const recordDate = new Date(record.timestamp);
    if (!analytics.date_range.earliest || recordDate < analytics.date_range.earliest) {
      analytics.date_range.earliest = recordDate;
    }
    if (!analytics.date_range.latest || recordDate > analytics.date_range.latest) {
      analytics.date_range.latest = recordDate;
    }

    // Track actors
    if (record.data && record.data.actorId) {
      analytics.actors_involved.add(record.data.actorId);
    }
    if (record.data && record.data.farmerId) {
      analytics.actors_involved.add(record.data.farmerId);
    }
  });

  analytics.actors_involved = Array.from(analytics.actors_involved);
  analytics.integrity_verified = await this.verifyBatchIntegrity(batchId);

  return analytics;
};

// Blockchain transaction log schema
const blockchainTransactionSchema = new mongoose.Schema({
  transactionHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  batchId: {
    type: String,
    index: true
  },
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupplyChainRecord'
  },
  action: {
    type: String,
    enum: ['batch_creation', 'event_addition', 'ownership_transfer', 'verification'],
    required: true
  },
  network: {
    type: String,
    enum: ['polygon', 'ethereum', 'bsc', 'polygon_testnet', 'ethereum_testnet'],
    default: 'polygon'
  },
  blockNumber: {
    type: Number,
    required: true,
    index: true
  },
  gasUsed: {
    type: Number,
    required: true
  },
  gasPrice: {
    type: String,
    required: true
  },
  transactionFee: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending',
    index: true
  },
  confirmations: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Transaction details
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  value: {
    type: String,
    default: '0'
  },
  data: {
    type: String
  },
  logs: [{
    address: String,
    topics: [String],
    data: String,
    logIndex: Number,
    transactionIndex: Number,
    transactionHash: String,
    blockHash: String,
    blockNumber: String
  }],
  // Error handling
  error: String,
  retryCount: {
    type: Number,
    default: 0
  },
  lastRetry: Date
}, {
  timestamps: true
});

// Indexes for transaction logs
blockchainTransactionSchema.index({ batchId: 1, timestamp: -1 });
blockchainTransactionSchema.index({ status: 1, createdAt: -1 });
blockchainTransactionSchema.index({ blockNumber: -1 });

// Method to check confirmations
blockchainTransactionSchema.methods.updateConfirmations = async function(currentBlockNumber) {
  if (currentBlockNumber > this.blockNumber) {
    this.confirmations = currentBlockNumber - this.blockNumber;
    if (this.confirmations >= 12) { // Consider confirmed after 12 blocks
      this.status = 'confirmed';
    }
    await this.save();
  }
  return this.confirmations;
};

// QR code tracking schema
const qrCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  batchId: {
    type: String,
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  qrData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  format: {
    type: String,
    enum: ['json', 'url'],
    default: 'json'
  },
  size: {
    type: String,
    default: '256x256'
  },
  errorCorrection: {
    type: String,
    enum: ['L', 'M', 'Q', 'H'],
    default: 'M'
  },
  // Tracking
  scanCount: {
    type: Number,
    default: 0
  },
  lastScanned: Date,
  scans: [{
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    ipAddress: String,
    userAgent: String,
    location: {
      latitude: Number,
      longitude: Number,
      country: String,
      city: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    verificationResult: {
      authentic: Boolean,
      checked_at: Date,
      blockchain_verified: Boolean
    }
  }],
  // Status
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  expiresAt: Date,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for QR codes
qrCodeSchema.index({ batchId: 1, active: 1 });
qrCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to record scan
qrCodeSchema.methods.recordScan = async function(scanData = {}) {
  this.scanCount += 1;
  this.lastScanned = new Date();

  this.scans.push({
    scannedBy: scanData.userId,
    ipAddress: scanData.ipAddress,
    userAgent: scanData.userAgent,
    location: scanData.location,
    verificationResult: scanData.verificationResult
  });

  // Limit scans array to last 100 entries
  if (this.scans.length > 100) {
    this.scans = this.scans.slice(-100);
  }

  await this.save();
  return this.scanCount;
};

// Static method to generate QR code
qrCodeSchema.statics.generateCode = function() {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('hex').toUpperCase();
};

// Models
const SupplyChainRecord = mongoose.model('SupplyChainRecord', supplyChainRecordSchema);
const BlockchainTransaction = mongoose.model('BlockchainTransaction', blockchainTransactionSchema);
const QRCode = mongoose.model('QRCode', qrCodeSchema);

module.exports = {
  SupplyChainRecord,
  BlockchainTransaction,
  QRCode
};
