const express = require('express');
const router = express.Router();
const Insurance = require('../models/Insurance');
const { InsurancePolicy, InsuranceClaim } = require('../models/Insurance');
const { protect } = require('../middleware/auth');
const cropInsuranceService = require('../services/cropInsuranceService');

// Enhanced insurance products with provider integration
router.get('/products', async (req, res) => {
  try {
    const { region, crop_type } = req.query;

    // Try new enhanced system first
    try {
      const products = await cropInsuranceService.getAvailableProducts(region, crop_type);
      return res.json({
        success: true,
        data: products
      });
    } catch (enhancedError) {
      // Fall back to basic product list
      const products = [
        {
          id: 'crop_basic',
          type: 'crop',
          name: 'Crop Protection Insurance',
          description: 'Protect your crops against drought, floods, pests, and diseases',
          coverage_options: [100000, 500000, 1000000, 5000000],
          covered_risks: ['drought', 'flood', 'pest', 'disease', 'hail'],
          premium_rate: '5% of coverage amount',
          max_coverage: 5000000,
          waiting_period: 30,
          provider: 'MkulimaLink Insurance'
        },
        {
          id: 'livestock_basic',
          type: 'livestock',
          name: 'Livestock Insurance',
          description: 'Coverage for cattle, goats, sheep, and poultry',
          coverage_options: [50000, 200000, 500000, 2000000],
          covered_risks: ['disease', 'accident', 'theft'],
          premium_rate: '4% of coverage amount',
          max_coverage: 2000000,
          waiting_period: 14,
          provider: 'MkulimaLink Insurance'
        },
        {
          id: 'weather_index',
          type: 'weather',
          name: 'Weather Index Insurance',
          description: 'Automatic payouts when weather conditions trigger thresholds',
          coverage_options: [100000, 500000, 1000000],
          covered_risks: ['drought', 'flood', 'frost'],
          premium_rate: '6% of coverage amount',
          max_coverage: 1000000,
          waiting_period: 7,
          features: ['Automatic satellite monitoring', 'No claim filing needed'],
          provider: 'MkulimaLink Insurance'
        },
        {
          id: 'equipment_basic',
          type: 'equipment',
          name: 'Equipment Insurance',
          description: 'Protect your farming equipment and machinery',
          coverage_options: [500000, 2000000, 10000000],
          covered_risks: ['theft', 'fire', 'accident'],
          premium_rate: '3% of coverage amount',
          max_coverage: 10000000,
          waiting_period: 30,
          provider: 'MkulimaLink Insurance'
        },
        {
          id: 'transit_basic',
          type: 'transit',
          name: 'Transit Insurance',
          description: 'Coverage for products during transportation',
          coverage_options: [50000, 200000, 500000],
          covered_risks: ['accident', 'theft', 'damage'],
          premium_rate: '2% of cargo value',
          max_coverage: 500000,
          waiting_period: 1,
          provider: 'MkulimaLink Insurance'
        }
      ];

      // Filter by region if provided
      let filteredProducts = products;
      if (region) {
        // Basic region filtering (could be enhanced)
        filteredProducts = products.filter(product => {
          if (region.toLowerCase().includes('arid') && product.type === 'weather') return true;
          return product.type !== 'weather' || !region.toLowerCase().includes('urban');
        });
      }

      return res.json({
        success: true,
        data: filteredProducts
      });
    }
  } catch (error) {
    console.error('Get insurance products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance products',
      error: error.message
    });
  }
});

// Enhanced premium calculation with provider integration
router.post('/quote', protect, async (req, res) => {
  try {
    const { type, coverageAmount, region, farmSize, previousClaims, organicCertified, product_id, farm_data } = req.body;

    let quote;

    // Try enhanced system first
    if (product_id && farm_data) {
      try {
        quote = await cropInsuranceService.calculatePremium(product_id, farm_data, coverageAmount);
        quote.type = type;
        quote.product_id = product_id;
      } catch (enhancedError) {
        console.warn('Enhanced premium calculation failed, using fallback:', enhancedError.message);
        quote = Insurance.calculatePremium(type, coverageAmount, {
          region,
          farmSize,
          previousClaims: previousClaims || 0,
          organicCertified,
          risk_zone: farm_data?.risk_zone,
          farming_practices: farm_data?.farming_practices
        });
      }
    } else {
      // Use legacy calculation
      quote = Insurance.calculatePremium(type, coverageAmount, {
        region,
        farmSize,
        previousClaims: previousClaims || 0,
        organicCertified
      });
    }

    quote.validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Valid for 7 days

    res.json({
      success: true,
      data: quote
    });
  } catch (error) {
    console.error('Premium calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate premium',
      error: error.message
    });
  }
});

// Enhanced policy purchase with provider integration
router.post('/purchase', protect, async (req, res) => {
  try {
    const {
      type,
      coverageAmount,
      coverage,
      period,
      paymentFrequency,
      paymentReference,
      product_id,
      farm_details,
      beneficiary_details,
      premium_payment_term
    } = req.body;

    // Try enhanced system first
    if (product_id && farm_details) {
      try {
        const policyData = {
          product_id,
          coverage_amount: coverageAmount,
          premium_payment_term: premium_payment_term || 'annual',
          farm_details,
          beneficiary_details: beneficiary_details || {
            name: 'Self',
            phone: '',
            relationship: 'self'
          }
        };

        const result = await cropInsuranceService.purchasePolicy(req.user._id, policyData);

        return res.status(201).json({
          success: true,
          message: 'Insurance policy purchased successfully',
          data: result
        });
      } catch (enhancedError) {
        console.warn('Enhanced policy purchase failed, using fallback:', enhancedError.message);
      }
    }

    // Fallback to legacy system
    const premium = Insurance.calculatePremium(type, coverageAmount, {
      region: coverage?.farmLocation?.region
    });

    const insurance = await Insurance.create({
      policyholder: req.user._id,
      user: req.user._id, // For enhanced system compatibility
      type,
      status: 'active',
      coverage: {
        ...coverage,
        coverageAmount,
        deductible: premium.deductible,
        coveredRisks: coverage?.coveredRisks || ['drought', 'flood', 'pest']
      },
      premium: {
        amount: premium.seasonalPremium,
        frequency: paymentFrequency || 'seasonal',
        nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        payments: [{
          amount: premium.seasonalPremium,
          date: new Date(),
          reference: paymentReference,
          status: 'completed'
        }]
      },
      period: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        season: period?.season || 'masika'
      },
      partner: {
        name: 'MkulimaLink Insurance Partners',
        code: 'MKLINS'
      },
      // Enhanced fields
      product_id: product_id || `${type}_basic`,
      premium_payment_term: premium_payment_term || 'annual',
      farm_details: farm_details || {
        farm_size: coverage?.farmSize,
        farming_practices: 'conventional'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Insurance policy created successfully',
      data: {
        policy_id: insurance._id,
        coverage_amount: coverageAmount,
        premium_amount: premium.seasonalPremium,
        start_date: insurance.period.startDate,
        end_date: insurance.period.endDate
      }
    });
  } catch (error) {
    console.error('Policy purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase insurance policy',
      error: error.message
    });
  }
});

// Enhanced my policies endpoint
router.get('/my-policies', protect, async (req, res) => {
  try {
    const { status } = req.query;

    // Try enhanced system first
    try {
      const policies = await cropInsuranceService.getUserPolicies(req.user._id);

      // Filter by status if provided
      let filteredPolicies = policies;
      if (status) {
        filteredPolicies = policies.filter(p => p.status === status);
      }

      const stats = {
        totalPolicies: filteredPolicies.length,
        activePolicies: filteredPolicies.filter(p => p.status === 'active').length,
        totalCoverage: filteredPolicies
          .filter(p => p.status === 'active')
          .reduce((sum, p) => sum + (p.coverage_amount || 0), 0),
        totalPremiums: filteredPolicies
          .filter(p => p.status === 'active')
          .reduce((sum, p) => sum + (p.premium_amount || 0), 0)
      };

      return res.json({
        success: true,
        data: {
          policies: filteredPolicies,
          stats
        }
      });
    } catch (enhancedError) {
      console.warn('Enhanced policies fetch failed, using fallback:', enhancedError.message);
    }

    // Fallback to legacy system
    const query = { policyholder: req.user._id };
    if (status) query.status = status;

    const policies = await Insurance.find(query).sort('-createdAt');

    const formattedPolicies = policies.map(policy => ({
      id: policy._id,
      product_id: policy.product_id || `${policy.type}_basic`,
      coverage_amount: policy.coverage.coverageAmount,
      premium_amount: policy.premium.amount,
      status: policy.status,
      start_date: policy.period.startDate,
      end_date: policy.period.endDate,
      farm_details: policy.coverage.farmLocation,
      next_payment_date: policy.premium.nextDueDate,
      legacy: true
    }));

    const stats = {
      totalPolicies: policies.length,
      activePolicies: policies.filter(p => p.status === 'active').length,
      totalCoverage: policies
        .filter(p => p.status === 'active')
        .reduce((sum, p) => sum + p.coverage.coverageAmount, 0),
      totalClaims: policies.reduce((sum, p) => sum + p.claims.length, 0)
    };

    res.json({
      success: true,
      data: {
        policies: formattedPolicies,
        stats
      }
    });
  } catch (error) {
    console.error('Get user policies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance policies',
      error: error.message
    });
  }
});

// Get specific policy details
router.get('/policy/:id', protect, async (req, res) => {
  try {
    // Try enhanced system first
    try {
      const policies = await cropInsuranceService.getUserPolicies(req.user._id);
      const policy = policies.find(p => p.id === req.params.id);

      if (policy) {
        return res.json({
          success: true,
          data: policy
        });
      }
    } catch (enhancedError) {
      // Continue to legacy system
    }

    // Fallback to legacy system
    const policy = await Insurance.findOne({
      _id: req.params.id,
      policyholder: req.user._id
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: policy._id,
        product_id: policy.product_id || `${policy.type}_basic`,
        coverage_amount: policy.coverage.coverageAmount,
        premium_amount: policy.premium.amount,
        status: policy.status,
        start_date: policy.period.startDate,
        end_date: policy.period.endDate,
        farm_details: policy.coverage.farmLocation,
        next_payment_date: policy.premium.nextDueDate,
        claims: policy.claims,
        legacy: true
      }
    });
  } catch (error) {
    console.error('Get policy details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policy details',
      error: error.message
    });
  }
});

// Enhanced claim submission
router.post('/policy/:id/claim', protect, async (req, res) => {
  try {
    const { incident_type, description, estimated_loss, evidence, supporting_documents, witness_details } = req.body;

    // Try enhanced system first
    try {
      const claimData = {
        policy_id: req.params.id,
        incident_type,
        incident_date: req.body.incident_date || new Date(),
        description,
        estimated_loss,
        supporting_documents: supporting_documents || evidence,
        witness_details: witness_details || [],
        submitted_by: req.user._id
      };

      const result = await cropInsuranceService.fileClaim(req.user._id, claimData);

      return res.status(201).json({
        success: true,
        message: 'Insurance claim submitted successfully',
        data: result
      });
    } catch (enhancedError) {
      console.warn('Enhanced claim submission failed, using fallback:', enhancedError.message);
    }

    // Fallback to legacy system
    const policy = await Insurance.findOne({
      _id: req.params.id,
      policyholder: req.user._id
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }

    if (policy.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Policy is not active'
      });
    }

    const claim = await policy.submitClaim({
      type: incident_type,
      description,
      amount: estimated_loss,
      evidence: evidence || []
    });

    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully',
      data: claim
    });
  } catch (error) {
    console.error('Submit claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit claim',
      error: error.message
    });
  }
});

// Get policy claims
router.get('/policy/:id/claims', protect, async (req, res) => {
  try {
    // Try enhanced system first
    try {
      const claims = await cropInsuranceService.getUserClaims(req.user._id);
      const policyClaims = claims.filter(c => c.policy_id === req.params.id);

      return res.json({
        success: true,
        data: policyClaims
      });
    } catch (enhancedError) {
      // Continue to legacy system
    }

    // Fallback to legacy system
    const policy = await Insurance.findOne({
      _id: req.params.id,
      policyholder: req.user._id
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Insurance policy not found'
      });
    }

    res.json({
      success: true,
      data: policy.claims
    });
  } catch (error) {
    console.error('Get policy claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policy claims',
      error: error.message
    });
  }
});

// Policy renewal
router.post('/policy/:id/renew', protect, async (req, res) => {
  try {
    const { paymentReference } = req.body;

    // Try enhanced system first
    try {
      // For enhanced system, renewal would be handled differently
      // This is a placeholder for now
      throw new Error('Enhanced renewal not implemented');
    } catch (enhancedError) {
      // Use legacy system
      const policy = await Insurance.findOne({
        _id: req.params.id,
        policyholder: req.user._id
      });

      if (!policy) {
        return res.status(404).json({
          success: false,
          message: 'Insurance policy not found'
        });
      }

      policy.period.startDate = policy.period.endDate;
      policy.period.endDate = new Date(policy.period.endDate.getTime() + 365 * 24 * 60 * 60 * 1000);
      policy.status = 'active';

      policy.premium.payments.push({
        amount: policy.premium.amount,
        date: new Date(),
        reference: paymentReference,
        status: 'completed'
      });

      policy.premium.nextDueDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

      await policy.save();

      res.json({
        success: true,
        message: 'Policy renewed successfully',
        data: {
          policy_id: policy._id,
          new_end_date: policy.period.endDate,
          next_payment_date: policy.premium.nextDueDate
        }
      });
    }
  } catch (error) {
    console.error('Policy renewal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew policy',
      error: error.message
    });
  }
});

// Get weather risk assessment
router.get('/risk-assessment', protect, async (req, res) => {
  try {
    const { location, crop_type } = req.query;

    if (!location || !crop_type) {
      return res.status(400).json({
        success: false,
        message: 'Location and crop type are required'
      });
    }

    const assessment = await cropInsuranceService.getWeatherRiskAssessment(location, crop_type);

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get risk assessment',
      error: error.message
    });
  }
});

// Admin routes for insurance management
router.use('/admin', protect);

// Get all policies (admin)
router.get('/admin/policies', async (req, res) => {
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
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const policies = await Insurance.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('policyholder', 'name email phone');

    const total = await Insurance.countDocuments(filter);

    res.json({
      success: true,
      data: {
        policies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get policies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance policies',
      error: error.message
    });
  }
});

// Get all claims (admin)
router.get('/admin/claims', async (req, res) => {
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
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const claims = await InsuranceClaim.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('policy')
      .populate('submitted_by', 'name email')
      .populate('reviewed_by', 'name');

    const total = await InsuranceClaim.countDocuments(filter);

    res.json({
      success: true,
      data: {
        claims,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance claims',
      error: error.message
    });
  }
});

// Process claim payout (admin)
router.post('/admin/claims/:claimId/process', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { approved_amount, payout_reference, bank_details } = req.body;

    const result = await cropInsuranceService.processClaimPayment(req.params.claimId, {
      payout_amount: approved_amount,
      payout_reference,
      bank_details
    });

    res.json({
      success: true,
      message: 'Claim payment processed successfully',
      data: result
    });
  } catch (error) {
    console.error('Process claim payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process claim payment',
      error: error.message
    });
  }
});

module.exports = router;
