/**
 * Farm Analytics Routes
 * Handles farm analytics, GPS mapping, satellite monitoring, and predictive forecasting
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const farmAnalyticsService = require('../services/farmAnalyticsService');
const { FarmAnalytics, AnalyticsAlert, MarketTrends, PerformanceReport } = require('../models/Analytics');

// Apply authentication middleware
router.use(protect);

// Get or create farm analytics
router.post('/farm/initialize/:farmId', async (req, res) => {
  try {
    const farmData = req.body;
    const analytics = await farmAnalyticsService.getOrCreateFarmAnalytics(
      req.user._id,
      { farm_id: req.params.farmId, ...farmData }
    );

    res.status(201).json({
      success: true,
      message: 'Farm analytics initialized',
      data: analytics
    });
  } catch (error) {
    console.error('Initialize farm analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize farm analytics',
      error: error.message
    });
  }
});

// Get farm analytics dashboard
router.get('/farm/:farmId/dashboard', async (req, res) => {
  try {
    const dashboard = await farmAnalyticsService.getFarmDashboard(req.user._id, req.params.farmId);

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Get farm dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch farm dashboard',
      error: error.message
    });
  }
});

// Update farm metrics
router.put('/farm/:farmId/metrics', async (req, res) => {
  try {
    const metricsData = req.body;
    const analytics = await farmAnalyticsService.updateFarmMetrics(
      req.user._id,
      req.params.farmId,
      metricsData
    );

    res.json({
      success: true,
      message: 'Farm metrics updated',
      data: analytics
    });
  } catch (error) {
    console.error('Update farm metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update farm metrics',
      error: error.message
    });
  }
});

// Update GPS data
router.put('/farm/:farmId/gps', async (req, res) => {
  try {
    const gpsData = req.body;
    const analytics = await farmAnalyticsService.updateGPSData(
      req.user._id,
      req.params.farmId,
      gpsData
    );

    res.json({
      success: true,
      message: 'GPS data updated',
      data: analytics.gps_data
    });
  } catch (error) {
    console.error('Update GPS data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update GPS data',
      error: error.message
    });
  }
});

// Update satellite data
router.post('/farm/:farmId/satellite/update', async (req, res) => {
  try {
    const analytics = await farmAnalyticsService.updateSatelliteData(
      req.user._id,
      req.params.farmId
    );

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found or GPS data missing'
      });
    }

    res.json({
      success: true,
      message: 'Satellite data updated',
      data: analytics.satellite_data
    });
  } catch (error) {
    console.error('Update satellite data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update satellite data',
      error: error.message
    });
  }
});

// Get yield predictions
router.get('/farm/:farmId/predictions/yield', async (req, res) => {
  try {
    const predictions = await farmAnalyticsService.getYieldPredictions(
      req.user._id,
      req.params.farmId
    );

    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Get yield predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yield predictions',
      error: error.message
    });
  }
});

// Get price forecasts
router.get('/market/forecast/:region/:crop', async (req, res) => {
  try {
    const forecast = await farmAnalyticsService.getPriceForecast(
      req.params.region,
      req.params.crop
    );

    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    console.error('Get price forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price forecast',
      error: error.message
    });
  }
});

// Get market trends
router.get('/market/trends/:region/:crop', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const trends = await farmAnalyticsService.getMarketTrends(
      req.params.region,
      req.params.crop,
      days
    );

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Get market trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market trends',
      error: error.message
    });
  }
});

// Get benchmarking
router.get('/farm/:farmId/benchmarking', async (req, res) => {
  try {
    const benchmarking = await farmAnalyticsService.getBenchmarking(
      req.user._id,
      req.params.farmId
    );

    res.json({
      success: true,
      data: benchmarking
    });
  } catch (error) {
    console.error('Get benchmarking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch benchmarking data',
      error: error.message
    });
  }
});

// Get user's farms
router.get('/farms', async (req, res) => {
  try {
    const farms = await FarmAnalytics.getUserFarms(req.user._id);

    res.json({
      success: true,
      data: farms.map(f => f.getSummary())
    });
  } catch (error) {
    console.error('Get user farms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch farms',
      error: error.message
    });
  }
});

// Get alerts
router.get('/alerts', async (req, res) => {
  try {
    const status = req.query.status || 'active';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const alerts = await AnalyticsAlert.find({
      user_id: req.user._id,
      status
    })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

    const total = await AnalyticsAlert.countDocuments({
      user_id: req.user._id,
      status
    });

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
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
});

// Acknowledge alert
router.put('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const alert = await AnalyticsAlert.findOne({
      _id: req.params.alertId,
      user_id: req.user._id
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    await alert.acknowledge();

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

// Resolve alert
router.put('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const alert = await AnalyticsAlert.findOne({
      _id: req.params.alertId,
      user_id: req.user._id
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    await alert.resolve();

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

// Generate performance report
router.post('/reports/generate', async (req, res) => {
  try {
    const { farm_id, period, start_date, end_date } = req.body;

    const report = new PerformanceReport({
      user_id: req.user._id,
      farm_id,
      period,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      metrics: req.body.metrics,
      comparisons: req.body.comparisons,
      recommendations: req.body.recommendations
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: 'Performance report generated',
      data: report
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
});

// Get performance reports
router.get('/reports', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const reports = await PerformanceReport.find({
      user_id: req.user._id
    })
    .sort({ generated_at: -1 })
    .skip(skip)
    .limit(limit);

    const total = await PerformanceReport.countDocuments({
      user_id: req.user._id
    });

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
});

// Export data
router.get('/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const farmId = req.query.farm_id;

    if (!['csv', 'json', 'pdf'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid export format'
      });
    }

    const analytics = await FarmAnalytics.findOne({
      user_id: req.user._id,
      farm_id: farmId
    });

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    // Format data based on export type
    let exportData = analytics.toObject();

    if (format === 'csv') {
      // Convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="farm-analytics.csv"');
      res.send(convertToCSV(exportData));
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="farm-analytics.json"');
      res.json(exportData);
    } else if (format === 'pdf') {
      // PDF generation would require additional library
      res.status(501).json({
        success: false,
        message: 'PDF export coming soon'
      });
    }
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error.message
    });
  }
});

// Helper function to convert to CSV
function convertToCSV(data) {
  const headers = Object.keys(data.metrics);
  const values = Object.values(data.metrics);
  return `${headers.join(',')}\n${values.join(',')}`;
}

module.exports = router;



