import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET /api/health
 * Basic health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bank Payment API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

/**
 * GET /api/health/mongodb
 * MongoDB connection health check
 */
router.get('/mongodb', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;

    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (dbState === 1) {
      // Test actual database operation
      await mongoose.connection.db.admin().ping();

      res.json({
        success: true,
        message: 'MongoDB connection is healthy',
        status: stateMap[dbState],
        database: mongoose.connection.db.databaseName,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'MongoDB is not connected',
        status: stateMap[dbState],
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('MongoDB health check error:', error);
    res.status(503).json({
      success: false,
      message: 'MongoDB health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/status
 * Comprehensive system status
 */
router.get('/status', async (req, res) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const dbState = mongoose.connection.readyState;

    res.json({
      success: true,
      system: {
        uptime: `${Math.floor(uptime / 60)} minutes`,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
        },
        nodeVersion: process.version,
        platform: process.platform
      },
      database: {
        status: dbState === 1 ? 'connected' : 'disconnected',
        name: mongoose.connection.db?.databaseName
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: error.message
    });
  }
});

export default router;
