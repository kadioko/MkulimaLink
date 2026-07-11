/**
 * Analytics Events System for MkulimaLink
 * Tracks user behavior and business metrics
 */

const EventEmitter = require('events');

class Analytics extends EventEmitter {
  constructor() {
    super();
    this.events = [];
    this.maxQueueSize = 100;
    this.flushInterval = 30000; // 30 seconds
    
    // Start flush interval
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  /**
   * Track an analytics event
   * @param {string} eventName - Name of the event
   * @param {Object} properties - Event properties
   * @param {Object} user - User object (optional)
   */
  track(eventName, properties = {}, user = null) {
    const event = {
      event: eventName,
      timestamp: new Date().toISOString(),
      properties: {
        ...properties,
        platform: 'web',
        version: process.env.npm_package_version || '2.0.0'
      }
    };

    if (user) {
      event.userId = user._id?.toString();
      event.userProperties = {
        role: user.role,
        region: user.location?.region,
        isPremium: user.isPremium
      };
    }

    this.events.push(event);
    this.emit('event', event);

    // Auto-flush if queue is full
    if (this.events.length >= this.maxQueueSize) {
      this.flush();
    }

    return event;
  }

  /**
   * Track page view
   */
  pageView(path, user = null) {
    return this.track('page_view', { path }, user);
  }

  /**
   * Track user registration
   */
  userRegistered(user) {
    return this.track('user_registered', {
      role: user.role,
      region: user.location?.region,
      referralCode: user.referredBy ? true : false
    }, user);
  }

  /**
   * Track user login
   */
  userLoggedIn(user, method = 'email') {
    return this.track('user_logged_in', { method }, user);
  }

  /**
   * Track product listing created
   */
  productListed(product, user) {
    return this.track('product_listed', {
      productId: product._id?.toString(),
      category: product.category,
      price: product.price,
      region: product.location?.region
    }, user);
  }

  /**
   * Track product view
   */
  productViewed(product, user = null) {
    return this.track('product_viewed', {
      productId: product._id?.toString(),
      category: product.category,
      sellerId: product.seller?.toString()
    }, user);
  }

  /**
   * Track search performed
   */
  searchPerformed(query, resultsCount, filters = {}, user = null) {
    return this.track('search_performed', {
      query,
      resultsCount,
      filters
    }, user);
  }

  /**
   * Track transaction created
   */
  transactionCreated(transaction, user) {
    return this.track('transaction_created', {
      transactionId: transaction._id?.toString(),
      amount: transaction.totalPrice,
      quantity: transaction.quantity,
      productCategory: transaction.product?.category
    }, user);
  }

  /**
   * Track transaction completed
   */
  transactionCompleted(transaction, user) {
    return this.track('transaction_completed', {
      transactionId: transaction._id?.toString(),
      amount: transaction.totalPrice,
      commission: transaction.commission
    }, user);
  }

  /**
   * Track payment initiated
   */
  paymentInitiated(amount, method, user) {
    return this.track('payment_initiated', {
      amount,
      method
    }, user);
  }

  /**
   * Track payment completed
   */
  paymentCompleted(amount, method, user) {
    return this.track('payment_completed', {
      amount,
      method
    }, user);
  }

  /**
   * Track loan application
   */
  loanApplied(loan, user) {
    return this.track('loan_applied', {
      loanId: loan._id?.toString(),
      amount: loan.amount,
      purpose: loan.purpose,
      term: loan.term
    }, user);
  }

  /**
   * Track loan approved
   */
  loanApproved(loan, user) {
    return this.track('loan_approved', {
      loanId: loan._id?.toString(),
      amount: loan.amount,
      creditScore: loan.creditScore
    }, user);
  }

  /**
   * Track insurance purchased
   */
  insurancePurchased(policy, user) {
    return this.track('insurance_purchased', {
      policyId: policy._id?.toString(),
      type: policy.type,
      premium: policy.premium,
      coverage: policy.coverage
    }, user);
  }

  /**
   * Track group buy joined
   */
  groupBuyJoined(groupBuy, quantity, user) {
    return this.track('group_buy_joined', {
      groupBuyId: groupBuy._id?.toString(),
      quantity,
      productCategory: groupBuy.product?.category
    }, user);
  }

  /**
   * Track equipment booked
   */
  equipmentBooked(booking, user) {
    return this.track('equipment_booked', {
      bookingId: booking._id?.toString(),
      equipmentCategory: booking.equipment?.category,
      duration: booking.period?.duration,
      amount: booking.pricing?.total
    }, user);
  }

  /**
   * Track chat started
   */
  chatStarted(chatId, user) {
    return this.track('chat_started', { chatId: chatId?.toString() }, user);
  }

  /**
   * Track message sent
   */
  messageSent(chatId, user) {
    return this.track('message_sent', { chatId: chatId?.toString() }, user);
  }

  /**
   * Track premium upgrade
   */
  premiumUpgraded(plan, user) {
    return this.track('premium_upgraded', {
      plan,
      price: plan === 'yearly' ? 100000 : 10000
    }, user);
  }

  /**
   * Track feature used
   */
  featureUsed(featureName, user = null) {
    return this.track('feature_used', { feature: featureName }, user);
  }

  /**
   * Track error occurred
   */
  errorOccurred(error, context = {}, user = null) {
    return this.track('error_occurred', {
      errorType: error.name,
      errorMessage: error.message,
      ...context
    }, user);
  }

  /**
   * Flush events to storage/external service
   */
  async flush() {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];
    this.events = [];

    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] Flushing ${eventsToFlush.length} events`);
      }

      // TODO: Send to external analytics service
      // await this.sendToMixpanel(eventsToFlush);
      // await this.sendToGoogleAnalytics(eventsToFlush);
      // await this.sendToAmplitude(eventsToFlush);

      // Store in database for internal analytics
      if (global.AnalyticsEvent) {
        await global.AnalyticsEvent.insertMany(eventsToFlush);
      }

      this.emit('flush', eventsToFlush.length);
    } catch (error) {
      // Re-add events on failure
      this.events = [...eventsToFlush, ...this.events];
      console.error('[Analytics] Flush failed:', error.message);
    }
  }

  /**
   * Get analytics summary
   */
  getSummary() {
    return {
      queuedEvents: this.events.length,
      maxQueueSize: this.maxQueueSize,
      flushInterval: this.flushInterval
    };
  }

  /**
   * Shutdown analytics
   */
  shutdown() {
    clearInterval(this.flushTimer);
    return this.flush();
  }
}

// Singleton instance
const analytics = new Analytics();

module.exports = analytics;



