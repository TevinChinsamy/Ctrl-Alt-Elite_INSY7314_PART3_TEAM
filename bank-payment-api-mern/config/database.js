import mongoose from 'mongoose';

/**
 * Database Connection Configuration
 * Connects to MongoDB with security best practices
 */

const connectDB = async () => {
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
      w: 'majority'
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

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
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
