import mongoose from 'mongoose';

/**
 * Audit Log Model
 * Tracks security events, especially failed login attempts
 * Helps detect brute force attacks and suspicious activity
 */
const auditLogSchema = new mongoose.Schema({
  // Event type (login_failed, login_success, etc.)
  eventType: {
    type: String,
    required: true,
    enum: [
      'login_failed',
      'login_success',
      'registration_success',
      'account_locked',
      'suspicious_activity',
      'password_reset',
      'unauthorized_access'
    ],
    index: true
  },

  // User information
  userType: {
    type: String,
    enum: ['customer', 'employee', 'unknown'],
    required: true
  },

  username: {
    type: String,
    default: 'unknown'
  },

  accountNumber: {
    type: String,
    default: null
  },

  // Request information
  ipAddress: {
    type: String,
    required: true,
    index: true
  },

  userAgent: {
    type: String,
    default: 'unknown'
  },

  // Details about the event
  message: {
    type: String,
    required: true
  },

  failureReason: {
    type: String,
    default: null
  },

  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Severity level
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
    index: true
  },

  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for querying recent failed attempts by IP
auditLogSchema.index({ ipAddress: 1, eventType: 1, timestamp: -1 });

// Index for querying failed attempts by username
auditLogSchema.index({ username: 1, eventType: 1, timestamp: -1 });

// TTL index - automatically delete logs older than 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

/**
 * Static method to log a failed login attempt
 */
auditLogSchema.statics.logFailedLogin = async function(data) {
  try {
    await this.create({
      eventType: 'login_failed',
      userType: data.userType || 'unknown',
      username: data.username || 'unknown',
      accountNumber: data.accountNumber || null,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent || 'unknown',
      message: `Failed login attempt for ${data.userType}: ${data.username || data.accountNumber}`,
      failureReason: data.failureReason,
      severity: 'warning',
      metadata: data.metadata || {}
    });
  } catch (error) {
    console.error('Error logging failed login:', error);
  }
};

/**
 * Static method to log a successful login
 */
auditLogSchema.statics.logSuccessfulLogin = async function(data) {
  try {
    await this.create({
      eventType: 'login_success',
      userType: data.userType || 'unknown',
      username: data.username,
      accountNumber: data.accountNumber || null,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent || 'unknown',
      message: `Successful login for ${data.userType}: ${data.username}`,
      severity: 'info',
      metadata: data.metadata || {}
    });
  } catch (error) {
    console.error('Error logging successful login:', error);
  }
};

/**
 * Static method to get failed login attempts by IP
 */
auditLogSchema.statics.getFailedAttemptsByIP = async function(ipAddress, timeWindowMinutes = 30) {
  const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  return await this.find({
    ipAddress,
    eventType: 'login_failed',
    timestamp: { $gte: cutoffTime }
  }).sort({ timestamp: -1 });
};

/**
 * Static method to get failed login attempts by username
 */
auditLogSchema.statics.getFailedAttemptsByUsername = async function(username, timeWindowMinutes = 30) {
  const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  return await this.find({
    username,
    eventType: 'login_failed',
    timestamp: { $gte: cutoffTime }
  }).sort({ timestamp: -1 });
};

/**
 * Static method to check for suspicious activity
 * Returns true if there are too many failed attempts
 */
auditLogSchema.statics.checkSuspiciousActivity = async function(ipAddress, threshold = 5, timeWindowMinutes = 15) {
  const failedAttempts = await this.getFailedAttemptsByIP(ipAddress, timeWindowMinutes);
  return failedAttempts.length >= threshold;
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
