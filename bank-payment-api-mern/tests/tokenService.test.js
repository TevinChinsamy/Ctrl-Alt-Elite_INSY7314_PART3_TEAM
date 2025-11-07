import tokenService from '../services/tokenService.js';

// Mock environment variables
process.env.JWT_SECRET = 'test_secret_key_for_testing_purposes_only_minimum_64_chars_required';
process.env.JWT_EXPIRE = '2h';

describe('TokenService', () => {
  describe('generateToken', () => {
    test('should generate valid JWT token', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        username: 'testuser',
        userType: 'customer'
      };

      const token = tokenService.generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should include correct claims in token', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        username: 'testuser',
        userType: 'customer'
      };

      const token = tokenService.generateToken(payload);
      const decoded = tokenService.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.username).toBe(payload.username);
      expect(decoded.userType).toBe(payload.userType);
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    test('should verify valid token', () => {
      const payload = {
        userId: '507f1f77bcf86cd799439011',
        username: 'testuser',
        userType: 'customer'
      };

      const token = tokenService.generateToken(payload);
      const decoded = tokenService.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(payload.userId);
    });

    test('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = tokenService.verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    test('should return null for malformed token', () => {
      const malformedToken = 'notavalidtoken';
      const decoded = tokenService.verifyToken(malformedToken);

      expect(decoded).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    test('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const authHeader = `Bearer ${token}`;

      const extracted = tokenService.extractTokenFromHeader(authHeader);

      expect(extracted).toBe(token);
    });

    test('should return null for missing header', () => {
      const extracted = tokenService.extractTokenFromHeader(null);

      expect(extracted).toBeNull();
    });

    test('should return null for invalid format', () => {
      const extracted = tokenService.extractTokenFromHeader('InvalidFormat token');

      expect(extracted).toBeNull();
    });

    test('should return null for empty header', () => {
      const extracted = tokenService.extractTokenFromHeader('');

      expect(extracted).toBeNull();
    });
  });
});
