import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AuditLog from '../models/AuditLog.js';

/**
 * Script to view audit logs
 * Usage: node scripts/viewAuditLogs.js [filter]
 * Examples:
 *   node scripts/viewAuditLogs.js               (shows all recent logs)
 *   node scripts/viewAuditLogs.js failed        (shows only failed logins)
 *   node scripts/viewAuditLogs.js success       (shows only successful logins)
 *   node scripts/viewAuditLogs.js ip            (shows logs grouped by IP)
 */

dotenv.config();

const viewAuditLogs = async () => {
  try {
    const filter = process.argv[2] || 'all';

    console.log('\n📊 Audit Log Viewer');
    console.log('==========================================\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    let query = {};
    let title = 'All Recent Audit Logs';

    switch (filter.toLowerCase()) {
      case 'failed':
        query = { eventType: 'login_failed' };
        title = 'Failed Login Attempts';
        break;
      case 'success':
        query = { eventType: 'login_success' };
        title = 'Successful Logins';
        break;
      case 'customer':
        query = { userType: 'customer' };
        title = 'Customer Activity';
        break;
      case 'employee':
        query = { userType: 'employee' };
        title = 'Employee Activity';
        break;
      case 'warning':
        query = { severity: 'warning' };
        title = 'Warning Level Events';
        break;
      case 'critical':
        query = { severity: 'critical' };
        title = 'Critical Events';
        break;
    }

    if (filter === 'ip') {
      console.log('📍 Failed Login Attempts by IP Address');
      console.log('==========================================\n');

      const ipStats = await AuditLog.aggregate([
        { $match: { eventType: 'login_failed' } },
        {
          $group: {
            _id: '$ipAddress',
            count: { $sum: 1 },
            usernames: { $addToSet: '$username' },
            lastAttempt: { $max: '$timestamp' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      if (ipStats.length === 0) {
        console.log('No failed login attempts found.\n');
      } else {
        ipStats.forEach((stat, index) => {
          console.log(`${index + 1}. IP Address: ${stat._id}`);
          console.log(`   Failed Attempts: ${stat.count}`);
          console.log(`   Usernames Tried: ${stat.usernames.join(', ')}`);
          console.log(`   Last Attempt: ${new Date(stat.lastAttempt).toLocaleString()}`);
          console.log('');
        });
      }
    } else if (filter === 'stats') {
      console.log('📈 Audit Log Statistics');
      console.log('==========================================\n');

      const stats = await AuditLog.aggregate([
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const totalLogs = await AuditLog.countDocuments();
      const last24h = await AuditLog.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      console.log(`Total Audit Logs: ${totalLogs}`);
      console.log(`Last 24 Hours: ${last24h}\n`);

      console.log('Event Type Breakdown:');
      stats.forEach(stat => {
        const percentage = ((stat.count / totalLogs) * 100).toFixed(1);
        console.log(`  ${stat._id}: ${stat.count} (${percentage}%)`);
      });
      console.log('');

      // Suspicious activity check
      const suspiciousIPs = await AuditLog.aggregate([
        {
          $match: {
            eventType: 'login_failed',
            timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$ipAddress',
            count: { $sum: 1 }
          }
        },
        { $match: { count: { $gte: 3 } } },
        { $sort: { count: -1 } }
      ]);

      if (suspiciousIPs.length > 0) {
        console.log('⚠️  Suspicious Activity Detected (3+ failures in 15 min):');
        suspiciousIPs.forEach(ip => {
          console.log(`  ${ip._id}: ${ip.count} failed attempts`);
        });
        console.log('');
      }
    } else {
      console.log(`${title}`);
      console.log('==========================================\n');

      const logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .limit(50);

      if (logs.length === 0) {
        console.log('No audit logs found.\n');
      } else {
        logs.forEach((log, index) => {
          const icon = getEventIcon(log.eventType, log.severity);
          const time = new Date(log.timestamp).toLocaleString();

          console.log(`${index + 1}. ${icon} ${log.eventType.toUpperCase()}`);
          console.log(`   Time: ${time}`);
          console.log(`   User: ${log.username} (${log.userType})`);
          console.log(`   IP: ${log.ipAddress}`);
          if (log.failureReason) {
            console.log(`   Reason: ${log.failureReason}`);
          }
          console.log(`   Message: ${log.message}`);
          console.log(`   Severity: ${log.severity}`);
          console.log('');
        });

        console.log(`Showing ${logs.length} most recent entries.`);
        console.log(`Total matching logs: ${await AuditLog.countDocuments(query)}\n`);
      }
    }

    console.log('📚 Available Filters:');
    console.log('  node scripts/viewAuditLogs.js failed    - Failed login attempts');
    console.log('  node scripts/viewAuditLogs.js success   - Successful logins');
    console.log('  node scripts/viewAuditLogs.js customer  - Customer activity');
    console.log('  node scripts/viewAuditLogs.js employee  - Employee activity');
    console.log('  node scripts/viewAuditLogs.js warning   - Warning level events');
    console.log('  node scripts/viewAuditLogs.js critical  - Critical events');
    console.log('  node scripts/viewAuditLogs.js ip        - Group by IP address');
    console.log('  node scripts/viewAuditLogs.js stats     - Statistics overview\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error viewing audit logs:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

function getEventIcon(eventType, severity) {
  if (severity === 'critical') return '🚨';
  if (severity === 'warning') return '⚠️';

  switch (eventType) {
    case 'login_failed': return '❌';
    case 'login_success': return '✅';
    case 'registration_success': return '🎉';
    case 'account_locked': return '🔒';
    case 'suspicious_activity': return '🚨';
    default: return 'ℹ️';
  }
}

viewAuditLogs();
