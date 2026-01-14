/**
 * Micro-Loans Service
 * Integrates with financial service providers to offer micro-loans to farmers
 */

const axios = require('axios');
const { LoanApplication, loanProviders } = require('../models/Loan');
const walletService = require('./walletService');

class MicroLoansService {
  /**
   * Submit loan application
   */
  async submitLoanApplication(userId, applicationData) {
    try {
      const {
        amount,
        term_months,
        purpose,
        description,
        collateral,
        guarantors,
        farm_size,
        crop_type,
        expected_yield,
        farming_experience_years
      } = applicationData;

      // Create loan application
      const loanApplication = new LoanApplication({
        user: userId,
        borrower: userId, // Backward compatibility
        amount,
        term_months,
        purpose,
        description,
        collateral,
        guarantors,
        farm_size,
        crop_type,
        expected_yield,
        farming_experience_years,
        status: 'submitted'
      });

      // Calculate credit score
      await loanApplication.calculateCreditScore();

      // Determine interest rate based on credit score and risk
      const interestRate = this.calculateInterestRate(loanApplication.credit_score, loanApplication.risk_assessment);

      loanApplication.interest_rate = interestRate;
      loanApplication.interestRate = interestRate; // Backward compatibility

      // Calculate loan terms
      const loanTerms = loanApplication.calculateLoanTerms();

      await loanApplication.save();

      // Auto-submit to best loan provider
      const submissionResult = await this.submitToLoanProvider(loanApplication);

      return {
        success: true,
        applicationId: loanApplication._id,
        credit_score: loanApplication.credit_score,
        risk_assessment: loanApplication.risk_assessment,
        interest_rate: interestRate,
        loan_terms: loanTerms,
        provider_submission: submissionResult
      };

    } catch (error) {
      console.error('Loan application submission error:', error);
      throw new Error(`Failed to submit loan application: ${error.message}`);
    }
  }

  /**
   * Calculate interest rate based on credit score and risk
   */
  calculateInterestRate(creditScore, riskAssessment) {
    let baseRate = 15; // Base 15% APR

    // Adjust based on credit score
    if (creditScore >= 750) baseRate -= 5; // Low risk
    else if (creditScore >= 600) baseRate -= 2; // Medium risk
    else if (creditScore >= 450) baseRate += 2; // High risk
    else baseRate += 5; // Very high risk

    // Adjust based on risk assessment
    switch (riskAssessment) {
      case 'low': baseRate -= 3; break;
      case 'medium': break;
      case 'high': baseRate += 3; break;
      case 'very_high': baseRate += 6; break;
    }

    // Ensure rate is within reasonable bounds
    return Math.max(5, Math.min(50, baseRate)); // 5% to 50% APR
  }

  /**
   * Submit loan application to loan provider
   */
  async submitToLoanProvider(loanApplication) {
    try {
      // Find best matching loan provider
      const provider = this.findBestLoanProvider(loanApplication);

      if (!provider) {
        return { submitted: false, reason: 'No suitable loan provider found' };
      }

      // Prepare provider-specific data
      const providerData = this.prepareProviderData(loanApplication, provider);

      // Submit to provider API
      const submissionResult = await this.submitToProviderAPI(provider, providerData);

      if (submissionResult.success) {
        // Update loan application with provider data
        loanApplication.provider_id = submissionResult.providerApplicationId;
        loanApplication.provider_data = submissionResult.providerData;
        await loanApplication.save();

        return {
          submitted: true,
          provider: provider.name,
          application_id: submissionResult.providerApplicationId,
          status: submissionResult.status
        };
      } else {
        return {
          submitted: false,
          provider: provider.name,
          reason: submissionResult.error
        };
      }

    } catch (error) {
      console.error('Provider submission error:', error);
      return { submitted: false, reason: error.message };
    }
  }

  /**
   * Find best loan provider for the application
   */
  findBestLoanProvider(loanApplication) {
    const { amount, term_months, currency, credit_score, purpose } = loanApplication;

    for (const [key, provider] of Object.entries(loanProviders)) {
      // Check if provider supports the currency
      if (!provider.supported_currencies.includes(currency)) continue;

      // Check amount limits
      if (amount < provider.min_amount || amount > provider.max_amount) continue;

      // Check term limits
      if (term_months > provider.max_term) continue;

      // Agricultural Finance Corporation has special requirements
      if (key === 'agricultural_finance') {
        if (!loanApplication.farm_size || !loanApplication.crop_type) continue;
        if (purpose !== 'seeds' && purpose !== 'fertilizer' && purpose !== 'equipment') continue;
      }

      // Prefer providers based on credit score
      if (credit_score >= 700 && provider.interest_rate <= 20) return provider;
      if (credit_score >= 600 && provider.interest_rate <= 25) return provider;
      if (credit_score >= 500) return provider;
    }

    return null;
  }

  /**
   * Prepare data for specific loan provider
   */
  prepareProviderData(loanApplication, provider) {
    const baseData = {
      applicant_id: loanApplication.user.toString(),
      amount: loanApplication.amount,
      currency: loanApplication.currency,
      term_months: loanApplication.term_months,
      interest_rate: loanApplication.interest_rate,
      purpose: loanApplication.purpose,
      credit_score: loanApplication.credit_score,
      risk_level: loanApplication.risk_assessment
    };

    // Add provider-specific fields
    if (provider.name.includes('Agricultural Finance')) {
      return {
        ...baseData,
        farm_size: loanApplication.farm_size,
        crop_types: loanApplication.crop_type,
        expected_yield: loanApplication.expected_yield,
        farming_experience: loanApplication.farming_experience_years,
        collateral_type: loanApplication.collateral?.type || 'none'
      };
    }

    return baseData;
  }

  /**
   * Submit to provider API
   */
  async submitToProviderAPI(provider, data) {
    try {
      // This is a placeholder - actual implementation would integrate with real APIs
      const response = await axios.post(`${provider.api_url}/applications`, data, {
        headers: {
          'Authorization': `Bearer ${provider.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        providerApplicationId: response.data.application_id,
        status: response.data.status,
        providerData: response.data
      };

    } catch (error) {
      console.error(`Provider API error for ${provider.name}:`, error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get loan application status
   */
  async getLoanStatus(userId, applicationId) {
    try {
      const loanApplication = await LoanApplication.findOne({
        _id: applicationId,
        user: userId
      });

      if (!loanApplication) {
        throw new Error('Loan application not found');
      }

      // If we have provider data, check with provider
      if (loanApplication.provider_id) {
        const providerStatus = await this.checkProviderStatus(loanApplication);
        if (providerStatus) {
          loanApplication.status = this.mapProviderStatus(providerStatus);
          await loanApplication.save();
        }
      }

      return {
        applicationId: loanApplication._id,
        status: loanApplication.status,
        amount: loanApplication.amount,
        approvedAmount: loanApplication.approvedAmount,
        interest_rate: loanApplication.interest_rate,
        monthly_payment: loanApplication.monthly_payment,
        outstanding_balance: loanApplication.outstanding_balance,
        next_payment_date: loanApplication.next_payment_date,
        progress_percentage: loanApplication.progress_percentage,
        days_past_due: loanApplication.days_past_due,
        credit_score: loanApplication.credit_score,
        risk_assessment: loanApplication.risk_assessment
      };

    } catch (error) {
      console.error('Get loan status error:', error);
      throw error;
    }
  }

  /**
   * Check status with loan provider
   */
  async checkProviderStatus(loanApplication) {
    try {
      const provider = this.findProviderByApplication(loanApplication);
      if (!provider) return null;

      const response = await axios.get(
        `${provider.api_url}/applications/${loanApplication.provider_id}`,
        {
          headers: {
            'Authorization': `Bearer ${provider.api_key}`
          }
        }
      );

      return response.data.status;

    } catch (error) {
      console.error('Provider status check error:', error);
      return null;
    }
  }

  /**
   * Find provider by application data
   */
  findProviderByApplication(loanApplication) {
    // This would match based on provider_data or provider_id
    // For now, return the first matching provider
    return Object.values(loanProviders)[0];
  }

  /**
   * Map provider status to internal status
   */
  mapProviderStatus(providerStatus) {
    const statusMap = {
      'pending': 'under_review',
      'approved': 'approved',
      'rejected': 'rejected',
      'disbursed': 'disbursed',
      'active': 'active',
      'completed': 'completed',
      'defaulted': 'defaulted'
    };

    return statusMap[providerStatus] || providerStatus;
  }

  /**
   * Make loan repayment
   */
  async makeLoanRepayment(userId, applicationId, amount, paymentMethod = 'wallet') {
    try {
      const loanApplication = await LoanApplication.findOne({
        _id: applicationId,
        user: userId,
        status: { $in: ['disbursed', 'active', 'repaying'] }
      });

      if (!loanApplication) {
        throw new Error('Active loan not found');
      }

      // Process payment based on method
      if (paymentMethod === 'wallet') {
        await walletService.debitWallet(userId, amount, `Loan repayment for ${applicationId}`);
      } else if (paymentMethod === 'mpesa') {
        // Handle M-Pesa payment
        // This would integrate with M-Pesa payment flow
      }

      // Record payment
      const payment = await loanApplication.makePayment(amount, 'scheduled', `REPAY_${Date.now()}`);

      return {
        success: true,
        payment: payment,
        remaining_balance: loanApplication.outstanding_balance,
        next_payment_date: loanApplication.next_payment_date
      };

    } catch (error) {
      console.error('Loan repayment error:', error);
      throw error;
    }
  }

  /**
   * Get user's loan applications
   */
  async getUserLoans(userId, status = null) {
    try {
      const filter = { user: userId };
      if (status) {
        filter.status = status;
      }

      const loans = await LoanApplication.find(filter)
        .sort({ createdAt: -1 })
        .select('-provider_data'); // Exclude sensitive provider data

      return loans.map(loan => ({
        id: loan._id,
        amount: loan.amount,
        approvedAmount: loan.approvedAmount,
        status: loan.status,
        interest_rate: loan.interest_rate,
        monthly_payment: loan.monthly_payment,
        outstanding_balance: loan.outstanding_balance,
        next_payment_date: loan.next_payment_date,
        progress_percentage: loan.progress_percentage,
        days_past_due: loan.days_past_due,
        purpose: loan.purpose,
        createdAt: loan.createdAt
      }));

    } catch (error) {
      console.error('Get user loans error:', error);
      throw error;
    }
  }

  /**
   * Get loan repayment schedule
   */
  async getRepaymentSchedule(userId, applicationId) {
    try {
      const loanApplication = await LoanApplication.findOne({
        _id: applicationId,
        user: userId
      });

      if (!loanApplication) {
        throw new Error('Loan application not found');
      }

      const schedule = [];
      const startDate = loanApplication.disbursement_date || loanApplication.disbursedAt;
      let balance = loanApplication.amount;

      for (let i = 0; i < loanApplication.term_months; i++) {
        const paymentDate = new Date(startDate);
        paymentDate.setMonth(paymentDate.getMonth() + i + 1);

        const principal = Math.round(loanApplication.monthly_payment * (balance / loanApplication.total_payable));
        const interest = loanApplication.monthly_payment - principal;

        balance -= principal;

        // Check if payment is made
        const paymentMade = loanApplication.payments.find(p =>
          p.date.getMonth() === paymentDate.getMonth() &&
          p.date.getFullYear() === paymentDate.getFullYear()
        );

        schedule.push({
          payment_number: i + 1,
          due_date: paymentDate,
          amount_due: loanApplication.monthly_payment,
          principal,
          interest,
          balance_after: Math.max(0, balance),
          status: paymentMade ? 'paid' : 'pending',
          payment_date: paymentMade?.date
        });
      }

      return {
        loan_id: applicationId,
        total_amount: loanApplication.amount,
        interest_rate: loanApplication.interest_rate,
        term_months: loanApplication.term_months,
        monthly_payment: loanApplication.monthly_payment,
        schedule
      };

    } catch (error) {
      console.error('Get repayment schedule error:', error);
      throw error;
    }
  }

  /**
   * Process loan disbursement
   */
  async processLoanDisbursement(applicationId) {
    try {
      const loanApplication = await LoanApplication.findById(applicationId);

      if (!loanApplication || loanApplication.status !== 'approved') {
        throw new Error('Loan application not found or not approved');
      }

      // Credit loan amount to user wallet
      const disbursementAmount = loanApplication.approvedAmount || loanApplication.amount;

      await walletService.creditWallet(
        loanApplication.user,
        disbursementAmount,
        `Loan disbursement for ${applicationId}`,
        `DISBURSE_${applicationId}`
      );

      // Update loan status
      loanApplication.status = 'disbursed';
      loanApplication.disbursement_date = new Date();
      loanApplication.disbursedAt = new Date(); // Backward compatibility
      loanApplication.outstanding_balance = disbursementAmount;
      loanApplication.remainingBalance = disbursementAmount;

      await loanApplication.save();

      return {
        success: true,
        disbursed_amount: disbursementAmount,
        disbursement_date: loanApplication.disbursement_date
      };

    } catch (error) {
      console.error('Loan disbursement error:', error);
      throw error;
    }
  }
}

module.exports = new MicroLoansService();
