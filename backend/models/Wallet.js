/**
 * Wallet Model
 * Digital wallet for users to store funds and make payments
 */

const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['credit', 'debit', 'transfer', 'fee', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'KES',
    enum: ['KES', 'UGX', 'TZS', 'RWF']
  },
  balance_before: {
    type: Number,
    required: true,
    min: 0
  },
  balance_after: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    maxlength: 255
  },
  reference: {
    type: String,
    unique: true,
    sparse: true
  },
  related_transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  payment_method: {
    type: String,
    enum: ['mpesa', 'airtel', 'card', 'bank_transfer', 'wallet_transfer']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'KES',
    enum: ['KES', 'UGX', 'TZS', 'RWF']
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active'
  },
  pin: {
    type: String,
    select: false // Don't include in queries by default
  },
  pin_attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  pin_locked_until: {
    type: Date,
    default: null
  },
  daily_limit: {
    type: Number,
    default: 50000 // KES 50,000 per day
  },
  daily_used: {
    type: Number,
    default: 0
  },
  monthly_limit: {
    type: Number,
    default: 1000000 // KES 1,000,000 per month
  },
  monthly_used: {
    type: Number,
    default: 0
  },
  kyc_verified: {
    type: Boolean,
    default: false
  },
  auto_topup: {
    enabled: {
      type: Boolean,
      default: false
    },
    threshold: {
      type: Number,
      default: 1000 // Auto top-up when balance drops below KES 1,000
    },
    amount: {
      type: Number,
      default: 5000 // Top-up with KES 5,000
    },
    payment_method: {
      type: String,
      enum: ['mpesa', 'airtel'],
      default: 'mpesa'
    }
  },
  notifications: {
    low_balance: {
      type: Boolean,
      default: true
    },
    transaction_alerts: {
      type: Boolean,
      default: true
    },
    weekly_summary: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes
walletSchema.index({ user: 1 });
walletSchema.index({ status: 1 });
walletSchema.index({ balance: 1 });
walletSchema.index({ createdAt: 1 });

// Virtual for available balance (considering limits)
walletSchema.virtual('available_balance').get(function() {
  const dailyRemaining = Math.max(0, this.daily_limit - this.daily_used);
  const monthlyRemaining = Math.max(0, this.monthly_limit - this.monthly_used);
  return Math.min(this.balance, dailyRemaining, monthlyRemaining);
});

// Method to add transaction
walletSchema.methods.addTransaction = async function(transactionData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { type, amount, description, reference, payment_method, metadata } = transactionData;

    // Calculate new balance
    let newBalance = this.balance;
    if (type === 'credit') {
      newBalance += amount;
    } else if (type === 'debit') {
      if (newBalance < amount) {
        throw new Error('Insufficient wallet balance');
      }
      newBalance -= amount;
    }

    // Check limits for debits
    if (type === 'debit') {
      const dailyRemaining = this.daily_limit - this.daily_used;
      const monthlyRemaining = this.monthly_limit - this.monthly_used;

      if (amount > dailyRemaining) {
        throw new Error('Daily transaction limit exceeded');
      }
      if (amount > monthlyRemaining) {
        throw new Error('Monthly transaction limit exceeded');
      }
    }

    // Create transaction record
    const transaction = new WalletTransaction({
      type,
      amount,
      currency: this.currency,
      balance_before: this.balance,
      balance_after: newBalance,
      description,
      reference,
      payment_method,
      metadata
    });

    // Update wallet
    this.balance = newBalance;
    if (type === 'debit') {
      this.daily_used += amount;
      this.monthly_used += amount;
    }

    await transaction.save({ session });
    await this.save({ session });

    await session.commitTransaction();
    return transaction;

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Method to verify PIN
walletSchema.methods.verifyPin = async function(pin) {
  // Check if PIN is locked
  if (this.pin_locked_until && this.pin_locked_until > new Date()) {
    throw new Error('PIN is temporarily locked due to too many failed attempts');
  }

  if (this.pin !== pin) {
    this.pin_attempts += 1;

    if (this.pin_attempts >= 5) {
      // Lock PIN for 30 minutes
      this.pin_locked_until = new Date(Date.now() + 30 * 60 * 1000);
      this.pin_attempts = 0;
    }

    await this.save();
    throw new Error('Invalid PIN');
  }

  // Reset attempts on successful verification
  this.pin_attempts = 0;
  await this.save();
  return true;
};

// Method to reset daily/monthly limits
walletSchema.methods.resetLimits = async function() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Check if it's a new day
  if (this.updatedAt < startOfDay) {
    this.daily_used = 0;
  }

  // Check if it's a new month
  if (this.updatedAt < startOfMonth) {
    this.monthly_used = 0;
  }

  await this.save();
};

// Static method to get wallet by user
walletSchema.statics.getByUser = async function(userId) {
  let wallet = await this.findOne({ user: userId });

  if (!wallet) {
    wallet = new this({ user: userId });
    await wallet.save();
  }

  // Reset limits if needed
  await wallet.resetLimits();

  return wallet;
};

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = { Wallet, WalletTransaction };
