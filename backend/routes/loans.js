const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const { LoanApplication } = require('../models/Loan');
const { protect } = require('../middleware/auth');
const microLoansService = require('../services/microLoansService');

// Enhanced loan application with micro-loans service
router.post('/apply', protect, async (req, res) => {
  try {
    const {
      amount,
      purpose,
      duration,
      term_months,
      collateral,
      guarantorId,
      guarantors,
      farm_size,
      crop_type,
      expected_yield,
      farming_experience_years,
      description
    } = req.body;

    // Check for existing active loans
    const activeLoan = await LoanApplication.findOne({
      user: req.user._id,
      status: { $in: ['approved', 'disbursed', 'active', 'repaying'] }
    });

    if (activeLoan) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active loan application'
      });
    }

    // Use enhanced micro-loans service
    const applicationData = {
      amount,
      term_months: term_months || duration,
      purpose,
      description,
      collateral,
      guarantors: guarantors || (guarantorId ? [{
        name: 'Guarantor',
        phone: '',
        relationship: 'other',
        verified: false
      }] : []),
      farm_size,
      crop_type,
      expected_yield,
      farming_experience_years
    };

    const result = await microLoansService.submitLoanApplication(req.user._id, applicationData);

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      data: result
    });
  } catch (error) {
    console.error('Loan application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit loan application',
      error: error.message
    });
  }
});

// Enhanced get user's loans
router.get('/my-loans', protect, async (req, res) => {
  try {
    const status = req.query.status;

    // Get loans from both old and new models for backward compatibility
    const [newLoans, oldLoans] = await Promise.all([
      microLoansService.getUserLoans(req.user._id, status),
      Loan.find({
        borrower: req.user._id,
        ...(status && { status })
      }).sort('-createdAt').lean()
    ]);

    // Convert old loans to new format
    const convertedOldLoans = oldLoans.map(loan => ({
      id: loan._id,
      amount: loan.amount,
      approvedAmount: loan.approvedAmount,
      status: loan.status,
      interest_rate: loan.interestRate,
      monthly_payment: loan.remainingBalance ? loan.remainingBalance / loan.duration : 0,
      outstanding_balance: loan.remainingBalance,
      next_payment_date: loan.dueDate,
      progress_percentage: loan.status === 'completed' ? 100 :
        loan.totalRepaid && loan.amount ? Math.min(100, Math.round((loan.totalRepaid / loan.amount) * 100)) : 0,
      days_past_due: loan.dueDate ? Math.max(0, Math.ceil((new Date() - loan.dueDate) / (1000 * 60 * 60 * 24))) : 0,
      purpose: loan.purpose,
      createdAt: loan.createdAt,
      legacy: true // Mark as legacy format
    }));

    const allLoans = [...newLoans, ...convertedOldLoans];

    // Calculate stats
    const stats = {
      totalLoans: allLoans.length,
      activeLoans: allLoans.filter(l => ['approved', 'disbursed', 'active', 'repaying'].includes(l.status)).length,
      completedLoans: allLoans.filter(l => l.status === 'completed').length,
      totalBorrowed: allLoans.filter(l => l.status !== 'rejected').reduce((sum, l) => sum + (l.approvedAmount || l.amount || 0), 0),
      totalRepaid: allLoans.reduce((sum, l) => sum + (l.totalRepaid || (l.amount - (l.outstanding_balance || 0))), 0)
    };

    res.json({
      success: true,
      data: {
        loans: allLoans,
        stats
      }
    });
  } catch (error) {
    console.error('Get user loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loans',
      error: error.message
    });
  }
});

// Get specific loan details
router.get('/:id', protect, async (req, res) => {
  try {
    let loan;

    // Try new loan model first
    loan = await LoanApplication.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('reviewed_by', 'name').populate('approved_by', 'name');

    if (loan) {
      return res.json({
        success: true,
        data: {
          id: loan._id,
          amount: loan.amount,
          approvedAmount: loan.approvedAmount,
          status: loan.status,
          interest_rate: loan.interest_rate,
          term_months: loan.term_months,
          monthly_payment: loan.monthly_payment,
          total_payable: loan.total_payable,
          outstanding_balance: loan.outstanding_balance,
          next_payment_date: loan.next_payment_date,
          progress_percentage: loan.progress_percentage,
          days_past_due: loan.days_past_due,
          credit_score: loan.credit_score,
          risk_assessment: loan.risk_assessment,
          purpose: loan.purpose,
          description: loan.description,
          collateral: loan.collateral,
          guarantors: loan.guarantors,
          farm_size: loan.farm_size,
          crop_type: loan.crop_type,
          expected_yield: loan.expected_yield,
          farming_experience_years: loan.farming_experience_years,
          reviewed_by: loan.reviewed_by,
          reviewed_at: loan.reviewed_at,
          approved_by: loan.approved_by,
          approved_at: loan.approved_at,
          rejected_reason: loan.rejected_reason,
          createdAt: loan.createdAt,
          disbursement_date: loan.disbursement_date
        }
      });
    }

    // Try old loan model
    loan = await Loan.findOne({
      _id: req.params.id,
      borrower: req.user._id
    });

    if (loan) {
      return res.json({
        success: true,
        data: {
          id: loan._id,
          amount: loan.amount,
          approvedAmount: loan.approvedAmount,
          status: loan.status,
          interest_rate: loan.interestRate,
          term_months: loan.duration,
          monthly_payment: loan.remainingBalance ? loan.remainingBalance / loan.duration : 0,
          outstanding_balance: loan.remainingBalance,
          next_payment_date: loan.dueDate,
          progress_percentage: loan.status === 'completed' ? 100 :
            loan.totalRepaid && loan.amount ? Math.min(100, Math.round((loan.totalRepaid / loan.amount) * 100)) : 0,
          days_past_due: loan.dueDate ? Math.max(0, Math.ceil((new Date() - loan.dueDate) / (1000 * 60 * 60 * 24))) : 0,
          credit_score: loan.creditScore,
          purpose: loan.purpose,
          collateral: loan.collateral,
          createdAt: loan.createdAt,
          legacy: true
        }
      });
    }

    return res.status(404).json({
      success: false,
      message: 'Loan not found'
    });

  } catch (error) {
    console.error('Get loan details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan details',
      error: error.message
    });
  }
});

// Enhanced loan repayment
router.post('/:id/repay', protect, async (req, res) => {
  try {
    const { amount, paymentMethod, paymentReference } = req.body;

    let result;

    // Try new loan model first
    try {
      result = await microLoansService.makeLoanRepayment(
        req.user._id,
        req.params.id,
        amount,
        paymentMethod || 'wallet'
      );
    } catch (newLoanError) {
      // Try old loan model
      const loan = await Loan.findOne({
        _id: req.params.id,
        borrower: req.user._id
      });

      if (!loan) {
        return res.status(404).json({ success: false, message: 'Loan not found' });
      }

      if (loan.status === 'completed') {
        return res.status(400).json({ success: false, message: 'Loan already repaid' });
      }

      loan.repayments.push({
        amount,
        date: new Date(),
        method: paymentMethod || 'mpesa',
        reference: paymentReference
      });

      loan.totalRepaid += amount;
      loan.remainingBalance -= amount;

      if (loan.remainingBalance <= 0) {
        loan.status = 'completed';
        loan.remainingBalance = 0;
      } else {
        loan.status = 'repaying';
      }

      await loan.save();

      result = {
        payment: { amount, date: new Date() },
        remaining_balance: loan.remainingBalance,
        next_payment_date: loan.dueDate
      };
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: result
    });
  } catch (error) {
    console.error('Loan repayment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
});

// Get loan repayment schedule
router.get('/:id/schedule', protect, async (req, res) => {
  try {
    const schedule = await microLoansService.getRepaymentSchedule(req.user._id, req.params.id);

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    // If new service fails, return basic schedule for old loans
    try {
      const loan = await Loan.findOne({
        _id: req.params.id,
        borrower: req.user._id
      });

      if (loan) {
        const schedule = [{
          payment_number: 1,
          due_date: loan.dueDate,
          amount_due: loan.remainingBalance / loan.duration,
          balance_after: 0,
          status: loan.status === 'completed' ? 'paid' : 'pending'
        }];

        return res.json({
          success: true,
          data: {
            loan_id: loan._id,
            schedule
          }
        });
      }
    } catch (oldLoanError) {
      // Ignore old loan error
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch repayment schedule',
      error: error.message
    });
  }
});

// Enhanced credit score endpoint
router.get('/credit-score', protect, async (req, res) => {
  try {
    // Create temporary loan for credit scoring
    const tempLoan = new LoanApplication({
      user: req.user._id,
      amount: 100000,
      term_months: 6,
      purpose: 'seeds',
      farming_experience_years: req.body.farming_experience_years || 0,
      farm_size: req.body.farm_size || 0
    });

    const creditScore = await tempLoan.calculateCreditScore();

    const eligibility = {
      score: creditScore,
      risk_level: tempLoan.risk_assessment,
      max_loan_amount: creditScore >= 750 ? 500000 :
                      creditScore >= 600 ? 200000 :
                      creditScore >= 450 ? 100000 : 50000,
      suggested_interest_rate: creditScore >= 750 ? 12 :
                              creditScore >= 600 ? 15 :
                              creditScore >= 450 ? 18 : 22,
      eligible: creditScore >= 400,
      recommended_providers: creditScore >= 700 ? ['agricultural_finance', 'equity'] :
                            creditScore >= 600 ? ['equity', 'kcb'] :
                            ['kcb']
    };

    res.json({
      success: true,
      data: eligibility
    });
  } catch (error) {
    console.error('Credit score calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate credit score',
      error: error.message
    });
  }
});

// Get available loan products
router.get('/products/available', protect, async (req, res) => {
  try {
    const { amount, term_months } = req.query;
    const { loanProviders } = require('../models/Loan');

    // Get user's credit score for eligibility
    const tempLoan = new LoanApplication({ user: req.user._id });
    const creditScore = await tempLoan.calculateCreditScore();

    const availableProducts = Object.entries(loanProviders).map(([key, provider]) => ({
      id: key,
      name: provider.name,
      min_amount: provider.min_amount,
      max_amount: provider.max_amount,
      max_term: provider.max_term,
      interest_rate: provider.interest_rate,
      supported_currencies: provider.supported_currencies,
      requires_farm_data: provider.requires_farm_data || false,
      eligible: (!amount || (amount >= provider.min_amount && amount <= provider.max_amount)) &&
                (!term_months || term_months <= provider.max_term) &&
                creditScore >= 400 // Basic eligibility
    }));

    res.json({
      success: true,
      data: availableProducts
    });
  } catch (error) {
    console.error('Get loan products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan products',
      error: error.message
    });
  }
});

// Calculate loan terms preview
router.post('/calculate', protect, async (req, res) => {
  try {
    const { amount, term_months, interest_rate } = req.body;

    if (!amount || !term_months) {
      return res.status(400).json({
        success: false,
        message: 'Amount and term are required'
      });
    }

    // Calculate loan terms
    const rate = (interest_rate || 15) / 100 / 12; // Monthly interest rate
    const principal = amount;
    const term = term_months;

    let monthlyPayment, totalPayable;

    if (rate === 0) {
      // Interest-free loan
      monthlyPayment = Math.round(principal / term);
      totalPayable = principal;
    } else {
      // Standard loan calculation
      monthlyPayment = principal * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
      monthlyPayment = Math.round(monthlyPayment);
      totalPayable = monthlyPayment * term;
    }

    const totalInterest = totalPayable - principal;

    res.json({
      success: true,
      data: {
        amount: principal,
        term_months: term,
        interest_rate: interest_rate || 15,
        monthly_payment: monthlyPayment,
        total_payable: totalPayable,
        total_interest: totalInterest,
        interest_percentage: Math.round((totalInterest / principal) * 100)
      }
    });
  } catch (error) {
    console.error('Loan calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate loan terms',
      error: error.message
    });
  }
});

// Admin routes for loan management
router.use('/admin', protect);

// Get all loan applications (admin)
router.get('/admin/all', async (req, res) => {
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

    const loans = await LoanApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email phone')
      .populate('reviewed_by', 'name')
      .populate('approved_by', 'name');

    const total = await LoanApplication.countDocuments(filter);

    res.json({
      success: true,
      data: {
        loans,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan applications',
      error: error.message
    });
  }
});

// Review loan application (admin)
router.post('/:id/review', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { status, approved_amount, review_notes } = req.body;
    const loanApplication = await LoanApplication.findById(req.params.id);

    if (!loanApplication) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    loanApplication.status = status;
    loanApplication.reviewed_by = req.user._id;
    loanApplication.reviewed_at = new Date();

    if (status === 'approved' && approved_amount) {
      loanApplication.approvedAmount = approved_amount;
      loanApplication.approved_by = req.user._id;
      loanApplication.approved_at = new Date();
    } else if (status === 'rejected') {
      loanApplication.rejected_reason = review_notes;
    }

    await loanApplication.save();

    res.json({
      success: true,
      message: `Loan application ${status}`,
      data: {
        applicationId: loanApplication._id,
        status: loanApplication.status,
        approvedAmount: loanApplication.approvedAmount
      }
    });
  } catch (error) {
    console.error('Loan review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review loan application',
      error: error.message
    });
  }
});

// Process loan disbursement (admin)
router.post('/:id/disburse', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const result = await microLoansService.processLoanDisbursement(req.params.id);

    res.json({
      success: true,
      message: 'Loan disbursed successfully',
      data: result
    });
  } catch (error) {
    console.error('Loan disbursement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disburse loan',
      error: error.message
    });
  }
});

module.exports = router;
