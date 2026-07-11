/**
 * Global Expansion Routes
 * Handles multi-region infrastructure, currencies, and partnerships
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const globalExpansionService = require('../services/globalExpansionService');
const { GlobalRegion, RegionalMetrics, CurrencyRate, PartnershipAgreement, RegionalCompliance } = require('../models/GlobalExpansion');

// Public routes
router.get('/regions', async (req, res) => {
  try {
    const regions = globalExpansionService.getSupportedRegions();
    res.json({
      success: true,
      data: regions
    });
  } catch (error) {
    console.error('Get regions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch regions',
      error: error.message
    });
  }
});

router.get('/languages', async (req, res) => {
  try {
    const languages = globalExpansionService.getLanguages();
    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch languages',
      error: error.message
    });
  }
});

router.get('/currency-rates', async (req, res) => {
  try {
    const rates = await CurrencyRate.find();
    res.json({
      success: true,
      data: rates
    });
  } catch (error) {
    console.error('Get currency rates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currency rates',
      error: error.message
    });
  }
});

router.get('/regions/:regionCode', async (req, res) => {
  try {
    const regionDetails = await globalExpansionService.getRegionDetails(req.params.regionCode);
    res.json({
      success: true,
      data: regionDetails
    });
  } catch (error) {
    console.error('Get region details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch region details',
      error: error.message
    });
  }
});

router.get('/global-metrics', async (req, res) => {
  try {
    const metrics = await globalExpansionService.getGlobalMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get global metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch global metrics',
      error: error.message
    });
  }
});

router.get('/expansion-roadmap', async (req, res) => {
  try {
    const roadmap = globalExpansionService.getExpansionRoadmap();
    res.json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    console.error('Get expansion roadmap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expansion roadmap',
      error: error.message
    });
  }
});

// Protected routes
router.use(protect);

router.post('/convert-currency', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    const converted = await globalExpansionService.convertCurrency(
      amount,
      fromCurrency,
      toCurrency
    );

    res.json({
      success: true,
      data: {
        original_amount: amount,
        original_currency: fromCurrency,
        converted_amount: converted,
        target_currency: toCurrency
      }
    });
  } catch (error) {
    console.error('Convert currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert currency',
      error: error.message
    });
  }
});

router.get('/payment-methods/:regionCode', async (req, res) => {
  try {
    const methods = globalExpansionService.getPaymentMethodsByRegion(req.params.regionCode);
    res.json({
      success: true,
      data: methods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods',
      error: error.message
    });
  }
});

router.get('/partnerships/:regionCode', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await globalExpansionService.getPartnershipsByRegion(
      req.params.regionCode,
      page,
      limit
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get partnerships error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch partnerships',
      error: error.message
    });
  }
});

// Admin routes
router.use('/admin', protect);

router.post('/admin/regions', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const region = await globalExpansionService.addRegion(req.body);

    res.status(201).json({
      success: true,
      message: 'Region added successfully',
      data: region
    });
  } catch (error) {
    console.error('Add region error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add region',
      error: error.message
    });
  }
});

router.post('/admin/currency-rates', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const result = await globalExpansionService.updateCurrencyRates(req.body);

    res.json({
      success: true,
      message: 'Currency rates updated',
      data: result
    });
  } catch (error) {
    console.error('Update currency rates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update currency rates',
      error: error.message
    });
  }
});

router.post('/admin/partnerships', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const agreement = await globalExpansionService.createPartnershipAgreement(req.body);

    res.status(201).json({
      success: true,
      message: 'Partnership agreement created',
      data: agreement
    });
  } catch (error) {
    console.error('Create partnership error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create partnership',
      error: error.message
    });
  }
});

router.get('/admin/compliance/:regionCode', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const compliance = await RegionalCompliance.find({ region_code: req.params.regionCode });

    res.json({
      success: true,
      data: compliance
    });
  } catch (error) {
    console.error('Get compliance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compliance records',
      error: error.message
    });
  }
});

module.exports = router;



