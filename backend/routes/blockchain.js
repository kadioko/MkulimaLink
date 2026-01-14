/**
 * Blockchain Routes
 * Handles blockchain-based supply chain tracking operations
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const blockchainSupplyChainService = require('../services/blockchainSupplyChainService');
const { SupplyChainRecord, QRCode } = require('../models/Blockchain');
const { Product } = require('../models/Product');

// Apply authentication middleware
router.use(protect);

// Create product batch on blockchain
router.post('/batch/create/:productId', async (req, res) => {
  try {
    // Verify product ownership
    const product = await Product.findOne({
      _id: req.params.productId,
      seller: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you are not the owner'
      });
    }

    const batchData = req.body;
    const result = await blockchainSupplyChainService.createProductBatch(
      req.params.productId,
      batchData
    );

    res.status(201).json({
      success: true,
      message: 'Product batch created on blockchain',
      data: result
    });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product batch',
      error: error.message
    });
  }
});

// Add supply chain event
router.post('/event/add/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const eventData = req.body;

    // Verify user has permission to add events for this batch
    const record = await SupplyChainRecord.findOne({ batchId });
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check if user is involved in this supply chain
    const product = await Product.findById(record.product);
    if (!product || (product.seller.toString() !== req.user._id.toString() &&
                     eventData.actor_id !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add events to this batch'
      });
    }

    const result = await blockchainSupplyChainService.addSupplyChainEvent(batchId, eventData);

    res.json({
      success: true,
      message: 'Supply chain event added to blockchain',
      data: result
    });
  } catch (error) {
    console.error('Add event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add supply chain event',
      error: error.message
    });
  }
});

// Transfer ownership
router.post('/transfer/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const transferData = req.body;

    // Verify current ownership
    const latestRecord = await SupplyChainRecord.findOne({ batchId })
      .sort({ timestamp: -1 });

    if (!latestRecord) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check if user is the current owner
    const product = await Product.findById(latestRecord.product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // For now, allow any authenticated user to transfer (in production, add ownership verification)
    transferData.previous_owner = req.user._id.toString();

    const result = await blockchainSupplyChainService.transferOwnership(batchId, transferData);

    res.json({
      success: true,
      message: 'Ownership transferred on blockchain',
      data: result
    });
  } catch (error) {
    console.error('Transfer ownership error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer ownership',
      error: error.message
    });
  }
});

// Get supply chain history
router.get('/history/:batchId', async (req, res) => {
  try {
    const result = await blockchainSupplyChainService.getSupplyChainHistory(req.params.batchId);

    if (!result.batch_found) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supply chain history',
      error: error.message
    });
  }
});

// Verify product authenticity
router.get('/verify/:batchId', async (req, res) => {
  try {
    const result = await blockchainSupplyChainService.verifyProductAuthenticity(req.params.batchId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Verify authenticity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify product authenticity',
      error: error.message
    });
  }
});

// Generate QR code for tracking
router.post('/qr/generate/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const productData = req.body;

    // Verify batch exists and user has access
    const record = await SupplyChainRecord.findOne({ batchId });
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const product = await Product.findById(record.product);
    if (!product || product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to generate QR codes for this batch'
      });
    }

    const result = await blockchainSupplyChainService.generateTrackingQR(batchId, productData);

    res.json({
      success: true,
      message: 'QR code generated for product tracking',
      data: result
    });
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: error.message
    });
  }
});

// Record QR code scan
router.post('/qr/scan/:code', async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({ code: req.params.code, active: true });

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found or inactive'
      });
    }

    const scanData = {
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      location: req.body.location,
      verificationResult: req.body.verification_result
    };

    const scanCount = await qrCode.recordScan(scanData);

    res.json({
      success: true,
      message: 'QR code scan recorded',
      data: {
        batch_id: qrCode.batchId,
        scan_count: scanCount,
        product_info: qrCode.qrData.product_info
      }
    });
  } catch (error) {
    console.error('Record QR scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record QR scan',
      error: error.message
    });
  }
});

// Get QR code analytics
router.get('/qr/analytics/:code', async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({ code: req.params.code });

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      });
    }

    // Check if user has access (owner or admin)
    if (qrCode.generatedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this QR code analytics'
      });
    }

    res.json({
      success: true,
      data: {
        code: qrCode.code,
        batch_id: qrCode.batchId,
        scan_count: qrCode.scanCount,
        last_scanned: qrCode.lastScanned,
        active: qrCode.active,
        generated_at: qrCode.createdAt,
        recent_scans: qrCode.scans.slice(-10).reverse() // Last 10 scans
      }
    });
  } catch (error) {
    console.error('Get QR analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get QR analytics',
      error: error.message
    });
  }
});

// Get supply chain analytics
router.get('/analytics', async (req, res) => {
  try {
    const { time_range } = req.query;
    const analytics = await blockchainSupplyChainService.getSupplyChainAnalytics(time_range);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supply chain analytics',
      error: error.message
    });
  }
});

// Get batch analytics
router.get('/batch/analytics/:batchId', async (req, res) => {
  try {
    const analytics = await SupplyChainRecord.getBatchAnalytics(req.params.batchId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get batch analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get batch analytics',
      error: error.message
    });
  }
});

// Admin routes
router.use('/admin', protect);

// Get all supply chain records (admin)
router.get('/admin/records', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const recordType = req.query.record_type;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) filter.verified = status === 'verified';
    if (recordType) filter.recordType = recordType;

    const records = await SupplyChainRecord.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name category');

    const total = await SupplyChainRecord.countDocuments(filter);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supply chain records',
      error: error.message
    });
  }
});

// Verify record against blockchain (admin)
router.post('/admin/verify/:recordId', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const record = await SupplyChainRecord.findById(req.params.recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    const verified = await record.verifyAgainstBlockchain(blockchainSupplyChainService);

    res.json({
      success: true,
      message: `Record ${verified ? 'verified' : 'verification failed'}`,
      data: {
        record_id: record._id,
        verified,
        verification_attempts: record.verificationAttempts,
        error: record.verificationError
      }
    });
  } catch (error) {
    console.error('Admin verify record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify record',
      error: error.message
    });
  }
});

// Bulk verify records (admin)
router.post('/admin/bulk-verify', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { recordIds } = req.body;

    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Record IDs array is required'
      });
    }

    const results = [];
    for (const recordId of recordIds) {
      try {
        const record = await SupplyChainRecord.findById(recordId);
        if (record) {
          const verified = await record.verifyAgainstBlockchain(blockchainSupplyChainService);
          results.push({
            record_id: recordId,
            verified,
            error: record.verificationError
          });
        }
      } catch (error) {
        results.push({
          record_id: recordId,
          verified: false,
          error: error.message
        });
      }
    }

    const verifiedCount = results.filter(r => r.verified).length;

    res.json({
      success: true,
      message: `Verified ${verifiedCount} out of ${results.length} records`,
      data: {
        total_processed: results.length,
        verified_count: verifiedCount,
        failed_count: results.length - verifiedCount,
        results
      }
    });
  } catch (error) {
    console.error('Bulk verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk verify records',
      error: error.message
    });
  }
});

// Get blockchain network status
router.get('/network/status', async (req, res) => {
  try {
    const status = {
      network: blockchainSupplyChainService.network,
      contract_address: blockchainSupplyChainService.contractAddress,
      web3_connected: !!blockchainSupplyChainService.web3,
      contract_available: !!blockchainSupplyChainService.contract,
      admin_address: blockchainSupplyChainService.adminAddress ? 'configured' : 'not configured',
      gas_price: blockchainSupplyChainService.gasPrice,
      last_updated: new Date().toISOString()
    };

    // Try to get network info
    try {
      if (blockchainSupplyChainService.web3) {
        const networkId = await blockchainSupplyChainService.web3.eth.net.getId();
        const blockNumber = await blockchainSupplyChainService.web3.eth.getBlockNumber();

        status.network_id = networkId;
        status.latest_block = blockNumber;
        status.network_connected = true;
      }
    } catch (networkError) {
      status.network_connected = false;
      status.network_error = networkError.message;
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get network status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get network status',
      error: error.message
    });
  }
});

module.exports = router;
