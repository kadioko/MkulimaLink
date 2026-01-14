/**
 * MkulimaLink Blockchain Supply Chain Tracking Service
 * Provides immutable, transparent tracking of agricultural products through the supply chain
 */

const Web3 = require('web3');
const crypto = require('crypto');
const { Product, Transaction } = require('../models');
const { SupplyChainRecord } = require('../models/Blockchain');

class BlockchainSupplyChainService {
  constructor() {
    // Blockchain configuration
    this.network = process.env.BLOCKCHAIN_NETWORK || 'polygon'; // polygon, ethereum, bsc
    this.rpcUrl = this.getRPCUrl();
    this.web3 = new Web3(this.rpcUrl);

    // Contract configuration
    this.contractAddress = process.env.SUPPLY_CHAIN_CONTRACT_ADDRESS;
    this.contractABI = require('../contracts/SupplyChain.json').abi;

    // Initialize contract
    this.contract = null;
    if (this.contractAddress) {
      this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
    }

    // Wallet for transactions
    this.adminPrivateKey = process.env.BLOCKCHAIN_ADMIN_PRIVATE_KEY;
    this.adminAddress = this.adminPrivateKey ? this.web3.eth.accounts.privateKeyToAccount(this.adminPrivateKey).address : null;

    this.gasPrice = this.web3.utils.toWei('20', 'gwei');
    this.gasLimit = 300000;
  }

  /**
   * Get RPC URL based on network
   */
  getRPCUrl() {
    const networks = {
      polygon: process.env.POLYGON_RPC_URL || 'https://rpc-mainnet.maticvigil.com',
      ethereum: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
      bsc: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/',
      polygon_testnet: 'https://rpc-mumbai.maticvigil.com',
      ethereum_testnet: 'https://goerli.infura.io/v3/YOUR_INFURA_KEY'
    };

    return networks[this.network] || networks.polygon_testnet;
  }

  /**
   * Create a new product batch in the blockchain
   */
  async createProductBatch(productId, batchData) {
    try {
      const product = await Product.findById(productId).populate('seller');

      if (!product) {
        throw new Error('Product not found');
      }

      // Generate batch ID and hash
      const batchId = this.generateBatchId();
      const batchHash = this.createBatchHash(batchData);

      // Prepare batch data
      const batchInfo = {
        productId: product._id.toString(),
        farmerId: product.seller._id.toString(),
        productName: product.name,
        category: product.category,
        quantity: batchData.quantity || product.quantity,
        unit: product.unit,
        location: product.location,
        harvestDate: batchData.harvest_date || new Date(),
        expiryDate: batchData.expiry_date,
        qualityGrade: batchData.quality_grade || 'A',
        certifications: batchData.certifications || [],
        metadata: batchData.metadata || {}
      };

      // Create blockchain record
      const record = new SupplyChainRecord({
        batchId,
        product: productId,
        recordType: 'batch_creation',
        data: batchInfo,
        previousHash: null, // First record in chain
        currentHash: batchHash,
        blockchainTx: null, // Will be set after transaction
        timestamp: new Date(),
        verified: false
      });

      await record.save();

      // Submit to blockchain
      try {
        const txHash = await this.submitBatchToBlockchain(batchId, batchInfo);
        record.blockchainTx = txHash;
        record.verified = true;
        await record.save();

        return {
          success: true,
          batch_id: batchId,
          blockchain_tx: txHash,
          message: 'Product batch created and recorded on blockchain'
        };
      } catch (blockchainError) {
        console.warn('Blockchain submission failed, keeping local record:', blockchainError.message);
        return {
          success: true,
          batch_id: batchId,
          blockchain_tx: null,
          message: 'Product batch created locally (blockchain submission pending)'
        };
      }

    } catch (error) {
      console.error('Create product batch error:', error);
      throw error;
    }
  }

  /**
   * Add supply chain event to blockchain
   */
  async addSupplyChainEvent(batchId, eventData) {
    try {
      // Get the latest record for this batch
      const latestRecord = await SupplyChainRecord.findOne({ batchId })
        .sort({ timestamp: -1 });

      if (!latestRecord) {
        throw new Error('Batch not found');
      }

      // Create event hash
      const eventHash = this.createEventHash(eventData);
      const previousHash = latestRecord.currentHash;

      // Prepare event data
      const eventInfo = {
        eventType: eventData.event_type, // 'transport', 'storage', 'processing', 'sale'
        actorId: eventData.actor_id,
        actorType: eventData.actor_type, // 'farmer', 'transporter', 'warehouse', 'processor', 'retailer'
        location: eventData.location,
        timestamp: new Date(),
        temperature: eventData.temperature,
        humidity: eventData.humidity,
        qualityCheck: eventData.quality_check,
        documents: eventData.documents || [],
        notes: eventData.notes,
        metadata: eventData.metadata || {}
      };

      // Create blockchain record
      const record = new SupplyChainRecord({
        batchId,
        product: latestRecord.product,
        recordType: 'supply_chain_event',
        data: eventInfo,
        previousHash,
        currentHash: eventHash,
        blockchainTx: null,
        timestamp: new Date(),
        verified: false
      });

      await record.save();

      // Submit to blockchain
      try {
        const txHash = await this.submitEventToBlockchain(batchId, eventInfo, previousHash);
        record.blockchainTx = txHash;
        record.verified = true;
        await record.save();

        return {
          success: true,
          event_id: record._id,
          blockchain_tx: txHash,
          message: 'Supply chain event recorded on blockchain'
        };
      } catch (blockchainError) {
        console.warn('Blockchain submission failed, keeping local record:', blockchainError.message);
        return {
          success: true,
          event_id: record._id,
          blockchain_tx: null,
          message: 'Supply chain event recorded locally (blockchain submission pending)'
        };
      }

    } catch (error) {
      console.error('Add supply chain event error:', error);
      throw error;
    }
  }

  /**
   * Transfer product ownership in blockchain
   */
  async transferOwnership(batchId, newOwnerId, transferData) {
    try {
      const latestRecord = await SupplyChainRecord.findOne({ batchId })
        .sort({ timestamp: -1 });

      if (!latestRecord) {
        throw new Error('Batch not found');
      }

      // Create transfer hash
      const transferHash = this.createTransferHash(transferData);
      const previousHash = latestRecord.currentHash;

      // Prepare transfer data
      const transferInfo = {
        previousOwner: transferData.previous_owner,
        newOwner: newOwnerId,
        transferType: transferData.transfer_type, // 'sale', 'donation', 'processing'
        price: transferData.price,
        currency: transferData.currency || 'KES',
        quantity: transferData.quantity,
        conditions: transferData.conditions,
        documents: transferData.documents || [],
        timestamp: new Date(),
        metadata: transferData.metadata || {}
      };

      // Create blockchain record
      const record = new SupplyChainRecord({
        batchId,
        product: latestRecord.product,
        recordType: 'ownership_transfer',
        data: transferInfo,
        previousHash,
        currentHash: transferHash,
        blockchainTx: null,
        timestamp: new Date(),
        verified: false
      });

      await record.save();

      // Submit to blockchain
      try {
        const txHash = await this.submitTransferToBlockchain(batchId, transferInfo, previousHash);
        record.blockchainTx = txHash;
        record.verified = true;
        await record.save();

        return {
          success: true,
          transfer_id: record._id,
          blockchain_tx: txHash,
          message: 'Ownership transfer recorded on blockchain'
        };
      } catch (blockchainError) {
        console.warn('Blockchain submission failed, keeping local record:', blockchainError.message);
        return {
          success: true,
          transfer_id: record._id,
          blockchain_tx: null,
          message: 'Ownership transfer recorded locally (blockchain submission pending)'
        };
      }

    } catch (error) {
      console.error('Transfer ownership error:', error);
      throw error;
    }
  }

  /**
   * Get complete supply chain history for a batch
   */
  async getSupplyChainHistory(batchId) {
    try {
      const records = await SupplyChainRecord.find({ batchId })
        .sort({ timestamp: 1 })
        .populate('product', 'name category')
        .populate('data.actorId', 'name') // For events
        .populate('data.newOwner', 'name'); // For transfers

      if (records.length === 0) {
        return { batch_found: false, history: [] };
      }

      // Verify chain integrity
      const chainValid = this.verifyChainIntegrity(records);

      const history = records.map((record, index) => ({
        sequence: index + 1,
        record_type: record.recordType,
        timestamp: record.timestamp,
        data: record.data,
        blockchain_tx: record.blockchainTx,
        verified: record.verified,
        hash: record.currentHash,
        previous_hash: record.previousHash
      }));

      return {
        batch_found: true,
        batch_id: batchId,
        product: records[0].product,
        total_records: records.length,
        chain_integrity_verified: chainValid,
        history
      };

    } catch (error) {
      console.error('Get supply chain history error:', error);
      throw error;
    }
  }

  /**
   * Verify product authenticity using blockchain
   */
  async verifyProductAuthenticity(batchId) {
    try {
      const history = await this.getSupplyChainHistory(batchId);

      if (!history.batch_found) {
        return {
          authentic: false,
          reason: 'Batch not found in blockchain',
          verification_details: null
        };
      }

      // Check chain integrity
      if (!history.chain_integrity_verified) {
        return {
          authentic: false,
          reason: 'Supply chain record integrity compromised',
          verification_details: {
            chain_valid: false,
            total_records: history.total_records
          }
        };
      }

      // Verify against blockchain if available
      if (this.contract) {
        try {
          const blockchainVerification = await this.verifyAgainstBlockchain(batchId);

          if (!blockchainVerification.verified) {
            return {
              authentic: false,
              reason: 'Blockchain verification failed',
              verification_details: blockchainVerification
            };
          }
        } catch (blockchainError) {
          console.warn('Blockchain verification error:', blockchainError.message);
        }
      }

      // Check for suspicious activities
      const suspiciousActivities = this.detectSuspiciousActivities(history.history);

      return {
        authentic: suspiciousActivities.length === 0,
        reason: suspiciousActivities.length > 0 ? 'Suspicious activities detected' : 'Product verified as authentic',
        verification_details: {
          chain_valid: true,
          total_records: history.total_records,
          suspicious_activities: suspiciousActivities,
          last_updated: history.history[history.history.length - 1]?.timestamp
        }
      };

    } catch (error) {
      console.error('Verify product authenticity error:', error);
      throw error;
    }
  }

  /**
   * Generate QR code for product tracking
   */
  async generateTrackingQR(batchId, productData = {}) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify/${batchId}`;

      // Create QR code data
      const qrData = {
        batch_id: batchId,
        verification_url: verificationUrl,
        product_info: {
          name: productData.name,
          category: productData.category,
          origin: productData.location
        },
        blockchain_network: this.network,
        contract_address: this.contractAddress,
        timestamp: new Date().toISOString()
      };

      // In a real implementation, you'd generate an actual QR code image
      // For now, return the data that would be encoded in the QR
      const qrCodeData = {
        data: qrData,
        format: 'json',
        size: '256x256',
        error_correction: 'M'
      };

      return {
        success: true,
        batch_id: batchId,
        qr_code_data: qrCodeData,
        verification_url: verificationUrl,
        message: 'QR code data generated for product tracking'
      };

    } catch (error) {
      console.error('Generate tracking QR error:', error);
      throw error;
    }
  }

  /**
   * Get supply chain analytics
   */
  async getSupplyChainAnalytics(timeRange = '30d') {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange.replace('d', '')));

      const records = await SupplyChainRecord.find({
        timestamp: { $gte: startDate }
      });

      const analytics = {
        total_batches: new Set(records.map(r => r.batchId)).size,
        total_events: records.length,
        events_by_type: {},
        average_chain_length: 0,
        integrity_score: 0,
        time_range: timeRange
      };

      // Calculate events by type
      records.forEach(record => {
        analytics.events_by_type[record.recordType] =
          (analytics.events_by_type[record.recordType] || 0) + 1;
      });

      // Calculate average chain length
      const batchGroups = records.reduce((groups, record) => {
        if (!groups[record.batchId]) groups[record.batchId] = [];
        groups[record.batchId].push(record);
        return groups;
      }, {});

      const chainLengths = Object.values(batchGroups).map(group => group.length);
      analytics.average_chain_length = chainLengths.reduce((sum, len) => sum + len, 0) / chainLengths.length;

      // Calculate integrity score
      const validChains = Object.values(batchGroups).filter(group =>
        this.verifyChainIntegrity(group)
      ).length;
      analytics.integrity_score = (validChains / Object.keys(batchGroups).length) * 100;

      return analytics;

    } catch (error) {
      console.error('Get supply chain analytics error:', error);
      throw error;
    }
  }

  // Helper methods

  generateBatchId() {
    return `BATCH_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  createBatchHash(data) {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  createEventHash(data) {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  createTransferHash(data) {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  async submitBatchToBlockchain(batchId, batchInfo) {
    if (!this.contract || !this.adminPrivateKey) {
      throw new Error('Blockchain integration not configured');
    }

    // Estimate gas
    const gasEstimate = await this.contract.methods.createBatch(
      batchId,
      JSON.stringify(batchInfo)
    ).estimateGas({ from: this.adminAddress });

    // Create transaction
    const tx = {
      from: this.adminAddress,
      to: this.contractAddress,
      gas: Math.min(gasEstimate * 2, this.gasLimit),
      gasPrice: this.gasPrice,
      data: this.contract.methods.createBatch(batchId, JSON.stringify(batchInfo)).encodeABI()
    };

    // Sign and send transaction
    const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.adminPrivateKey);
    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return receipt.transactionHash;
  }

  async submitEventToBlockchain(batchId, eventInfo, previousHash) {
    if (!this.contract || !this.adminPrivateKey) {
      throw new Error('Blockchain integration not configured');
    }

    const gasEstimate = await this.contract.methods.addEvent(
      batchId,
      JSON.stringify(eventInfo),
      previousHash
    ).estimateGas({ from: this.adminAddress });

    const tx = {
      from: this.adminAddress,
      to: this.contractAddress,
      gas: Math.min(gasEstimate * 2, this.gasLimit),
      gasPrice: this.gasPrice,
      data: this.contract.methods.addEvent(batchId, JSON.stringify(eventInfo), previousHash).encodeABI()
    };

    const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.adminPrivateKey);
    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return receipt.transactionHash;
  }

  async submitTransferToBlockchain(batchId, transferInfo, previousHash) {
    if (!this.contract || !this.adminPrivateKey) {
      throw new Error('Blockchain integration not configured');
    }

    const gasEstimate = await this.contract.methods.transferOwnership(
      batchId,
      transferInfo.newOwner,
      JSON.stringify(transferInfo),
      previousHash
    ).estimateGas({ from: this.adminAddress });

    const tx = {
      from: this.adminAddress,
      to: this.contractAddress,
      gas: Math.min(gasEstimate * 2, this.gasLimit),
      gasPrice: this.gasPrice,
      data: this.contract.methods.transferOwnership(
        batchId,
        transferInfo.newOwner,
        JSON.stringify(transferInfo),
        previousHash
      ).encodeABI()
    };

    const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.adminPrivateKey);
    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return receipt.transactionHash;
  }

  verifyChainIntegrity(records) {
    for (let i = 1; i < records.length; i++) {
      if (records[i].previousHash !== records[i - 1].currentHash) {
        return false;
      }
    }
    return true;
  }

  async verifyAgainstBlockchain(batchId) {
    if (!this.contract) {
      return { verified: false, reason: 'No blockchain contract available' };
    }

    try {
      const blockchainData = await this.contract.methods.getBatch(batchId).call();

      // Compare with local data
      const localData = await SupplyChainRecord.findOne({ batchId, recordType: 'batch_creation' });

      if (!localData) {
        return { verified: false, reason: 'Local batch data not found' };
      }

      const blockchainHash = blockchainData.currentHash;
      const localHash = localData.currentHash;

      return {
        verified: blockchainHash === localHash,
        blockchain_hash: blockchainHash,
        local_hash: localHash,
        last_updated: blockchainData.lastUpdated
      };

    } catch (error) {
      return { verified: false, reason: `Blockchain query failed: ${error.message}` };
    }
  }

  detectSuspiciousActivities(history) {
    const suspicious = [];

    // Check for unusual temperature/humidity variations
    const events = history.filter(h => h.record_type === 'supply_chain_event');

    for (const event of events) {
      if (event.data.temperature && (event.data.temperature < -10 || event.data.temperature > 50)) {
        suspicious.push({
          type: 'unusual_temperature',
          event_id: event.sequence,
          value: event.data.temperature,
          threshold: 'Temperature outside normal agricultural range'
        });
      }

      if (event.data.humidity && (event.data.humidity < 10 || event.data.humidity > 95)) {
        suspicious.push({
          type: 'unusual_humidity',
          event_id: event.sequence,
          value: event.data.humidity,
          threshold: 'Humidity outside normal agricultural range'
        });
      }
    }

    // Check for rapid ownership changes
    const transfers = history.filter(h => h.record_type === 'ownership_transfer');
    if (transfers.length > 3) {
      suspicious.push({
        type: 'frequent_ownership_changes',
        count: transfers.length,
        threshold: 'More than 3 ownership transfers detected'
      });
    }

    return suspicious;
  }
}

module.exports = new BlockchainSupplyChainService();
