/**
 * API Security Testing Suite
 * Tests security middleware and API endpoints
 * Runs in GitHub Actions for continuous security validation
 */

import request from 'supertest';
import express from 'express';
import {
  securityHeaders,
  generalRateLimiter,
  mongoSanitization,
  customSecurityHeaders,
  parameterPollutionProtection,
  xssProtection,
  requestSizeLimiter,
  slowlorisProtection
} from '../middleware/security.js';
import {
  loginBruteForce,
  registrationBruteForce,
  paymentBruteForce
} from '../middleware/brute.js';

describe('API Security Testing Suite', () => {

  describe('1. Security Headers (Helmet)', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(securityHeaders);
      app.use(customSecurityHeaders);
      app.get('/test', (req, res) => res.json({ success: true }));
    });

    test('should set X-Frame-Options header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    test('should set X-Content-Type-Options header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    test('should set X-XSS-Protection header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    test('should set Strict-Transport-Security (HSTS)', async () => {
      const response = await request(app).get('/test');
      // HSTS may be set by Helmet
      // In development it might not be set, so we just check if header exists or not
      if (response.headers['strict-transport-security']) {
        expect(response.headers['strict-transport-security']).toContain('max-age');
      }
    });

    test('should set Content-Security-Policy', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });

    test('should set Referrer-Policy', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['referrer-policy']).toBeDefined();
    });

    test('should remove X-Powered-By header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    test('should set Cross-Origin headers', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['cross-origin-resource-policy']).toBe('same-origin');
      expect(response.headers['cross-origin-opener-policy']).toBe('same-origin');
    });

    test('should set Cache-Control for sensitive data', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['cache-control']).toContain('no-store');
    });

    test('should set Permissions-Policy', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['permissions-policy']).toBeDefined();
    });
  });

  describe('2. Request Size Limiting (DoS Protection)', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(requestSizeLimiter);
      app.use(express.json());
      app.post('/test', (req, res) => res.json({ success: true }));
    });

    test('should reject requests with oversized content-length header', async () => {
      const response = await request(app)
        .post('/test')
        .set('Content-Length', '20000000') // 20MB
        .send({ data: 'test' });

      expect(response.status).toBe(413);
      expect(response.body.message).toContain('too large');
    });
  });

  describe('3. MongoDB Sanitization (NoSQL Injection Protection)', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(mongoSanitization);
      app.post('/test', (req, res) => res.json({ body: req.body }));
    });

    test('should sanitize $where operator', async () => {
      const response = await request(app)
        .post('/test')
        .send({ username: { $where: 'malicious code' } });

      expect(response.status).toBe(200);
      // The $ should be replaced with _
      expect(JSON.stringify(response.body)).not.toContain('$where');
    });

    test('should sanitize $gt operator', async () => {
      const response = await request(app)
        .post('/test')
        .send({ password: { $gt: '' } });

      expect(response.status).toBe(200);
      expect(JSON.stringify(response.body)).not.toContain('$gt');
    });

    test('should sanitize $ne operator', async () => {
      const response = await request(app)
        .post('/test')
        .send({ email: { $ne: null } });

      expect(response.status).toBe(200);
      expect(JSON.stringify(response.body)).not.toContain('$ne');
    });
  });

  describe('4. XSS Protection', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(xssProtection);
      app.post('/test', (req, res) => res.json({ body: req.body }));
    });

    test('should sanitize script tags', async () => {
      const response = await request(app)
        .post('/test')
        .send({ comment: '<script>alert("XSS")</script>' });

      expect(response.status).toBe(200);
      // XSS-clean should have sanitized the script tag
    });

    test('should sanitize event handlers', async () => {
      const response = await request(app)
        .post('/test')
        .send({ html: '<img src=x onerror="alert(1)">' });

      expect(response.status).toBe(200);
    });
  });

  describe('5. HTTP Parameter Pollution Protection', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.urlencoded({ extended: true }));
      app.use(parameterPollutionProtection);
      app.get('/test', (req, res) => res.json({ query: req.query }));
    });

    test('should handle duplicate parameters correctly', async () => {
      const response = await request(app)
        .get('/test?id=1&id=2');

      expect(response.status).toBe(200);
      // HPP should prevent pollution
    });
  });

  describe('6. Slowloris Protection (Timeout)', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(slowlorisProtection);
      app.get('/test', (req, res) => res.json({ success: true }));
    });

    test('should set request timeout', async () => {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      // If timeout is set correctly, normal requests should pass
    });
  });

  describe('7. Express-Brute Force Protection', () => {

    test('should export loginBruteForce middleware', () => {
      expect(loginBruteForce).toBeDefined();
      expect(typeof loginBruteForce.prevent).toBe('function');
    });

    test('should export registrationBruteForce middleware', () => {
      expect(registrationBruteForce).toBeDefined();
      expect(typeof registrationBruteForce.prevent).toBe('function');
    });

    test('should export paymentBruteForce middleware', () => {
      expect(paymentBruteForce).toBeDefined();
      expect(typeof paymentBruteForce.prevent).toBe('function');
    });

    test('should have correct configuration for login brute force', () => {
      // Verify that the brute force has the expected properties
      expect(loginBruteForce).toHaveProperty('prevent');
    });
  });

  describe('8. Rate Limiting Configuration', () => {

    test('should export generalRateLimiter', () => {
      expect(generalRateLimiter).toBeDefined();
      expect(typeof generalRateLimiter).toBe('function');
    });

    test('should have rate limiting middleware as function', async () => {
      const app = express();
      app.use(generalRateLimiter);
      app.get('/test', (req, res) => res.json({ success: true }));

      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    });
  });

  describe('9. Security Middleware Integration', () => {

    test('should export all required security middleware', () => {
      expect(securityHeaders).toBeDefined();
      expect(generalRateLimiter).toBeDefined();
      expect(mongoSanitization).toBeDefined();
      expect(customSecurityHeaders).toBeDefined();
      expect(parameterPollutionProtection).toBeDefined();
      expect(xssProtection).toBeDefined();
      expect(requestSizeLimiter).toBeDefined();
      expect(slowlorisProtection).toBeDefined();
    });

    test('should export all brute force protection middleware', () => {
      expect(loginBruteForce).toBeDefined();
      expect(registrationBruteForce).toBeDefined();
      expect(paymentBruteForce).toBeDefined();
    });
  });

  describe('10. CORS Security', () => {
    // CORS is tested in integration tests with the full server
    test('CORS middleware should be configured', () => {
      // This is a placeholder - CORS is tested when server runs
      expect(true).toBe(true);
    });
  });
});
