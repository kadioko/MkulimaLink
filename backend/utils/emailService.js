const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const { compile } = require('handlebars');

/**
 * Email Service for MkulimaLink
 * Handles transactional emails with beautiful templates
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.isConfigured = false;
    this.init();
  }

  /**
   * Initialize email transporter
   */
  async init() {
    try {
      // Configure transporter based on environment
      if (process.env.NODE_ENV === 'production') {
        // Production - Use AWS SES or SendGrid
        this.transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
          port: process.env.EMAIL_PORT || 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
      } else {
        // Development - Use Ethereal for testing
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('📧 Email service configured for development');
        console.log('🔗 Ethereal URL: https://ethereal.email/messages');
      }

      // Load email templates
      await this.loadTemplates();
      this.isConfigured = true;
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Load email templates
   */
  async loadTemplates() {
    const templatesDir = path.join(__dirname, '../templates/email');
    
    try {
      const files = await fs.readdir(templatesDir);
      
      for (const file of files) {
        if (file.endsWith('.html')) {
          const templateName = path.basename(file, '.html');
          const templateContent = await fs.readFile(path.join(templatesDir, file), 'utf8');
          this.templates.set(templateName, compile(templateContent));
        }
      }
      
      console.log(`✅ Loaded ${this.templates.size} email templates`);
    } catch (error) {
      console.error('Failed to load email templates:', error);
    }
  }

  /**
   * Send email
   */
  async sendEmail(options) {
    if (!this.isConfigured) {
      console.warn('Email service not configured');
      return false;
    }

    try {
      const { to, subject, template, data, attachments = [] } = options;
      
      // Get template
      const templateFn = this.templates.get(template);
      if (!templateFn) {
        throw new Error(`Template not found: ${template}`);
      }

      // Compile template with data
      const html = templateFn({
        ...data,
        frontendUrl: process.env.FRONTEND_URL || 'https://mkulimalink.co.tz',
        supportEmail: 'support@mkulimalink.co.tz',
        supportPhone: '+255 712 345 678',
        year: new Date().getFullYear()
      });

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"MkulimaLink" <noreply@mkulimalink.co.tz>',
        to,
        subject,
        html,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email sent (development):', nodemailer.getTestMessageUrl(result));
      }
      
      return result;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to MkulimaLink - Start Your Agricultural Journey! 🌾',
      template: 'welcome',
      data: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  }

  /**
   * Send order confirmation
   */
  async sendOrderConfirmation(transaction) {
    return this.sendEmail({
      to: transaction.buyer.email,
      subject: `Order Confirmed - ${transaction.product.name}`,
      template: 'order-confirmation',
      data: {
        buyerName: transaction.buyer.name,
        sellerName: transaction.seller.name,
        product: transaction.product,
        quantity: transaction.quantity,
        totalPrice: transaction.totalPrice,
        transactionId: transaction._id
      }
    });
  }

  /**
   * Send order status update
   */
  async sendOrderStatusUpdate(transaction) {
    return this.sendEmail({
      to: transaction.buyer.email,
      subject: `Order Update - ${transaction.product.name}`,
      template: 'order-update',
      data: {
        buyerName: transaction.buyer.name,
        product: transaction.product,
        status: transaction.status,
        transactionId: transaction._id
      }
    });
  }

  /**
   * Send loan approval
   */
  async sendLoanApproval(loan) {
    return this.sendEmail({
      to: loan.borrower.email,
      subject: '🎉 Loan Approved - Funds Ready for Disbursement!',
      template: 'loan-approved',
      data: {
        borrowerName: loan.borrower.name,
        amount: loan.amount,
        purpose: loan.purpose,
        term: loan.term,
        interestRate: loan.interestRate,
        loanId: loan._id
      }
    });
  }

  /**
   * Send price alert
   */
  async sendPriceAlert(alert, currentPrice) {
    return this.sendEmail({
      to: alert.user.email,
      subject: `📈 Price Alert - ${alert.product.name}`,
      template: 'price-alert',
      data: {
        userName: alert.user.name,
        productName: alert.product.name,
        triggerPrice: alert.triggerPrice,
        currentPrice: currentPrice,
        triggerType: alert.triggerType
      }
    });
  }

  /**
   * Send password reset
   */
  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    return this.sendEmail({
      to: user.email,
      subject: 'Reset Your MkulimaLink Password',
      template: 'password-reset',
      data: {
        name: user.name,
        resetUrl,
        resetToken
      }
    });
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(user, verificationToken) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    return this.sendEmail({
      to: user.email,
      subject: 'Verify Your MkulimaLink Email',
      template: 'email-verification',
      data: {
        name: user.name,
        verifyUrl,
        verificationToken
      }
    });
  }

  /**
   * Send group buy update
   */
  async sendGroupBuyUpdate(groupBuy, participant) {
    return this.sendEmail({
      to: participant.email,
      subject: `👥 Group Buy Update - ${groupBuy.product.name}`,
      template: 'group-buy-update',
      data: {
        participantName: participant.name,
        productName: groupBuy.product.name,
        currentQuantity: groupBuy.currentQuantity,
        minQuantity: groupBuy.minQuantity,
        endDate: groupBuy.endDate
      }
    });
  }

  /**
   * Send delivery notification
   */
  async sendDeliveryNotification(delivery) {
    return this.sendEmail({
      to: delivery.recipient.email,
      subject: `🚚 Delivery Update - Order #${delivery.orderId}`,
      template: 'delivery-notification',
      data: {
        recipientName: delivery.recipient.name,
        orderId: delivery.orderId,
        status: delivery.status,
        estimatedDelivery: delivery.estimatedDelivery,
        trackingNumber: delivery.trackingNumber
      }
    });
  }

  /**
   * Send newsletter
   */
  async sendNewsletter(users, newsletter) {
    const results = [];
    
    for (const user of users) {
      try {
        const result = await this.sendEmail({
          to: user.email,
          subject: newsletter.subject,
          template: 'newsletter',
          data: {
            name: user.name,
            newsletter: newsletter
          }
        });
        results.push({ email: user.email, success: true, messageId: result.messageId });
      } catch (error) {
        results.push({ email: user.email, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails, options) {
    const results = [];
    const batchSize = 10; // Send 10 emails at a time
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(email => 
          this.sendEmail({ ...options, to: email })
            .then(result => ({ email, success: true, messageId: result.messageId }))
            .catch(error => ({ email, success: false, error: error.message }))
        )
      );
      
      results.push(...batchResults.map(r => r.value || r.reason));
      
      // Wait between batches to avoid rate limiting
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Verify email configuration
   */
  async verifyConnection() {
    if (!this.isConfigured) return false;
    
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email verification failed:', error);
      return false;
    }
  }
}

// Singleton instance
const emailService = new EmailService();

module.exports = emailService;
