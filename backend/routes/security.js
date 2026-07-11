/**
 * Security Routes
 * Handles zero-trust access, fraud detection, compliance, and audit logging
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const securityService = require('../services/securityService');
const { SecurityEvent, FraudAlert, ComplianceRecord, TwoFactorAuth, DeviceTrust, AuditLog } = require('../models/Security');

// Protected routes - authentication required
router.use(protect);

// Zero-Trust Access
router.post('/verify-access', async (req, res) => {
  try {
    const { resource, action, context } = req.body;

    const result = await securityService.verifyZeroTrustAccess(
      req.user._id,
      resource,
      action,
      context
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Verify access error:', error);
    res.status(500).json({
      success: false,
      message: 'Access verification failed',
      error: error.message
    });
  }
});

// Fraud Detection
router.post('/detect-fraud', async (req, res) => {
  try {
    const transactionData = req.body;

    const result = await securityService.detectFraud(req.user._id, transactionData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Fraud detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Fraud detection failed',
      error: error.message
    });
  }
});

// Compliance Check
router.post('/check-compliance', async (req, res) => {
  try {
    const { action, data } = req.body;

    const result = await securityService.checkCompliance(req.user._id, action, data);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Compliance check error:', error);
    res.status(500).json({
      success: false,
      message: 'Compliance check failed',
      error: error.message
    });
  }
});

// Encrypt Data
router.post('/encrypt', async (req, res) => {
  try {
    const { data, dataType } = req.body;

    const encrypted = await securityService.encryptSensitiveData(data, dataType);

    res.json({
      success: true,
      data: encrypted
    });
  } catch (error) {
    console.error('Encryption error:', error);
    res.status(500).json({
      success: false,
      message: 'Encryption failed',
      error: error.message
    });
  }
});

// Decrypt Data
router.post('/decrypt', async (req, res) => {
  try {
    const { encryptedData, dataType } = req.body;

    const decrypted = await securityService.decryptSensitiveData(encryptedData, dataType);

    res.json({
      success: true,
      data: decrypted
    });
  } catch (error) {
    console.error('Decryption error:', error);
    res.status(500).json({
      success: false,
      message: 'Decryption failed',
      error: error.message
    });
  }
});

// Get Audit Trail
router.get('/audit-trail', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const events = await securityService.getAuditTrail(req.user._id, days);

    res.json({
      success: true,
      data: {
        events,
        period: `${days} days`,
        total: events.length
      }
    });
  } catch (error) {
    console.error('Get audit trail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit trail',
      error: error.message
    });
  }
});

// Get Security Report
router.get('/security-report', async (req, res) => {
  try {
    const report = await securityService.generateSecurityReport(req.user._id);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Generate security report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate security report',
      error: error.message
    });
  }
});

// Two-Factor Authentication
router.post('/2fa/enable', async (req, res) => {
  try {
    const { method } = req.body;

    let twoFactor = await TwoFactorAuth.findOne({ user_id: req.user._id });

    if (!twoFactor) {
      twoFactor = new TwoFactorAuth({
        user_id: req.user._id,
        method: method || 'sms'
      });
    } else {
      twoFactor.method = method || twoFactor.method;
    }

    await twoFactor.save();

    res.json({
      success: true,
      message: '2FA enabled',
      data: {
        method: twoFactor.method,
        enabled: true
      }
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable 2FA',
      error: error.message
    });
  }
});

router.post('/2fa/disable', async (req, res) => {
  try {
    const twoFactor = await TwoFactorAuth.findOne({ user_id: req.user._id });

    if (!twoFactor) {
      return res.status(404).json({
        success: false,
        message: '2FA not enabled'
      });
    }

    twoFactor.enabled = false;
    await twoFactor.save();

    res.json({
      success: true,
      message: '2FA disabled'
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA',
      error: error.message
    });
  }
});

// Device Management
router.post('/devices/trust', async (req, res) => {
  try {
    const { deviceId, deviceName, deviceType } = req.body;

    let device = await DeviceTrust.findOne({ device_id: deviceId });

    if (!device) {
      device = new DeviceTrust({
        user_id: req.user._id,
        device_id: deviceId,
        device_name: deviceName,
        device_type: deviceType,
        trusted: true
      });
    } else {
      device.trusted = true;
      device.last_used = new Date();
    }

    await device.save();

    res.json({
      success: true,
      message: 'Device trusted',
      data: device
    });
  } catch (error) {
    console.error('Trust device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trust device',
      error: error.message
    });
  }
});

router.get('/devices', async (req, res) => {
  try {
    const devices = await DeviceTrust.find({ user_id: req.user._id });

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch devices',
      error: error.message
    });
  }
});

router.post('/devices/:deviceId/remove', async (req, res) => {
  try {
    const device = await DeviceTrust.findOneAndDelete({
      device_id: req.params.deviceId,
      user_id: req.user._id
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.json({
      success: true,
      message: 'Device removed'
    });
  } catch (error) {
    console.error('Remove device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove device',
      error: error.message
    });
  }
});

// Admin routes
router.use('/admin', protect);

router.get('/admin/fraud-alerts', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const alerts = await FraudAlert.find()
      .populate('user_id', 'name email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FraudAlert.countDocuments();

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get fraud alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fraud alerts',
      error: error.message
    });
  }
});

router.post('/admin/fraud-alerts/:alertId/review', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { status, notes } = req.body;

    const alert = await FraudAlert.findByIdAndUpdate(
      req.params.alertId,
      {
        status,
        review_notes: notes,
        reviewed_by: req.user._id,
        reviewed_at: new Date()
      },
      { returnDocument: 'after' }
    );

    res.json({
      success: true,
      message: 'Fraud alert reviewed',
      data: alert
    });
  } catch (error) {
    console.error('Review fraud alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review fraud alert',
      error: error.message
    });
  }
});

router.get('/admin/security-events', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const events = await SecurityEvent.find()
      .populate('user_id', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SecurityEvent.countDocuments();

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get security events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security events',
      error: error.message
    });
  }
});

router.get('/admin/compliance-records', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const records = await ComplianceRecord.find()
      .populate('user_id', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ComplianceRecord.countDocuments();
    const nonCompliant = await ComplianceRecord.countDocuments({ compliant: false });

    res.json({
      success: true,
      data: {
        records,
        total,
        non_compliant: nonCompliant,
        compliance_rate: ((total - nonCompliant) / total * 100).toFixed(2),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get compliance records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compliance records',
      error: error.message
    });
  }
});

module.exports = router;



