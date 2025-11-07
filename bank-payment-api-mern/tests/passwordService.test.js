import passwordService from '../services/passwordService.js';

describe('PasswordService', () => {
  describe('hashPassword', () => {
    test('should return hash and salt', async () => {
      const password = 'SecurePass123!';
      const { hash, salt } = await passwordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(salt).toBeDefined();
      expect(hash).not.toBe(password);
      expect(typeof hash).toBe('string');
      expect(typeof salt).toBe('string');
    });

    test('should produce different salts for same password', async () => {
      const password = 'SecurePass123!';
      const { hash: hash1, salt: salt1 } = await passwordService.hashPassword(password);
      const { hash: hash2, salt: salt2 } = await passwordService.hashPassword(password);

      expect(salt1).not.toBe(salt2);
      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty password', async () => {
      const password = '';
      const { hash, salt } = await passwordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(salt).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    test('should return true for correct password', async () => {
      const password = 'SecurePass123!';
      const { hash, salt } = await passwordService.hashPassword(password);

      const result = await passwordService.verifyPassword(password, hash, salt);

      expect(result).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const correctPassword = 'SecurePass123!';
      const incorrectPassword = 'WrongPassword!';
      const { hash, salt } = await passwordService.hashPassword(correctPassword);

      const result = await passwordService.verifyPassword(incorrectPassword, hash, salt);

      expect(result).toBe(false);
    });

    test('should return false for invalid hash', async () => {
      const password = 'SecurePass123!';
      const { salt } = await passwordService.hashPassword(password);
      const invalidHash = 'InvalidHash';

      const result = await passwordService.verifyPassword(password, invalidHash, salt);

      expect(result).toBe(false);
    });

    test('should return false for invalid salt', async () => {
      const password = 'SecurePass123!';
      const { hash } = await passwordService.hashPassword(password);
      const invalidSalt = 'InvalidSalt';

      const result = await passwordService.verifyPassword(password, hash, invalidSalt);

      expect(result).toBe(false);
    });
  });

  describe('generateSecureToken', () => {
    test('should generate token with default length', () => {
      const token = passwordService.generateSecureToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    test('should generate token with custom length', () => {
      const token = passwordService.generateSecureToken(16);

      expect(token).toBeDefined();
      expect(token.length).toBe(32); // 16 bytes = 32 hex characters
    });

    test('should generate unique tokens', () => {
      const token1 = passwordService.generateSecureToken();
      const token2 = passwordService.generateSecureToken();

      expect(token1).not.toBe(token2);
    });
  });
});
