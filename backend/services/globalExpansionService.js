/**
 * Global Expansion Service
 * Manages multi-region infrastructure, currencies, and global operations
 */

const { GlobalRegion, RegionalMetrics, CurrencyRate, PartnershipAgreement } = require('../models/GlobalExpansion');
const { User } = require('../models');

class GlobalExpansionService {
  constructor() {
    this.supportedRegions = {
      africa: {
        name: 'Africa',
        countries: ['TZ', 'KE', 'UG', 'RW', 'ZM', 'MW', 'NG', 'GH', 'ET', 'SN'],
        timezone: 'Africa/Nairobi',
        languages: ['en', 'sw', 'ha', 'yo', 'am', 'fr'],
        currencies: ['TZS', 'KES', 'UGX', 'RWF', 'ZMW', 'MWK', 'NGN', 'GHS', 'ETB', 'XOF']
      },
      asia: {
        name: 'Asia',
        countries: ['IN', 'BD', 'PH', 'ID', 'VN', 'TH'],
        timezone: 'Asia/Kolkata',
        languages: ['en', 'hi', 'bn', 'tl', 'id', 'vi', 'th'],
        currencies: ['INR', 'BDT', 'PHP', 'IDR', 'VND', 'THB']
      },
      americas: {
        name: 'Americas',
        countries: ['BR', 'MX', 'AR', 'CO', 'PE', 'CL'],
        timezone: 'America/Sao_Paulo',
        languages: ['en', 'es', 'pt', 'fr'],
        currencies: ['BRL', 'MXN', 'ARS', 'COP', 'PEN', 'CLP', 'USD']
      },
      europe: {
        name: 'Europe',
        countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL'],
        timezone: 'Europe/London',
        languages: ['en', 'de', 'fr', 'it', 'es', 'nl'],
        currencies: ['GBP', 'EUR', 'CHF']
      }
    };

    this.paymentMethods = {
      mobile_money: ['mpesa', 'airtel', 'mtn_money', 'vodafone_cash', 'orange_money'],
      digital_wallets: ['paypal', 'google_pay', 'apple_pay', 'alipay', 'wechat_pay'],
      bank_transfers: ['swift', 'local_bank', 'ach', 'sepa'],
      crypto: ['bitcoin', 'ethereum', 'stablecoin'],
      cards: ['visa', 'mastercard', 'amex']
    };

    this.languages = {
      en: { name: 'English', flag: '🇬🇧', native: 'English' },
      sw: { name: 'Swahili', flag: '🇹🇿', native: 'Kiswahili' },
      ha: { name: 'Hausa', flag: '🇳🇬', native: 'Hausa' },
      yo: { name: 'Yoruba', flag: '🇳🇬', native: 'Yorùbá' },
      am: { name: 'Amharic', flag: '🇪🇹', native: 'አማርኛ' },
      fr: { name: 'French', flag: '🇫🇷', native: 'Français' },
      hi: { name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
      bn: { name: 'Bengali', flag: '🇧🇩', native: 'বাংলা' },
      tl: { name: 'Tagalog', flag: '🇵🇭', native: 'Tagalog' },
      id: { name: 'Indonesian', flag: '🇮🇩', native: 'Bahasa Indonesia' },
      vi: { name: 'Vietnamese', flag: '🇻🇳', native: 'Tiếng Việt' },
      th: { name: 'Thai', flag: '🇹🇭', native: 'ไทย' },
      pt: { name: 'Portuguese', flag: '🇧🇷', native: 'Português' },
      es: { name: 'Spanish', flag: '🇪🇸', native: 'Español' },
      de: { name: 'German', flag: '🇩🇪', native: 'Deutsch' },
      it: { name: 'Italian', flag: '🇮🇹', native: 'Italiano' },
      nl: { name: 'Dutch', flag: '🇳🇱', native: 'Nederlands' }
    };
  }

  /**
   * Add new region
   */
  async addRegion(regionData) {
    try {
      const { region_code, region_name, countries, timezone, languages, currencies } = regionData;

      const region = new GlobalRegion({
        region_code,
        region_name,
        countries,
        timezone,
        languages,
        currencies,
        status: 'active',
        launch_date: new Date()
      });

      await region.save();

      // Initialize regional metrics
      const metrics = new RegionalMetrics({
        region_code,
        active_users: 0,
        total_transactions: 0,
        total_revenue: 0,
        market_share: 0
      });

      await metrics.save();

      return region;
    } catch (error) {
      console.error('Add region error:', error);
      throw error;
    }
  }

  /**
   * Get region details
   */
  async getRegionDetails(regionCode) {
    try {
      const region = await GlobalRegion.findOne({ region_code: regionCode });
      const metrics = await RegionalMetrics.findOne({ region_code: regionCode });

      if (!region) {
        throw new Error('Region not found');
      }

      return {
        ...region.toObject(),
        metrics: metrics?.toObject()
      };
    } catch (error) {
      console.error('Get region details error:', error);
      throw error;
    }
  }

  /**
   * Update currency rates
   */
  async updateCurrencyRates(rates) {
    try {
      const updates = [];

      for (const [currency, rate] of Object.entries(rates)) {
        const existing = await CurrencyRate.findOne({ currency });

        if (existing) {
          existing.rate = rate;
          existing.updated_at = new Date();
          updates.push(existing.save());
        } else {
          const newRate = new CurrencyRate({
            currency,
            rate,
            base_currency: 'USD'
          });
          updates.push(newRate.save());
        }
      }

      await Promise.all(updates);
      return { success: true, updated: Object.keys(rates).length };
    } catch (error) {
      console.error('Update currency rates error:', error);
      throw error;
    }
  }

  /**
   * Convert currency
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      if (fromCurrency === toCurrency) {
        return amount;
      }

      const fromRate = await CurrencyRate.findOne({ currency: fromCurrency });
      const toRate = await CurrencyRate.findOne({ currency: toCurrency });

      if (!fromRate || !toRate) {
        throw new Error('Currency rates not found');
      }

      // Convert to base currency first, then to target
      const amountInBase = amount / fromRate.rate;
      const amountInTarget = amountInBase * toRate.rate;

      return Math.round(amountInTarget * 100) / 100;
    } catch (error) {
      console.error('Convert currency error:', error);
      throw error;
    }
  }

  /**
   * Create partnership agreement
   */
  async createPartnershipAgreement(partnerData) {
    try {
      const {
        partner_name,
        partner_type,
        region_code,
        commission_rate,
        payment_terms,
        start_date,
        end_date
      } = partnerData;

      const agreement = new PartnershipAgreement({
        partner_name,
        partner_type,
        region_code,
        commission_rate,
        payment_terms,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        status: 'active',
        total_revenue: 0,
        total_commission: 0
      });

      await agreement.save();
      return agreement;
    } catch (error) {
      console.error('Create partnership error:', error);
      throw error;
    }
  }

  /**
   * Get partnerships by region
   */
  async getPartnershipsByRegion(regionCode, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const partnerships = await PartnershipAgreement.find({ region_code: regionCode })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await PartnershipAgreement.countDocuments({ region_code: regionCode });

      return {
        partnerships,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get partnerships error:', error);
      throw error;
    }
  }

  /**
   * Get global metrics
   */
  async getGlobalMetrics() {
    try {
      const metrics = await RegionalMetrics.find();

      const totals = {
        total_users: 0,
        total_transactions: 0,
        total_revenue: 0,
        regions: []
      };

      for (const metric of metrics) {
        totals.total_users += metric.active_users;
        totals.total_transactions += metric.total_transactions;
        totals.total_revenue += metric.total_revenue;
        totals.regions.push({
          region_code: metric.region_code,
          users: metric.active_users,
          transactions: metric.total_transactions,
          revenue: metric.total_revenue,
          market_share: metric.market_share
        });
      }

      return totals;
    } catch (error) {
      console.error('Get global metrics error:', error);
      throw error;
    }
  }

  /**
   * Get supported regions
   */
  getSupportedRegions() {
    return Object.entries(this.supportedRegions).map(([key, region]) => ({
      id: key,
      name: region.name,
      countries: region.countries.length,
      languages: region.languages.length,
      currencies: region.currencies.length
    }));
  }

  /**
   * Get payment methods by region
   */
  getPaymentMethodsByRegion(regionCode) {
    const region = this.supportedRegions[regionCode];
    if (!region) {
      return [];
    }

    const methods = [];
    for (const [category, items] of Object.entries(this.paymentMethods)) {
      methods.push({
        category,
        methods: items
      });
    }

    return methods;
  }

  /**
   * Get languages
   */
  getLanguages() {
    return Object.entries(this.languages).map(([code, lang]) => ({
      code,
      name: lang.name,
      flag: lang.flag,
      native: lang.native
    }));
  }

  /**
   * Calculate regional pricing
   */
  async calculateRegionalPricing(basePrice, baseCurrency, targetCurrency, regionCode) {
    try {
      // Convert base price to target currency
      const convertedPrice = await this.convertCurrency(basePrice, baseCurrency, targetCurrency);

      // Apply regional adjustments
      const adjustment = this.getRegionalPriceAdjustment(regionCode);
      const finalPrice = convertedPrice * adjustment;

      return Math.round(finalPrice * 100) / 100;
    } catch (error) {
      console.error('Calculate regional pricing error:', error);
      throw error;
    }
  }

  /**
   * Get regional expansion roadmap
   */
  getExpansionRoadmap() {
    return {
      phase1: {
        name: 'Phase 1: Africa Expansion',
        regions: ['TZ', 'KE', 'UG', 'RW', 'ZM', 'MW'],
        timeline: 'Q1-Q2 2024',
        status: 'completed'
      },
      phase2: {
        name: 'Phase 2: West Africa',
        regions: ['NG', 'GH', 'SN'],
        timeline: 'Q3-Q4 2024',
        status: 'in_progress'
      },
      phase3: {
        name: 'Phase 3: East Africa Extension',
        regions: ['ET', 'SO'],
        timeline: 'Q1 2025',
        status: 'planned'
      },
      phase4: {
        name: 'Phase 4: Asia Expansion',
        regions: ['IN', 'BD', 'PH'],
        timeline: 'Q2-Q3 2025',
        status: 'planned'
      },
      phase5: {
        name: 'Phase 5: Americas & Europe',
        regions: ['BR', 'MX', 'GB', 'DE'],
        timeline: 'Q4 2025',
        status: 'planned'
      }
    };
  }

  // Helper methods

  getRegionalPriceAdjustment(regionCode) {
    const adjustments = {
      africa: 1.0,
      asia: 0.8,
      americas: 1.2,
      europe: 1.3
    };

    return adjustments[regionCode] || 1.0;
  }
}

module.exports = new GlobalExpansionService();



