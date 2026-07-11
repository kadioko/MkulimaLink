/**
 * Localization Routes
 * Handles multi-country configuration, language support, and regional features
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const localizationService = require('../services/localizationService');
const multiCountryPaymentService = require('../services/multiCountryPaymentService');
const { CountryConfig, LocalizedContent, RegionalPrices, UserLocalization, ComplianceLog, RegionalPartner } = require('../models/Localization');

// Public routes - no authentication required
router.get('/countries', async (req, res) => {
  try {
    const countries = localizationService.getSupportedCountries();
    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch countries',
      error: error.message
    });
  }
});

router.get('/languages', async (req, res) => {
  try {
    const languages = localizationService.getSupportedLanguages();
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

router.get('/country/:countryCode', async (req, res) => {
  try {
    const config = await localizationService.getCountryConfig(req.params.countryCode);
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get country config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch country configuration',
      error: error.message
    });
  }
});

router.get('/country/:countryCode/crops', async (req, res) => {
  try {
    const crops = localizationService.getRegionalCrops(req.params.countryCode);
    res.json({
      success: true,
      data: crops
    });
  } catch (error) {
    console.error('Get regional crops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch regional crops',
      error: error.message
    });
  }
});

router.get('/country/:countryCode/payment-methods', async (req, res) => {
  try {
    const methods = await localizationService.getPaymentMethods(req.params.countryCode);
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

router.get('/prices/:region/:crop', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const prices = await localizationService.getRegionalPrices(
      req.params.region,
      req.params.crop,
      days
    );

    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('Get regional prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch regional prices',
      error: error.message
    });
  }
});

router.get('/content/:countryCode/:language/:key', async (req, res) => {
  try {
    const content = await localizationService.getLocalizedContent(
      req.params.countryCode,
      req.params.language,
      req.params.key
    );

    res.json({
      success: true,
      data: { content }
    });
  } catch (error) {
    console.error('Get localized content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch localized content',
      error: error.message
    });
  }
});

router.get('/compliance/:countryCode', async (req, res) => {
  try {
    const requirements = await localizationService.getComplianceRequirements(req.params.countryCode);
    res.json({
      success: true,
      data: requirements
    });
  } catch (error) {
    console.error('Get compliance requirements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compliance requirements',
      error: error.message
    });
  }
});

// Protected routes - authentication required
router.use(protect);

router.post('/preferences', async (req, res) => {
  try {
    const { country_code, language, currency, timezone, date_format, measurement_unit, temperature_unit } = req.body;

    let preferences = await UserLocalization.findOne({ user_id: req.user._id });

    if (!preferences) {
      preferences = new UserLocalization({
        user_id: req.user._id,
        country_code,
        language,
        currency,
        timezone,
        date_format,
        measurement_unit,
        temperature_unit
      });
    } else {
      if (country_code) preferences.country_code = country_code;
      if (language) preferences.language = language;
      if (currency) preferences.currency = currency;
      if (timezone) preferences.timezone = timezone;
      if (date_format) preferences.date_format = date_format;
      if (measurement_unit) preferences.measurement_unit = measurement_unit;
      if (temperature_unit) preferences.temperature_unit = temperature_unit;
    }

    await preferences.save();

    res.json({
      success: true,
      message: 'Preferences updated',
      data: preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
});

router.get('/preferences', async (req, res) => {
  try {
    let preferences = await UserLocalization.findOne({ user_id: req.user._id });

    if (!preferences) {
      preferences = new UserLocalization({
        user_id: req.user._id,
        country_code: 'TZ',
        language: 'en'
      });
      await preferences.save();
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: error.message
    });
  }
});

router.post('/convert-currency', async (req, res) => {
  try {
    const { amount, from_currency, to_country_code } = req.body;

    const result = await multiCountryPaymentService.convertToLocalCurrency(
      amount,
      from_currency,
      to_country_code
    );

    res.json({
      success: true,
      data: result
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

router.get('/transaction-limits/:countryCode', async (req, res) => {
  try {
    const limits = multiCountryPaymentService.getTransactionLimits(req.params.countryCode);

    if (!limits) {
      return res.status(404).json({
        success: false,
        message: 'Transaction limits not found for country'
      });
    }

    res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    console.error('Get transaction limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction limits',
      error: error.message
    });
  }
});

router.post('/initiate-payment', async (req, res) => {
  try {
    const { country_code, amount, payment_method, description } = req.body;

    const result = await multiCountryPaymentService.initiatePayment(
      req.user._id,
      country_code,
      amount,
      payment_method,
      description
    );

    res.json({
      success: result.success,
      message: result.message,
      data: {
        payment_id: result.payment_id,
        transaction_id: result.transaction_id
      }
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.message
    });
  }
});

router.get('/payment-status/:paymentId', async (req, res) => {
  try {
    const status = await multiCountryPaymentService.getPaymentStatus(req.params.paymentId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: error.message
    });
  }
});

router.get('/payment-history/:countryCode', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await multiCountryPaymentService.getPaymentHistory(
      req.user._id,
      req.params.countryCode,
      page,
      limit
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
});

// Admin routes
router.use('/admin', protect);

router.get('/admin/compliance-logs', async (req, res) => {
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

    const logs = await ComplianceLog.find()
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ComplianceLog.countDocuments();

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get compliance logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compliance logs',
      error: error.message
    });
  }
});

router.post('/admin/country-config', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { country_code, country_name, currency, timezone, languages, payment_methods, tax_rate, kyc_level } = req.body;

    let config = await CountryConfig.findOne({ country_code });

    if (!config) {
      config = new CountryConfig({
        country_code,
        country_name,
        currency,
        timezone,
        languages,
        payment_methods,
        tax_rate,
        kyc_level
      });
    } else {
      if (country_name) config.country_name = country_name;
      if (currency) config.currency = currency;
      if (timezone) config.timezone = timezone;
      if (languages) config.languages = languages;
      if (payment_methods) config.payment_methods = payment_methods;
      if (tax_rate) config.tax_rate = tax_rate;
      if (kyc_level) config.kyc_level = kyc_level;
    }

    await config.save();

    res.json({
      success: true,
      message: 'Country configuration updated',
      data: config
    });
  } catch (error) {
    console.error('Update country config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update country configuration',
      error: error.message
    });
  }
});

router.post('/admin/regional-partners', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { name, country_code, partner_type, contact_email, contact_phone, commission_rate } = req.body;

    const partner = new RegionalPartner({
      name,
      country_code,
      partner_type,
      contact_email,
      contact_phone,
      commission_rate
    });

    await partner.save();

    res.json({
      success: true,
      message: 'Regional partner created',
      data: partner
    });
  } catch (error) {
    console.error('Create regional partner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create regional partner',
      error: error.message
    });
  }
});

router.get('/admin/regional-partners/:countryCode', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const partners = await RegionalPartner.find({
      country_code: req.params.countryCode
    });

    res.json({
      success: true,
      data: partners
    });
  } catch (error) {
    console.error('Get regional partners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch regional partners',
      error: error.message
    });
  }
});

module.exports = router;



