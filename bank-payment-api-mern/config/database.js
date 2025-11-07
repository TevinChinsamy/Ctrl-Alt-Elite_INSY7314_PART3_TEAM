import mongoose from 'mongoose';

/**
 * Database Connection Configuration
 * Securely connects to MongoDB with CI-safe and test-friendly handling
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // Handle missing MongoDB URI gracefully
  if (!uri) {
    if (process.env.NODE_ENV === 'test' || process.env.CI) {
      console.warn('⚠️  Skipping MongoDB connection: MONGODB_URI not set (test/CI environment)');
      return;
    } else {
      console.error('❌ MongoDB connection failed: MONGODB_URI is not defined');
      process.exit(1);
    }
  }

  try {
    const options = {
      // Security options
      ssl: true,
      tls: true,
      tlsAllowInvalidCertificates: false,

      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 2,

      // Timeout settings
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,

      // Retry settings
      retryWrites: true,
      retryReads: true,

      // Write concern
      w: 'majority',
    };

    const conn = await mongoose.connect(uri, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.db.databaseName}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔒 MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    if (process.env.NODE_ENV !== 'test' && !process.env.CI) {
      process.exit(1);
    } else {
      console.warn('Skipping process.exit() in test/CI environment');
    }
  }
};

export default connectDB;
