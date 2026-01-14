const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  borrower: { // Keep for backward compatibility
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  amount: {
    type: Number,
    required: true,
    min: 1000,
    max: 500000 // Maximum loan amount
  },
  approvedAmount: {
    type: Number
  },
  currency: {
    type: String,
    default: 'KES',
    enum: ['KES', 'UGX', 'TZS', 'RWF']
  },
  term_months: {
    type: Number,
    required: true,
    min: 1,
    max: 24
  },
  duration: { // Keep for backward compatibility
    type: Number
  },
  interest_rate: {
    type: Number,
    required: true,
    min: 0,
    max: 50
  },
  interestRate: { // Keep for backward compatibility
    type: Number
  },
  purpose: {
    type: String,
    required: true,
    enum: ['seeds', 'fertilizer', 'equipment', 'land_preparation', 'harvesting', 'labor', 'storage', 'transport', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'disbursed', 'active', 'repaying', 'completed', 'defaulted'],
    default: 'draft'
  },
  // Credit scoring
  credit_score: {
    type: Number,
    min: 0,
    max: 1000,
    default: null
  },
  creditScore: { // Keep for backward compatibility
    type: Number,
    min: 0,
    max: 100
  },
  risk_assessment: {
    type: String,
    enum: ['low', 'medium', 'high', 'very_high'],
    default: 'medium'
  },
  // Loan terms
  disbursement_date: {
    type: Date
  },
  disbursedAt: { // Keep for backward compatibility
    type: Date
  },
  first_payment_date: {
    type: Date
  },
  monthly_payment: {
    type: Number,
    default: 0
  },
  total_payable: {
    type: Number,
    default: 0
  },
  // Repayment tracking
  payments: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['scheduled', 'early', 'penalty'], default: 'scheduled' },
    reference: { type: String },
    method: { type: String } // Keep for backward compatibility
  }],
  repayments: [{ // Keep for backward compatibility
    amount: Number,
    date: Date,
    method: String,
    reference: String
  }],
  outstanding_balance: {
    type: Number,
    default: 0
  },
  remainingBalance: { // Keep for backward compatibility
    type: Number
  },
  totalRepaid: { // Keep for backward compatibility
    type: Number,
    default: 0
  },
  next_payment_date: {
    type: Date
  },
  dueDate: { // Keep for backward compatibility
    type: Date
  },
  // Collateral/security
  collateral: {
    type: {
      type: String,
      enum: ['none', 'guarantor', 'asset', 'crop_yield']
    },
    description: String,
    value: Number,
    documents: [String]
  },
  // References
  guarantors: [{
    name: String,
    phone: String,
    relationship: String,
    verified: { type: Boolean, default: false }
  }],
  guarantor: { // Keep for backward compatibility
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // External provider data
  provider_id: String,
  provider_data: mongoose.Schema.Types.Mixed,
  // Audit trail
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewed_at: Date,
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved_at: Date,
  rejected_reason: String,
  originationFee: { // Keep for backward compatibility
    type: Number,
    default: 0
  },
  // Farming context
  farm_size: Number,
  crop_type: [String],
  expected_yield: Number,
  market_price_estimate: Number,
  farming_experience_years: Number
}, {
  timestamps: true
});

// Indexes
loanApplicationSchema.index({ user: 1, status: 1 });
loanApplicationSchema.index({ borrower: 1, status: 1 }); // Keep for backward compatibility
loanApplicationSchema.index({ status: 1, createdAt: -1 });
loanApplicationSchema.index({ next_payment_date: 1 });
loanApplicationSchema.index({ dueDate: 1 }); // Keep for backward compatibility
loanApplicationSchema.index({ credit_score: -1 });
loanApplicationSchema.index({ creditScore: -1 }); // Keep for backward compatibility

// Virtual for loan progress
loanApplicationSchema.virtual('progress_percentage').get(function() {
  if (this.status === 'completed') return 100;
  if (this.status === 'disbursed' || this.status === 'active' || this.status === 'repaying') {
    const totalPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0) +
                     (this.repayments ? this.repayments.reduce((sum, payment) => sum + payment.amount, 0) : 0);
    return Math.min(100, Math.round((totalPaid / this.amount) * 100));
  }
  return 0;
});

// Virtual for days past due
loanApplicationSchema.virtual('days_past_due').get(function() {
  const dueDate = this.next_payment_date || this.dueDate;
  if (!dueDate) return 0;
  const today = new Date();
  const diffTime = today - dueDate;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Method to calculate loan terms
loanApplicationSchema.methods.calculateLoanTerms = function() {
  const principal = this.amount;
  const rate = this.interest_rate / 100 / 12; // Monthly interest rate
  const term = this.term_months;

  if (rate === 0) {
    // Interest-free loan
    this.monthly_payment = Math.round(principal / term);
    this.total_payable = principal;
  } else {
    // Calculate monthly payment using loan formula
    const monthlyPayment = principal * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
    const totalPayable = monthlyPayment * term;

    this.monthly_payment = Math.round(monthlyPayment);
    this.total_payable = Math.round(totalPayable);
  }

  this.outstanding_balance = this.amount;
  this.remainingBalance = this.amount; // Backward compatibility

  // Set first payment date (30 days after disbursement)
  if (this.disbursement_date || this.disbursedAt) {
    const disbursementDate = this.disbursement_date || this.disbursedAt;
    this.first_payment_date = new Date(disbursementDate);
    this.first_payment_date.setDate(this.first_payment_date.getDate() + 30);
    this.next_payment_date = new Date(this.first_payment_date);
    this.dueDate = new Date(this.first_payment_date); // Backward compatibility
  }

  return {
    monthly_payment: this.monthly_payment,
    total_payable: this.total_payable,
    total_interest: this.total_payable - this.amount
  };
};

// Method to make a payment
loanApplicationSchema.methods.makePayment = async function(paymentAmount, paymentType = 'scheduled', reference = null) {
  const payment = {
    amount: paymentAmount,
    date: new Date(),
    type: paymentType,
    reference: reference
  };

  // Add to new payments array
  if (!this.payments) this.payments = [];
  this.payments.push(payment);

  // Also add to repayments array for backward compatibility
  if (!this.repayments) this.repayments = [];
  this.repayments.push({
    amount: paymentAmount,
    date: payment.date,
    method: 'wallet',
    reference: reference
  });

  // Update balances
  this.outstanding_balance = Math.max(0, this.outstanding_balance - paymentAmount);
  this.remainingBalance = this.outstanding_balance;
  this.totalRepaid = (this.totalRepaid || 0) + paymentAmount;

  // Update next payment date
  if (this.next_payment_date) {
    const nextDate = new Date(this.next_payment_date);
    nextDate.setMonth(nextDate.getMonth() + 1);
    this.next_payment_date = nextDate;
    this.dueDate = nextDate; // Backward compatibility
  }

  // Check if loan is completed
  if (this.outstanding_balance <= 0) {
    this.status = 'completed';
    this.next_payment_date = null;
    this.dueDate = null;
  }

  await this.save();
  return payment;
};

// Enhanced credit scoring method
loanApplicationSchema.methods.calculateCreditScore = async function() {
  const User = mongoose.model('User');
  const Transaction = mongoose.model('Transaction');

  const user = await User.findById(this.user || this.borrower);
  const transactionHistory = await Transaction.find({
    $or: [{ buyer: this.user || this.borrower }, { seller: this.user || this.borrower }]
  }).sort({ createdAt: -1 }).limit(100);

  let score = 500; // Base score

  // Transaction history (30% weight)
  const totalTransactions = transactionHistory.length;
  const successfulTransactions = transactionHistory.filter(t => t.status === 'completed').length;
  const successRate = totalTransactions > 0 ? successfulTransactions / totalTransactions : 0;
  score += (successRate * 150); // 0-150 points

  // User profile completeness (20% weight)
  let profileScore = 0;
  if (user.phone) profileScore += 20;
  if (user.location) profileScore += 20;
  if (this.farming_experience_years) profileScore += 20;
  if (this.farm_size) profileScore += 20;
  if (user.kyc_verified) profileScore += 20;
  score += profileScore;

  // Farming experience (20% weight)
  const experience = this.farming_experience_years || 0;
  score += Math.min(100, experience * 10); // Max 100 points for 10+ years

  // Loan amount vs farm size (15% weight)
  if (this.farm_size && this.farm_size > 0) {
    const loanToFarmRatio = this.amount / (this.farm_size * 100000); // Assume 100k per acre
    if (loanToFarmRatio < 0.5) score += 75;
    else if (loanToFarmRatio < 1) score += 50;
    else if (loanToFarmRatio < 2) score += 25;
  }

  // Risk assessment (15% weight)
  if (this.collateral && this.collateral.type !== 'none') score += 75;
  if (this.guarantors && this.guarantors.length > 0) score += 50;

  // Backward compatibility - also set the old creditScore field
  this.credit_score = Math.min(1000, Math.round(score));
  this.creditScore = Math.min(100, Math.round(score / 10)); // Convert to 0-100 scale

  // Determine risk level
  if (this.credit_score >= 750) this.risk_assessment = 'low';
  else if (this.credit_score >= 600) this.risk_assessment = 'medium';
  else if (this.credit_score >= 450) this.risk_assessment = 'high';
  else this.risk_assessment = 'very_high';

  return this.credit_score;
};

const LoanApplication = mongoose.model('LoanApplication', loanApplicationSchema);

// Keep the old model name for backward compatibility
const Loan = mongoose.model('Loan', loanApplicationSchema);

// Loan provider configurations
const loanProviders = {
  kcb: {
    name: 'KCB M-Pesa Loans',
    api_url: process.env.KCB_LOANS_API_URL,
    api_key: process.env.KCB_LOANS_API_KEY,
    min_amount: 1000,
    max_amount: 100000,
    max_term: 12,
    interest_rate: 18,
    supported_currencies: ['KES']
  },
  equity: {
    name: 'Equity Bank Jenga Loans',
    api_url: process.env.EQUITY_LOANS_API_URL,
    api_key: process.env.EQUITY_LOANS_API_KEY,
    min_amount: 2000,
    max_amount: 200000,
    max_term: 24,
    interest_rate: 22,
    supported_currencies: ['KES', 'UGX', 'TZS']
  },
  agricultural_finance: {
    name: 'Agricultural Finance Corporation',
    api_url: process.env.AFC_LOANS_API_URL,
    api_key: process.env.AFC_LOANS_API_KEY,
    min_amount: 5000,
    max_amount: 500000,
    max_term: 24,
    interest_rate: 12,
    supported_currencies: ['KES'],
    requires_farm_data: true
  }
};

module.exports = { LoanApplication, Loan, loanProviders };
