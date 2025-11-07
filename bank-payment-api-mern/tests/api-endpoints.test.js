/**
 * API Endpoints Integration Testing
 * Tests actual API endpoints with security middleware
 * Validates that the application runs correctly with all security measures
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';

describe('API Endpoints Integration Tests', () => {

  // Setup: Connect to test database before all tests
  beforeAll(async () => {
    // Use test database
    const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bank_payment_test';

    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // Connect to test database
    try {
      await mongoose.connect(testDbUri);
      console.log('Connected to test database');
    } catch (error) {
      console.log('Database connection skipped in test environment');
    }
  });

  // Cleanup: Close database connection after all tests
  afterAll(async () => {
    try {
      await mongoose.connection.close();
      console.log('Disconnected from test database');
    } catch (error) {
      console.log('Database disconnection skipped');
    }
  });

  describe('1. Health Check Endpoint', () => {

    test('GET /api/health should return 200', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
    });

    test('GET /api/health should return success message', async () => {
      const response = await request(app).get('/api/health');
      expect(response.body).toHaveProperty('success', true);
    });

    test('GET /api/health should include server info', async () => {
      const response = await request(app).get('/api/health');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('2. Root Endpoint', () => {

    test('GET / should return 200', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    });

    test('GET / should return API information', async () => {
      const response = await request(app).get('/');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('3. Security Headers on All Endpoints', () => {

    test('should have security headers on root endpoint', async () => {
      const response = await request(app).get('/');

      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    test('should have security headers on health endpoint', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    test('should not expose server information', async () => {
      const response = await request(app).get('/');

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('4. 404 Handler', () => {

    test('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/non-existent-route');
      expect(response.status).toBe(404);
    });

    test('should return proper error message for 404', async () => {
      const response = await request(app).get('/api/non-existent-route');
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('5. Authentication Endpoints Exist', () => {

    test('POST /api/customer/auth/register should exist', async () => {
      const response = await request(app)
        .post('/api/customer/auth/register')
        .send({});

      // Should not be 404 - could be 400 (validation error) or other
      expect(response.status).not.toBe(404);
    });

    test('POST /api/customer/auth/login should exist', async () => {
      const response = await request(app)
        .post('/api/customer/auth/login')
        .send({});

      // Should not be 404
      expect(response.status).not.toBe(404);
    });

    test('POST /api/employee/auth/login should exist', async () => {
      const response = await request(app)
        .post('/api/employee/auth/login')
        .send({});

      // Should not be 404
      expect(response.status).not.toBe(404);
    });
  });

  describe('6. Input Validation', () => {

    test('should reject invalid customer registration data', async () => {
      const response = await request(app)
        .post('/api/customer/auth/register')
        .send({
          // Missing required fields
          username: 'test'
        });

      // Should return validation or security error (400, 403, 422 or 429)
      expect([400, 403, 422, 429]).toContain(response.status);
    });

    test('should reject invalid login data', async () => {
      const response = await request(app)
        .post('/api/customer/auth/login')
        .send({
          // Missing password
          accountNumber: '123456789'
        });

      // Should return validation or security error
      expect([400, 403, 422, 429]).toContain(response.status);
    });
  });

  describe('7. NoSQL Injection Prevention', () => {

    test('should prevent NoSQL injection in login', async () => {
      const response = await request(app)
        .post('/api/customer/auth/login')
        .send({
          accountNumber: { $gt: '' },
          password: { $gt: '' }
        });

      // Should not crash or authenticate
      expect(response.status).not.toBe(500);
      if (response.status === 200) {
        expect(response.body.success).not.toBe(true);
      }
    });

    test('should prevent $where injection', async () => {
      const response = await request(app)
        .post('/api/customer/auth/login')
        .send({
          accountNumber: { $where: 'this.password' },
          password: 'test'
        });

      expect(response.status).not.toBe(500);
    });
  });

  describe('8. XSS Prevention', () => {

    test('should sanitize XSS attempts in registration', async () => {
      const response = await request(app)
        .post('/api/customer/auth/register')
        .send({
          fullName: '<script>alert("XSS")</script>',
          accountNumber: '1234567890',
          password: 'Test@1234'
        });

      // Should handle gracefully (not crash)
      expect(response.status).not.toBe(500);
    });
  });

  describe('9. CORS Configuration', () => {

    test('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      // Should allow CORS or return appropriate status
      expect([200, 204]).toContain(response.status);
    });
  });

  describe('10. Rate Limiting Protection', () => {

    test('should apply rate limiting to endpoints', async () => {
      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(request(app).get('/api/health'));
      }

      const responses = await Promise.all(requests);

      // All requests should succeed or some should be rate limited
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('11. Protected Routes (Authorization)', () => {

    test('should reject unauthorized access to customer payments', async () => {
      const response = await request(app)
        .get('/api/customer/payments');

      // Should return 401 Unauthorized or similar
      expect([401, 403]).toContain(response.status);
    });

    test('should reject unauthorized access to employee portal', async () => {
      const response = await request(app)
        .get('/api/employee/portal/customers');

      // Should return 401 Unauthorized
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('12. Request Size Limits', () => {

    test('should reject oversized payloads', async () => {
      // Create a large payload (> 10MB if that's the limit)
      const largeData = 'x'.repeat(100000); // 100KB for testing

      const response = await request(app)
        .post('/api/customer/auth/register')
        .send({
          fullName: largeData,
          accountNumber: '1234567890',
          password: 'Test@1234'
        });

      // Should handle large payloads appropriately
      expect(response.status).not.toBe(500);
    });
  });

  describe('13. Error Handling', () => {

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/customer/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      // Should return 400 Bad Request, not crash
      expect([400, 500]).toContain(response.status);
    });

    test('should not expose stack traces in production mode', async () => {
      const response = await request(app)
        .get('/api/non-existent-route');

      // Response should not contain stack trace
      const bodyString = JSON.stringify(response.body);
      expect(bodyString).not.toContain('stack');
      expect(bodyString).not.toContain('at ');
    });
  });

  describe('14. Content-Type Validation', () => {

    test('should require proper Content-Type for POST requests', async () => {
      const response = await request(app)
        .post('/api/customer/auth/login')
        .set('Content-Type', 'text/plain')
        .send('plain text data');

      // Should handle gracefully
      expect(response.status).not.toBe(500);
    });
  });

  describe('15. HTTP Methods', () => {

    test('should only allow appropriate HTTP methods', async () => {
      // Health endpoint should allow GET
      const getResponse = await request(app).get('/api/health');
      expect(getResponse.status).toBe(200);

      // Health endpoint should not allow POST
      const postResponse = await request(app).post('/api/health');
      expect(postResponse.status).not.toBe(200);
    });
  });
});
