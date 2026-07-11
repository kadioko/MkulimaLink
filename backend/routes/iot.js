/**
 * IoT Routes
 * Handles IoT device management and sensor data
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const iotService = require('../services/iotService');
const { IoTDevice, SensorData, DeviceAlert } = require('../models/IoT');

// Public routes for device data ingestion
router.post('/data', async (req, res) => {
  try {
    const { device_id, api_key, sensor_data } = req.body;

    // Verify device and API key
    const device = await IoTDevice.findOne({ device_id, api_key });
    if (!device) {
      return res.status(401).json({
        success: false,
        message: 'Invalid device or API key'
      });
    }

    const data = await iotService.processSensorData(device_id, sensor_data);

    res.json({
      success: true,
      message: 'Sensor data received',
      data
    });
  } catch (error) {
    console.error('Process sensor data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process sensor data',
      error: error.message
    });
  }
});

// Protected routes
router.use(protect);

// Device Management
router.post('/devices', async (req, res) => {
  try {
    const device = await iotService.registerDevice(req.user._id, req.body);

    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      data: device
    });
  } catch (error) {
    console.error('Register device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device',
      error: error.message
    });
  }
});

router.get('/devices', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await iotService.getUserDevices(req.user._id, page, limit);

    res.json({
      success: true,
      data: result
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

router.get('/devices/:deviceId', async (req, res) => {
  try {
    const device = await iotService.getDeviceDetails(req.params.deviceId);

    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error('Get device details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device details',
      error: error.message
    });
  }
});

// Sensor Data
router.get('/devices/:deviceId/data', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const sensorType = req.query.sensor_type;

    const result = await iotService.getSensorData(req.params.deviceId, sensorType, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get sensor data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor data',
      error: error.message
    });
  }
});

// Device Alerts
router.get('/devices/:deviceId/alerts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await iotService.getDeviceAlerts(req.params.deviceId, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get device alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device alerts',
      error: error.message
    });
  }
});

router.post('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const alert = await iotService.acknowledgeAlert(req.params.alertId);

    res.json({
      success: true,
      message: 'Alert acknowledged',
      data: alert
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert',
      error: error.message
    });
  }
});

router.post('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const alert = await iotService.resolveAlert(req.params.alertId);

    res.json({
      success: true,
      message: 'Alert resolved',
      data: alert
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
      error: error.message
    });
  }
});

// IoT Analytics
router.get('/devices/:deviceId/analytics', async (req, res) => {
  try {
    const period = req.query.period || '24h';
    const analytics = await iotService.getIoTAnalytics(req.params.deviceId, period);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get IoT analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch IoT analytics',
      error: error.message
    });
  }
});

// Device Types and Protocols
router.get('/device-types', async (req, res) => {
  try {
    const types = iotService.getDeviceTypes();
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Get device types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device types',
      error: error.message
    });
  }
});

router.get('/protocols', async (req, res) => {
  try {
    const protocols = iotService.getSupportedProtocols();
    res.json({
      success: true,
      data: protocols
    });
  } catch (error) {
    console.error('Get protocols error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch protocols',
      error: error.message
    });
  }
});

module.exports = router;



