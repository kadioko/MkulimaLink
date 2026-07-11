/**
 * Localization Service
 * Manages multi-country configuration, language support, and regional adaptation
 */

const { CountryConfig, LocalizedContent, RegionalPrices } = require('../models/Localization');

class LocalizationService {
  constructor() {
    this.supportedCountries = {
      TZ: {
        code: 'TZ',
        name: 'Tanzania',
        currency: 'TZS',
        timezone: 'Africa/Nairobi',
        languages: ['en', 'sw'],
        payment_methods: ['mpesa', 'airtel', 'bank_transfer'],
        tax_rate: 0.18,
        kyc_level: 'standard',
        data_residency: 'required'
      },
      KE: {
        code: 'KE',
        name: 'Kenya',
        currency: 'KES',
        timezone: 'Africa/Nairobi',
        languages: ['en', 'sw'],
        payment_methods: ['mpesa', 'bank_transfer'],
        tax_rate: 0.16,
        kyc_level: 'standard',
        data_residency: 'required'
      },
      UG: {
        code: 'UG',
        name: 'Uganda',
        currency: 'UGX',
        timezone: 'Africa/Kampala',
        languages: ['en', 'sw', 'lg'],
        payment_methods: ['mtn_money', 'airtel', 'bank_transfer'],
        tax_rate: 0.18,
        kyc_level: 'enhanced',
        data_residency: 'required'
      },
      RW: {
        code: 'RW',
        name: 'Rwanda',
        currency: 'RWF',
        timezone: 'Africa/Kigali',
        languages: ['en', 'sw', 'rw', 'fr'],
        payment_methods: ['mtn_money', 'airtel', 'bank_transfer'],
        tax_rate: 0.18,
        kyc_level: 'enhanced',
        data_residency: 'required'
      },
      ZM: {
        code: 'ZM',
        name: 'Zambia',
        currency: 'ZMW',
        timezone: 'Africa/Lusaka',
        languages: ['en', 'ny', 'bem'],
        payment_methods: ['airtel', 'mtn_money', 'bank_transfer'],
        tax_rate: 0.16,
        kyc_level: 'standard',
        data_residency: 'optional'
      },
      MW: {
        code: 'MW',
        name: 'Malawi',
        currency: 'MWK',
        timezone: 'Africa/Blantyre',
        languages: ['en', 'ny', 'tum'],
        payment_methods: ['airtel', 'mtn_money', 'bank_transfer'],
        tax_rate: 0.16,
        kyc_level: 'standard',
        data_residency: 'optional'
      }
    };

    this.supportedLanguages = {
      en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
      sw: { name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿' },
      'sw-KE': { name: 'Swahili (Kenya)', nativeName: 'Kiswahili (Kenya)', flag: '🇰🇪' },
      'sw-TZ': { name: 'Swahili (Tanzania)', nativeName: 'Kiswahili (Tanzania)', flag: '🇹🇿' },
      'sw-UG': { name: 'Swahili (Uganda)', nativeName: 'Kiswahili (Uganda)', flag: '🇺🇬' },
      lg: { name: 'Luganda', nativeName: 'Luganda', flag: '🇺🇬' },
      rw: { name: 'Kinyarwanda', nativeName: 'Kinyarwanda', flag: '🇷🇼' },
      fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
      ny: { name: 'Nyanja', nativeName: 'Nyanja', flag: '🇿🇼' },
      bem: { name: 'Bemba', nativeName: 'Bemba', flag: '🇿🇼' },
      tum: { name: 'Tumbuka', nativeName: 'Tumbuka', flag: '🇲🇼' }
    };

    this.regionalCrops = {
      TZ: ['maize', 'coffee', 'cotton', 'cashew', 'tea', 'rice', 'beans'],
      KE: ['maize', 'tea', 'coffee', 'horticulture', 'avocado', 'beans'],
      UG: ['coffee', 'tea', 'maize', 'cassava', 'banana', 'beans'],
      RW: ['coffee', 'tea', 'maize', 'beans', 'sorghum'],
      ZM: ['maize', 'tobacco', 'cotton', 'groundnuts', 'sorghum'],
      MW: ['maize', 'tobacco', 'cotton', 'groundnuts', 'beans']
    };
  }

  /**
   * Get country configuration
   */
  async getCountryConfig(countryCode) {
    try {
      let config = await CountryConfig.findOne({ country_code: countryCode });

      if (!config) {
        const defaultConfig = this.supportedCountries[countryCode];
        if (!defaultConfig) {
          throw new Error('Country not supported');
        }

        config = new CountryConfig({
          country_code: countryCode,
          country_name: defaultConfig.name,
          currency: defaultConfig.currency,
          timezone: defaultConfig.timezone,
          languages: defaultConfig.languages,
          payment_methods: defaultConfig.payment_methods,
          tax_rate: defaultConfig.tax_rate,
          kyc_level: defaultConfig.kyc_level,
          data_residency: defaultConfig.data_residency,
          regulations: {
            aml_kyc: true,
            transaction_reporting: true,
            data_protection: true
          }
        });

        await config.save();
      }

      return config;
    } catch (error) {
      console.error('Get country config error:', error);
      throw error;
    }
  }

  /**
   * Get localized content
   */
  async getLocalizedContent(countryCode, language, contentKey) {
    try {
      let content = await LocalizedContent.findOne({
        country_code: countryCode,
        language,
        key: contentKey
      });

      if (!content) {
        // Return English default if not found
        content = await LocalizedContent.findOne({
          country_code: countryCode,
          language: 'en',
          key: contentKey
        });
      }

      return content?.value || contentKey;
    } catch (error) {
      console.error('Get localized content error:', error);
      return contentKey;
    }
  }

  /**
   * Set localized content
   */
  async setLocalizedContent(countryCode, language, contentKey, value) {
    try {
      let content = await LocalizedContent.findOne({
        country_code: countryCode,
        language,
        key: contentKey
      });

      if (!content) {
        content = new LocalizedContent({
          country_code: countryCode,
          language,
          key: contentKey,
          value
        });
      } else {
        content.value = value;
      }

      await content.save();
      return content;
    } catch (error) {
      console.error('Set localized content error:', error);
      throw error;
    }
  }

  /**
   * Get regional prices
   */
  async getRegionalPrices(region, crop, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const prices = await RegionalPrices.find({
        region,
        crop,
        date: { $gte: startDate }
      }).sort({ date: -1 });

      return prices;
    } catch (error) {
      console.error('Get regional prices error:', error);
      throw error;
    }
  }

  /**
   * Update regional prices
   */
  async updateRegionalPrices(region, crop, price) {
    try {
      const regionalPrice = new RegionalPrices({
        region,
        crop,
        price,
        date: new Date(),
        currency: this.supportedCountries[region]?.currency || 'TZS'
      });

      await regionalPrice.save();
      return regionalPrice;
    } catch (error) {
      console.error('Update regional prices error:', error);
      throw error;
    }
  }

  /**
   * Convert currency
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      // Mock exchange rates (would use real API in production)
      const exchangeRates = {
        TZS: 1,
        KES: 0.0078,
        UGX: 0.00027,
        RWF: 0.00078,
        ZMW: 0.047,
        MWK: 0.0011,
        USD: 0.00039
      };

      const fromRate = exchangeRates[fromCurrency] || 1;
      const toRate = exchangeRates[toCurrency] || 1;

      return (amount / fromRate) * toRate;
    } catch (error) {
      console.error('Convert currency error:', error);
      throw error;
    }
  }

  /**
   * Get supported countries
   */
  getSupportedCountries() {
    return Object.values(this.supportedCountries).map(country => ({
      code: country.code,
      name: country.name,
      currency: country.currency,
      languages: country.languages,
      payment_methods: country.payment_methods
    }));
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * Get regional crops
   */
  getRegionalCrops(countryCode) {
    return this.regionalCrops[countryCode] || [];
  }

  /**
   * Calculate tax
   */
  async calculateTax(countryCode, amount) {
    try {
      const config = await this.getCountryConfig(countryCode);
      const taxAmount = amount * config.tax_rate;
      return {
        amount,
        tax_rate: config.tax_rate,
        tax_amount: taxAmount,
        total: amount + taxAmount
      };
    } catch (error) {
      console.error('Calculate tax error:', error);
      throw error;
    }
  }

  /**
   * Validate KYC level
   */
  async validateKYCLevel(countryCode, userKYCLevel) {
    try {
      const config = await this.getCountryConfig(countryCode);
      const requiredLevel = config.kyc_level;

      const kycLevels = {
        none: 0,
        basic: 1,
        standard: 2,
        enhanced: 3
      };

      return kycLevels[userKYCLevel] >= kycLevels[requiredLevel];
    } catch (error) {
      console.error('Validate KYC error:', error);
      throw error;
    }
  }

  /**
   * Check data residency requirement
   */
  async checkDataResidency(countryCode) {
    try {
      const config = await this.getCountryConfig(countryCode);
      return config.data_residency === 'required';
    } catch (error) {
      console.error('Check data residency error:', error);
      throw error;
    }
  }

  /**
   * Get payment methods for country
   */
  async getPaymentMethods(countryCode) {
    try {
      const config = await this.getCountryConfig(countryCode);
      return config.payment_methods;
    } catch (error) {
      console.error('Get payment methods error:', error);
      throw error;
    }
  }

  /**
   * Format price for region
   */
  async formatPrice(amount, countryCode) {
    try {
      const config = await this.getCountryConfig(countryCode);
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: config.currency
      });
      return formatter.format(amount);
    } catch (error) {
      console.error('Format price error:', error);
      return amount.toString();
    }
  }

  /**
   * Get regional compliance requirements
   */
  async getComplianceRequirements(countryCode) {
    try {
      const config = await this.getCountryConfig(countryCode);
      return {
        country: config.country_name,
        aml_kyc: config.regulations.aml_kyc,
        transaction_reporting: config.regulations.transaction_reporting,
        data_protection: config.regulations.data_protection,
        kyc_level: config.kyc_level,
        data_residency: config.data_residency,
        tax_rate: config.tax_rate
      };
    } catch (error) {
      console.error('Get compliance requirements error:', error);
      throw error;
    }
  }
}

module.exports = new LocalizationService();



