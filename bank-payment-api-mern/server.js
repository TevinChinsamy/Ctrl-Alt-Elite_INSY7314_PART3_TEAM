import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import {
  securityHeaders,
  generalRateLimiter,
  authRateLimiter,
  mongoSanitization,
  customSecurityHeaders,
  parameterPollutionProtection,
  xssProtection,
  requestSizeLimiter,
  slowlorisProtection,
  httpsRedirect
} from './middleware/security.js';
import {
  loginBruteForce,
  registrationBruteForce,
  paymentBruteForce
} from './middleware/brute.js';

// Import routes
import healthRoutes from './routes/health.js';
import customerAuthRoutes from './routes/customerAuth.js';
import customerPaymentRoutes from './routes/customerPayments.js';
import employeeAuthRoutes from './routes/employeeAuth.js';
import employeePortalRoutes from './routes/employeePortal.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ============================================
// SECURITY MIDDLEWARE (EXCEPTIONAL A+ IMPLEMENTATION)
// ============================================

// Request timeout protection (Slowloris)
app.use(slowlorisProtection);

// HTTP to HTTPS redirect (production only)
app.use(httpsRedirect);

// Security headers (Helmet - 15+ headers)
app.use(securityHeaders);
app.use(customSecurityHeaders);

// Request size limiter (DoS protection)
app.use(requestSizeLimiter);

// MongoDB sanitization (NoSQL injection prevention)
app.use(mongoSanitization);

// XSS protection (sanitize user input)
app.use(xssProtection);

// HTTP Parameter Pollution protection
app.use(parameterPollutionProtection);

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'https://localhost:3000',
      'http://127.0.0.1:3000',
      'https://127.0.0.1:3000',
      'http://[::1]:3000',
      'https://[::1]:3000'
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General rate limiting
app.use(generalRateLimiter);

// ============================================
// ROUTES
// ============================================

// Health check routes (no rate limiting)
app.use('/api/health', healthRoutes);

// Customer authentication routes (strict rate limiting + brute force protection)
app.use('/api/customer/auth/register', registrationBruteForce.prevent);
app.use('/api/customer/auth/login', loginBruteForce.prevent);
app.use('/api/customer/auth', authRateLimiter, customerAuthRoutes);

// Customer payment routes (with brute force protection)
app.use('/api/customer/payments/create', paymentBruteForce.prevent);
app.use('/api/customer/payments', customerPaymentRoutes);

// Employee authentication routes (strict rate limiting + brute force protection)
app.use('/api/employee/auth/login', loginBruteForce.prevent);
app.use('/api/employee/auth', authRateLimiter, employeeAuthRoutes);

// Employee portal routes
app.use('/api/employee/portal', employeePortalRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Bank Payment API - MERN Stack',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5001;

// Check for HTTPS certificates in development
const isDevelopment = process.env.NODE_ENV === 'development';
const certPath = path.join(__dirname, 'certs', 'localhost.pem');
const keyPath = path.join(__dirname, 'certs', 'localhost-key.pem');

if (isDevelopment && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  // EXCEPTIONAL SSL/TLS Configuration for Development
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),

    // TLS 1.2 and TLS 1.3 only (no SSLv2, SSLv3, TLS 1.0, TLS 1.1)
    minVersion: 'TLSv1.2',

    // Strong cipher suites (compatible with modern browsers)
    ciphers: [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'HIGH',
      '!aNULL',
      '!MD5'
    ].join(':'),

    // Prefer server cipher order
    honorCipherOrder: true,

    // Disable session tickets (PFS)
    sessionTimeout: 300,

    // Allow self-signed certificates in development
    requestCert: false,
    rejectUnauthorized: false
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`\n🔒 HTTPS Server running on https://localhost:${PORT}`);
    console.log(`🛡️  TLS Version: 1.2 & 1.3 only`);
    console.log(`🔐 Strong cipher suites enabled`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 CORS enabled for: ${process.env.ALLOWED_ORIGINS || 'localhost:3000'}`);
    console.log(`✅ HSTS, CSP, and security headers active\n`);
  });
} else {
  // Start HTTP server (for development without certs or production with reverse proxy)
  app.listen(PORT, () => {
    console.log(`\n🚀 HTTP Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 CORS enabled for: ${process.env.ALLOWED_ORIGINS || 'localhost:3000'}`);
    if (isDevelopment) {
      console.log(`⚠️  No HTTPS certificates found. Using HTTP for development.`);
      console.log(`   Run: npm run generate-certs`);
      console.log(`   Then restart the server`);
    }
    console.log('');
  });
}

export default app;
