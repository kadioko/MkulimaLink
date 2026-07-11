/**
 * Advanced Security Service
 * Implements zero-trust architecture, fraud detection, and compliance monitoring
 */

const crypto = require('crypto');
const { SecurityEvent, FraudAlert, ComplianceRecord, EncryptionKey } = require('../models/Security');
const { User } = require('../models');

class SecurityService {
  constructor() {
    this.riskScores = {};
    this.suspiciousPatterns = {
      rapid_transactions: { threshold: 5, timeWindow: 300 }, // 5 transactions in 5 minutes
      unusual_location: { threshold: 2 }, // 2 countries in 1 hour
      large_transaction: { threshold: 5000000 }, // 5M TZS
      failed_auth_attempts: { threshold: 5 }, // 5 failed attempts
      unusual_api_usage: { threshold: 1000 } // 1000 requests per minute
    };

    this.complianceRules = {
      aml_kyc: true,
      transaction_reporting: true,
      data_protection: true,
      sanctions_screening: true,
      audit_logging: true
    };
  }

  /**
   * Verify zero-trust access
   */
  async verifyZeroTrustAccess(userId, resource, action, context = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check 1: User identity verification
      const identityVerified = await this.verifyIdentity(user);
      if (!identityVerified) {
        await this.logSecurityEvent(userId, 'identity_verification_failed', { resource, action });
        return { allowed: false, reason: 'Identity verification failed' };
      }

      // Check 2: Device verification
      const deviceVerified = await this.verifyDevice(userId, context.deviceId);
      if (!deviceVerified) {
        await this.logSecurityEvent(userId, 'device_verification_failed', { resource, action, deviceId: context.deviceId });
        return { allowed: false, reason: 'Device not trusted' };
      }

      // Check 3: Location verification
      const locationVerified = await this.verifyLocation(userId, context.location);
      if (!locationVerified) {
        await this.logSecurityEvent(userId, 'location_verification_failed', { resource, action, location: context.location });
        return { allowed: false, reason: 'Unusual location detected' };
      }

      // Check 4: Permission verification
      const permissionVerified = await this.verifyPermission(user, resource, action);
      if (!permissionVerified) {
        await this.logSecurityEvent(userId, 'permission_denied', { resource, action });
        return { allowed: false, reason: 'Insufficient permissions' };
      }

      // Check 5: Risk assessment
      const riskScore = await this.calculateRiskScore(userId, action, context);
      if (riskScore > 80) {
        await this.logSecurityEvent(userId, 'high_risk_access_attempt', { resource, action, riskScore });
        return { allowed: false, reason: 'High risk detected', riskScore };
      }

      await this.logSecurityEvent(userId, 'access_granted', { resource, action, riskScore });
      return { allowed: true, riskScore };
    } catch (error) {
      console.error('Zero-trust verification error:', error);
      throw error;
    }
  }

  /**
   * Detect fraudulent activity
   */
  async detectFraud(userId, transactionData) {
    try {
      const fraudIndicators = [];
      let fraudScore = 0;

      // Check 1: Rapid transactions
      const recentTransactions = await this.getRecentTransactions(userId, 5);
      if (recentTransactions.length >= this.suspiciousPatterns.rapid_transactions.threshold) {
        const timeSpan = (Date.now() - recentTransactions[0].timestamp) / 1000;
        if (timeSpan < this.suspiciousPatterns.rapid_transactions.timeWindow) {
          fraudIndicators.push('rapid_transactions');
          fraudScore += 25;
        }
      }

      // Check 2: Unusual location
      const userLocations = await this.getUserLocations(userId, 1);
      if (userLocations.length > 0) {
        const lastLocation = userLocations[0];
        const distance = this.calculateDistance(lastLocation, transactionData.location);
        const timeDiff = (Date.now() - lastLocation.timestamp) / 1000 / 3600; // hours
        const speed = distance / timeDiff;
        
        if (speed > 900) { // Faster than commercial flight
          fraudIndicators.push('impossible_travel');
          fraudScore += 40;
        }
      }

      // Check 3: Large transaction
      if (transactionData.amount > this.suspiciousPatterns.large_transaction.threshold) {
        const userAvgTransaction = await this.getUserAverageTransaction(userId);
        if (transactionData.amount > userAvgTransaction * 5) {
          fraudIndicators.push('unusual_amount');
          fraudScore += 20;
        }
      }

      // Check 4: Unusual recipient
      const isKnownRecipient = await this.isKnownRecipient(userId, transactionData.recipientId);
      if (!isKnownRecipient) {
        fraudIndicators.push('unknown_recipient');
        fraudScore += 15;
      }

      // Check 5: Device mismatch
      const deviceMatches = await this.verifyDevice(userId, transactionData.deviceId);
      if (!deviceMatches) {
        fraudIndicators.push('device_mismatch');
        fraudScore += 20;
      }

      if (fraudScore > 50) {
        const alert = new FraudAlert({
          user_id: userId,
          transaction_data: transactionData,
          fraud_indicators: fraudIndicators,
          fraud_score: fraudScore,
          status: fraudScore > 75 ? 'blocked' : 'flagged'
        });

        await alert.save();

        if (fraudScore > 75) {
          await this.logSecurityEvent(userId, 'fraud_blocked', { fraudScore, indicators: fraudIndicators });
          return { allowed: false, fraudScore, reason: 'Transaction blocked due to fraud detection' };
        }

        await this.logSecurityEvent(userId, 'fraud_flagged', { fraudScore, indicators: fraudIndicators });
        return { allowed: true, fraudScore, warning: 'Transaction flagged for review' };
      }

      return { allowed: true, fraudScore };
    } catch (error) {
      console.error('Fraud detection error:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encryptSensitiveData(data, dataType = 'general') {
    try {
      const key = await this.getEncryptionKey(dataType);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key.key, 'hex'), iv);

      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: 'aes-256-gcm'
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptSensitiveData(encryptedData, dataType = 'general') {
    try {
      const key = await this.getEncryptionKey(dataType);
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(key.key, 'hex'),
        Buffer.from(encryptedData.iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  /**
   * Check compliance requirements
   */
  async checkCompliance(userId, action, data) {
    try {
      const complianceChecks = {
        aml_kyc: await this.checkAMLKYC(userId),
        transaction_reporting: await this.checkTransactionReporting(userId, data),
        data_protection: await this.checkDataProtection(userId, data),
        sanctions_screening: await this.checkSanctionsScreening(userId),
        audit_logging: true // Always log
      };

      const allCompliant = Object.values(complianceChecks).every(check => check === true);

      if (!allCompliant) {
        await this.logComplianceRecord(userId, action, complianceChecks, false);
        return { compliant: false, checks: complianceChecks };
      }

      await this.logComplianceRecord(userId, action, complianceChecks, true);
      return { compliant: true, checks: complianceChecks };
    } catch (error) {
      console.error('Compliance check error:', error);
      throw error;
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(userId, eventType, details = {}) {
    try {
      const event = new SecurityEvent({
        user_id: userId,
        event_type: eventType,
        details,
        timestamp: new Date(),
        ip_address: details.ip || 'unknown',
        user_agent: details.userAgent || 'unknown'
      });

      await event.save();
      return event;
    } catch (error) {
      console.error('Log security event error:', error);
    }
  }

  /**
   * Get security audit trail
   */
  async getAuditTrail(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const events = await SecurityEvent.find({
        user_id: userId,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: -1 });

      return events;
    } catch (error) {
      console.error('Get audit trail error:', error);
      throw error;
    }
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(userId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const events = await SecurityEvent.find({
        user_id: userId,
        timestamp: { $gte: thirtyDaysAgo }
      });

      const fraudAlerts = await FraudAlert.find({
        user_id: userId,
        created_at: { $gte: thirtyDaysAgo }
      });

      const eventsByType = {};
      for (const event of events) {
        eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
      }

      return {
        period: '30 days',
        total_events: events.length,
        events_by_type: eventsByType,
        fraud_alerts: fraudAlerts.length,
        blocked_transactions: fraudAlerts.filter(a => a.status === 'blocked').length,
        flagged_transactions: fraudAlerts.filter(a => a.status === 'flagged').length,
        security_score: this.calculateSecurityScore(events, fraudAlerts)
      };
    } catch (error) {
      console.error('Generate security report error:', error);
      throw error;
    }
  }

  // Helper methods

  async verifyIdentity(user) {
    return user.kyc_verified === true;
  }

  async verifyDevice(userId, deviceId) {
    // In production, check against registered devices
    return deviceId !== null && deviceId !== undefined;
  }

  async verifyLocation(userId, location) {
    // In production, check against user's typical locations
    return location !== null && location !== undefined;
  }

  async verifyPermission(user, resource, action) {
    // Check user role and permissions
    const permissions = {
      admin: ['read', 'write', 'delete', 'manage'],
      user: ['read', 'write'],
      viewer: ['read']
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes(action);
  }

  async calculateRiskScore(userId, action, context) {
    let score = 0;

    if (action === 'delete') score += 30;
    if (action === 'manage') score += 25;
    if (context.isNewDevice) score += 20;
    if (context.isUnusualTime) score += 15;
    if (context.isNewLocation) score += 20;

    return Math.min(score, 100);
  }

  async getRecentTransactions(userId, limit) {
    // Mock implementation - in production, query transaction database
    return [];
  }

  async getUserLocations(userId, hours) {
    // Mock implementation
    return [];
  }

  calculateDistance(loc1, loc2) {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lon - loc1.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async getUserAverageTransaction(userId) {
    // Mock implementation
    return 500000; // 500K TZS average
  }

  async isKnownRecipient(userId, recipientId) {
    // Check if recipient is in user's contact list
    return true; // Mock
  }

  async getEncryptionKey(dataType) {
    let key = await EncryptionKey.findOne({ data_type: dataType, active: true });

    if (!key) {
      const newKey = crypto.randomBytes(32).toString('hex');
      key = new EncryptionKey({
        data_type: dataType,
        key: newKey,
        algorithm: 'aes-256-gcm',
        active: true,
        created_at: new Date()
      });
      await key.save();
    }

    return key;
  }

  async checkAMLKYC(userId) {
    const user = await User.findById(userId);
    return user && user.kyc_verified === true;
  }

  async checkTransactionReporting(userId, data) {
    // Check if transaction should be reported
    return data.amount < 10000000; // Report if over 10M TZS
  }

  async checkDataProtection(userId, data) {
    // Verify data is encrypted
    return data.encrypted === true || data.encrypted === undefined;
  }

  async checkSanctionsScreening(userId) {
    // Check against sanctions list
    return true; // Mock - not on sanctions list
  }

  async logComplianceRecord(userId, action, checks, compliant) {
    try {
      const record = new ComplianceRecord({
        user_id: userId,
        action,
        compliance_checks: checks,
        compliant,
        timestamp: new Date()
      });

      await record.save();
    } catch (error) {
      console.error('Log compliance record error:', error);
    }
  }

  calculateSecurityScore(events, fraudAlerts) {
    let score = 100;

    // Deduct for security events
    score -= events.filter(e => e.event_type.includes('failed')).length * 5;

    // Deduct for fraud alerts
    score -= fraudAlerts.filter(a => a.status === 'blocked').length * 10;
    score -= fraudAlerts.filter(a => a.status === 'flagged').length * 5;

    return Math.max(score, 0);
  }
}

module.exports = new SecurityService();



