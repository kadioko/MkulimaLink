/**
 * MkulimaLink Crop Insurance Integration
 * Handles agricultural insurance policies and claims processing
 */

const axios = require('axios');
const { InsurancePolicy, InsuranceClaim } = require('../models/Insurance');
const walletService = require('./walletService');

class CropInsuranceService {
  constructor() {
    this.providers = {
      aic: {
        name: 'Agriculture Insurance Company (AIC)',
        api_url: process.env.AIC_API_URL,
        api_key: process.env.AIC_API_KEY,
        products: ['crop_yield', 'weather_index', 'named_perils'],
        regions: ['central', 'rift_valley', 'western', 'eastern', 'coast']
      },
      apa: {
        name: 'APA Insurance',
        api_url: process.env.APA_API_URL,
        api_key: process.env.APA_API_KEY,
        products: ['multi_peril', 'hail_damage', 'drought_protection'],
        regions: ['nairobi', 'central', 'rift_valley']
      },
      uap: {
        name: 'UAP Insurance',
        api_url: process.env.UAP_API_URL,
        api_key: process.env.UAP_API_KEY,
        products: ['crop_insurance', 'livestock_insurance'],
        regions: ['western', 'nyanza', 'central']
      }
    };
  }

  /**
   * Get available insurance products
   */
  async getAvailableProducts(region, cropType) {
    try {
      const availableProducts = [];

      for (const [providerKey, provider] of Object.entries(this.providers)) {
        if (provider.regions.includes(region.toLowerCase())) {
          for (const product of provider.products) {
            // Get product details from provider API
            try {
              const productDetails = await this.getProductDetails(provider, product, cropType);
              if (productDetails) {
                availableProducts.push({
                  id: `${providerKey}_${product}`,
                  provider: provider.name,
                  name: productDetails.name,
                  description: productDetails.description,
                  coverage_types: productDetails.coverage_types,
                  premium_range: productDetails.premium_range,
                  max_sum_insured: productDetails.max_sum_insured,
                  waiting_period: productDetails.waiting_period,
                  eligible_crops: productDetails.eligible_crops,
                  risk_zones: productDetails.risk_zones
                });
              }
            } catch (error) {
              console.warn(`Failed to get product details for ${providerKey}_${product}:`, error.message);
            }
          }
        }
      }

      return availableProducts;
    } catch (error) {
      console.error('Get available products error:', error);
      throw error;
    }
  }

  /**
   * Get product details from provider
   */
  async getProductDetails(provider, productType, cropType) {
    try {
      const response = await axios.get(`${provider.api_url}/products/${productType}`, {
        headers: {
          'Authorization': `Bearer ${provider.api_key}`,
          'Content-Type': 'application/json'
        },
        params: { crop_type: cropType }
      });

      return response.data;
    } catch (error) {
      // Return mock data if API is not available
      return this.getMockProductDetails(productType, cropType);
    }
  }

  /**
   * Mock product details for development
   */
  getMockProductDetails(productType, cropType) {
    const mockProducts = {
      crop_yield: {
        name: 'Crop Yield Insurance',
        description: 'Protects against yield losses due to adverse weather conditions',
        coverage_types: ['yield_shortfall', 'total_loss'],
        premium_range: { min: 500, max: 5000 },
        max_sum_insured: 100000,
        waiting_period: 30,
        eligible_crops: ['maize', 'wheat', 'rice', 'beans', 'coffee'],
        risk_zones: ['high', 'medium', 'low']
      },
      weather_index: {
        name: 'Weather Index Insurance',
        description: 'Pays out based on weather parameters like rainfall and temperature',
        coverage_types: ['drought', 'excess_rain', 'heat_stress'],
        premium_range: { min: 300, max: 3000 },
        max_sum_insured: 50000,
        waiting_period: 14,
        eligible_crops: ['maize', 'sorghum', 'millet'],
        risk_zones: ['arid', 'semi_arid']
      },
      multi_peril: {
        name: 'Multi-Peril Crop Insurance',
        description: 'Comprehensive coverage against multiple agricultural risks',
        coverage_types: ['drought', 'flood', 'pests', 'disease', 'fire'],
        premium_range: { min: 800, max: 8000 },
        max_sum_insured: 200000,
        waiting_period: 21,
        eligible_crops: ['maize', 'coffee', 'tea', 'horticulture'],
        risk_zones: ['all']
      }
    };

    return mockProducts[productType] || null;
  }

  /**
   * Calculate insurance premium
   */
  async calculatePremium(productId, farmData, coverageAmount) {
    try {
      const { providerKey, productType } = this.parseProductId(productId);
      const provider = this.providers[providerKey];

      if (!provider) {
        throw new Error('Insurance provider not found');
      }

      // Prepare calculation data
      const calculationData = {
        product_type: productType,
        coverage_amount: coverageAmount,
        farm_size: farmData.farm_size,
        crop_type: farmData.crop_type,
        region: farmData.region,
        risk_zone: farmData.risk_zone || 'medium',
        farming_practices: farmData.farming_practices || 'conventional',
        historical_yield: farmData.historical_yield,
        expected_yield: farmData.expected_yield
      };

      // Call provider API for premium calculation
      try {
        const response = await axios.post(`${provider.api_url}/calculate-premium`, calculationData, {
          headers: {
            'Authorization': `Bearer ${provider.api_key}`,
            'Content-Type': 'application/json'
          }
        });

        return response.data;
      } catch (apiError) {
        // Fallback to local calculation
        console.warn('Provider API unavailable, using local calculation');
        return this.calculateLocalPremium(calculationData);
      }

    } catch (error) {
      console.error('Premium calculation error:', error);
      throw error;
    }
  }

  /**
   * Local premium calculation (fallback)
   */
  calculateLocalPremium(data) {
    const { coverage_amount, farm_size, crop_type, region, risk_zone } = data;

    // Base premium calculation
    let baseRate = 0.05; // 5% base rate

    // Adjust for crop type
    const cropMultipliers = {
      maize: 1.0,
      wheat: 1.1,
      rice: 1.2,
      coffee: 1.3,
      tea: 1.4,
      beans: 0.9
    };
    baseRate *= cropMultipliers[crop_type] || 1.0;

    // Adjust for risk zone
    const riskMultipliers = {
      low: 0.8,
      medium: 1.0,
      high: 1.3,
      very_high: 1.6
    };
    baseRate *= riskMultipliers[risk_zone] || 1.0;

    // Adjust for region
    const regionMultipliers = {
      central: 1.0,
      rift_valley: 1.1,
      western: 1.2,
      eastern: 1.3,
      coast: 1.4,
      nyanza: 1.1
    };
    baseRate *= regionMultipliers[region] || 1.0;

    const annualPremium = coverage_amount * baseRate;
    const monthlyPremium = annualPremium / 12;

    return {
      annual_premium: Math.round(annualPremium),
      monthly_premium: Math.round(monthlyPremium),
      premium_rate: Math.round(baseRate * 10000) / 100, // Convert to percentage
      coverage_amount: coverage_amount,
      calculation_method: 'local_fallback',
      factors: {
        crop_type: crop_type,
        risk_zone: risk_zone,
        region: region,
        farm_size: farm_size
      }
    };
  }

  /**
   * Purchase insurance policy
   */
  async purchasePolicy(userId, policyData) {
    try {
      const {
        product_id,
        coverage_amount,
        premium_payment_term, // 'annual' or 'monthly'
        farm_details,
        beneficiary_details
      } = policyData;

      // Calculate premium
      const premiumCalculation = await this.calculatePremium(
        product_id,
        farm_details,
        coverage_amount
      );

      const premiumAmount = premium_payment_term === 'monthly'
        ? premiumCalculation.monthly_premium
        : premiumCalculation.annual_premium;

      // Debit wallet for premium payment
      await walletService.debitWallet(
        userId,
        premiumAmount,
        `Insurance premium for ${product_id}`,
        `INS_PREMIUM_${Date.now()}`
      );

      // Create policy record
      const policy = new InsurancePolicy({
        user: userId,
        product_id,
        coverage_amount,
        premium_amount: premiumAmount,
        premium_payment_term,
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        farm_details,
        beneficiary_details,
        premium_calculation: premiumCalculation,
        payment_schedule: this.generatePaymentSchedule(premiumAmount, premium_payment_term)
      });

      await policy.save();

      // Submit to insurance provider
      try {
        await this.submitPolicyToProvider(policy);
      } catch (providerError) {
        console.warn('Failed to submit to provider, policy saved locally:', providerError.message);
      }

      return {
        success: true,
        policy_id: policy._id,
        premium_amount: premiumAmount,
        coverage_amount: coverage_amount,
        start_date: policy.start_date,
        end_date: policy.end_date,
        message: 'Insurance policy purchased successfully'
      };

    } catch (error) {
      console.error('Policy purchase error:', error);
      throw error;
    }
  }

  /**
   * Generate payment schedule
   */
  generatePaymentSchedule(premiumAmount, term) {
    const schedule = [];
    const now = new Date();

    if (term === 'annual') {
      schedule.push({
        due_date: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
        amount: premiumAmount,
        status: 'pending'
      });
    } else if (term === 'monthly') {
      for (let i = 1; i <= 12; i++) {
        schedule.push({
          due_date: new Date(now.getFullYear(), now.getMonth() + i, now.getDate()),
          amount: premiumAmount,
          status: 'pending'
        });
      }
    }

    return schedule;
  }

  /**
   * Submit policy to insurance provider
   */
  async submitPolicyToProvider(policy) {
    try {
      const { providerKey } = this.parseProductId(policy.product_id);
      const provider = this.providers[providerKey];

      const submissionData = {
        policy_id: policy._id.toString(),
        coverage_amount: policy.coverage_amount,
        premium_amount: policy.premium_amount,
        start_date: policy.start_date,
        end_date: policy.end_date,
        farm_details: policy.farm_details,
        beneficiary_details: policy.beneficiary_details
      };

      const response = await axios.post(`${provider.api_url}/policies`, submissionData, {
        headers: {
          'Authorization': `Bearer ${provider.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      // Update policy with provider reference
      policy.provider_policy_id = response.data.policy_id;
      policy.provider_data = response.data;
      await policy.save();

    } catch (error) {
      console.error('Provider policy submission error:', error);
      throw error;
    }
  }

  /**
   * File insurance claim
   */
  async fileClaim(userId, claimData) {
    try {
      const {
        policy_id,
        incident_type,
        incident_date,
        description,
        estimated_loss,
        supporting_documents,
        witness_details
      } = claimData;

      // Verify policy ownership
      const policy = await InsurancePolicy.findOne({
        _id: policy_id,
        user: userId,
        status: 'active'
      });

      if (!policy) {
        throw new Error('Active insurance policy not found');
      }

      // Check if incident is within coverage period
      const incidentDate = new Date(incident_date);
      if (incidentDate < policy.start_date || incidentDate > policy.end_date) {
        throw new Error('Incident date is outside policy coverage period');
      }

      // Create claim record
      const claim = new InsuranceClaim({
        policy: policy_id,
        incident_type,
        incident_date: incidentDate,
        description,
        estimated_loss,
        status: 'submitted',
        supporting_documents,
        witness_details,
        submitted_by: userId
      });

      await claim.save();

      // Submit claim to provider
      try {
        await this.submitClaimToProvider(claim, policy);
      } catch (providerError) {
        console.warn('Failed to submit claim to provider:', providerError.message);
      }

      return {
        success: true,
        claim_id: claim._id,
        message: 'Insurance claim submitted successfully'
      };

    } catch (error) {
      console.error('Claim filing error:', error);
      throw error;
    }
  }

  /**
   * Submit claim to insurance provider
   */
  async submitClaimToProvider(claim, policy) {
    try {
      const { providerKey } = this.parseProductId(policy.product_id);
      const provider = this.providers[providerKey];

      const submissionData = {
        claim_id: claim._id.toString(),
        policy_id: policy.provider_policy_id || policy._id.toString(),
        incident_type: claim.incident_type,
        incident_date: claim.incident_date,
        description: claim.description,
        estimated_loss: claim.estimated_loss,
        supporting_documents: claim.supporting_documents
      };

      const response = await axios.post(`${provider.api_url}/claims`, submissionData, {
        headers: {
          'Authorization': `Bearer ${provider.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      // Update claim with provider reference
      claim.provider_claim_id = response.data.claim_id;
      claim.provider_data = response.data;
      await claim.save();

    } catch (error) {
      console.error('Provider claim submission error:', error);
      throw error;
    }
  }

  /**
   * Get user's insurance policies
   */
  async getUserPolicies(userId) {
    try {
      const policies = await InsurancePolicy.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate('user', 'name email');

      return policies.map(policy => ({
        id: policy._id,
        product_id: policy.product_id,
        coverage_amount: policy.coverage_amount,
        premium_amount: policy.premium_amount,
        status: policy.status,
        start_date: policy.start_date,
        end_date: policy.end_date,
        farm_details: policy.farm_details,
        next_premium_due: policy.payment_schedule.find(p => p.status === 'pending')?.due_date
      }));

    } catch (error) {
      console.error('Get user policies error:', error);
      throw error;
    }
  }

  /**
   * Get user's insurance claims
   */
  async getUserClaims(userId) {
    try {
      const claims = await InsuranceClaim.find({ submitted_by: userId })
        .sort({ createdAt: -1 })
        .populate('policy');

      return claims.map(claim => ({
        id: claim._id,
        policy_id: claim.policy._id,
        incident_type: claim.incident_type,
        incident_date: claim.incident_date,
        description: claim.description,
        estimated_loss: claim.estimated_loss,
        approved_amount: claim.approved_amount,
        status: claim.status,
        submitted_date: claim.createdAt,
        processed_date: claim.processed_at
      }));

    } catch (error) {
      console.error('Get user claims error:', error);
      throw error;
    }
  }

  /**
   * Process claim payment
   */
  async processClaimPayment(claimId, approvedAmount) {
    try {
      const claim = await InsuranceClaim.findById(claimId).populate('policy');

      if (!claim) {
        throw new Error('Claim not found');
      }

      // Update claim
      claim.approved_amount = approvedAmount;
      claim.status = 'approved';
      claim.processed_at = new Date();
      await claim.save();

      // Credit approved amount to user's wallet
      await walletService.creditWallet(
        claim.policy.user,
        approvedAmount,
        `Insurance claim payout - ${claim.incident_type}`,
        `INS_CLAIM_${claimId}`
      );

      return {
        success: true,
        approved_amount: approvedAmount,
        message: 'Claim payment processed successfully'
      };

    } catch (error) {
      console.error('Claim payment processing error:', error);
      throw error;
    }
  }

  // Utility methods

  parseProductId(productId) {
    const [providerKey, productType] = productId.split('_');
    return { providerKey, productType };
  }

  /**
   * Get weather risk assessment for location
   */
  async getWeatherRiskAssessment(location, cropType) {
    try {
      // This would integrate with weather APIs to assess risk
      // For now, return mock assessment
      const riskFactors = {
        drought_risk: Math.random(),
        flood_risk: Math.random() * 0.3,
        pest_risk: Math.random() * 0.5,
        disease_risk: Math.random() * 0.4
      };

      const overallRisk = Object.values(riskFactors).reduce((sum, risk) => sum + risk, 0) / 4;

      let riskLevel = 'low';
      if (overallRisk > 0.7) riskLevel = 'high';
      else if (overallRisk > 0.4) riskLevel = 'medium';

      return {
        location,
        crop_type: cropType,
        risk_level: riskLevel,
        risk_factors: riskFactors,
        recommended_coverage: riskLevel === 'high' ? 80 : riskLevel === 'medium' ? 60 : 40
      };

    } catch (error) {
      console.error('Weather risk assessment error:', error);
      throw error;
    }
  }
}

module.exports = new CropInsuranceService();
