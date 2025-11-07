import validator from '../utils/validators.js';

describe('InputValidator', () => {
  describe('isValidFullName', () => {
    test('should accept valid names', () => {
      expect(validator.isValidFullName('John Smith')).toBe(true);
      expect(validator.isValidFullName("Mary-Jane O'Connor")).toBe(true);
      expect(validator.isValidFullName('Anne-Marie')).toBe(true);
    });

    test('should reject invalid names', () => {
      expect(validator.isValidFullName('A')).toBe(false); // Too short
      expect(validator.isValidFullName('John123')).toBe(false); // Contains numbers
      expect(validator.isValidFullName('<script>alert("xss")</script>')).toBe(false); // XSS attempt
      expect(validator.isValidFullName('John@Smith')).toBe(false); // Invalid character
    });
  });

  describe('isValidIdNumber', () => {
    test('should accept valid ID numbers', () => {
      expect(validator.isValidIdNumber('9001015009087')).toBe(true);
      expect(validator.isValidIdNumber('1234567890123')).toBe(true);
    });

    test('should reject invalid ID numbers', () => {
      expect(validator.isValidIdNumber('123456789012')).toBe(false); // Too short
      expect(validator.isValidIdNumber('12345678901234')).toBe(false); // Too long
      expect(validator.isValidIdNumber('900101500908A')).toBe(false); // Contains letter
    });
  });

  describe('isValidAccountNumber', () => {
    test('should accept valid account numbers', () => {
      expect(validator.isValidAccountNumber('1234567890')).toBe(true);
      expect(validator.isValidAccountNumber('1234567890123456')).toBe(true);
    });

    test('should reject invalid account numbers', () => {
      expect(validator.isValidAccountNumber('123456789')).toBe(false); // Too short
      expect(validator.isValidAccountNumber('12345678901234567')).toBe(false); // Too long
      expect(validator.isValidAccountNumber('12345ABC90')).toBe(false); // Contains letters
    });
  });

  describe('isValidUsername', () => {
    test('should accept valid usernames', () => {
      expect(validator.isValidUsername('john_doe')).toBe(true);
      expect(validator.isValidUsername('user123')).toBe(true);
      expect(validator.isValidUsername('test_user_123')).toBe(true);
    });

    test('should reject invalid usernames', () => {
      expect(validator.isValidUsername('ab')).toBe(false); // Too short
      expect(validator.isValidUsername('user name')).toBe(false); // Contains space
      expect(validator.isValidUsername('user@domain')).toBe(false); // Invalid character
    });
  });

  describe('isValidPassword', () => {
    test('should accept strong passwords', () => {
      expect(validator.isValidPassword('SecurePass123!')).toBe(true);
      expect(validator.isValidPassword('MyP@ssw0rd')).toBe(true);
      expect(validator.isValidPassword('C0mpl3x!Pass')).toBe(true);
    });

    test('should reject weak passwords', () => {
      expect(validator.isValidPassword('Weak')).toBe(false); // Too short
      expect(validator.isValidPassword('noupppercase1!')).toBe(false); // No uppercase
      expect(validator.isValidPassword('NOLOWERCASE1!')).toBe(false); // No lowercase
      expect(validator.isValidPassword('NoNumbers!')).toBe(false); // No digits
      expect(validator.isValidPassword('NoSpecial123')).toBe(false); // No special char
    });
  });

  describe('isValidCurrency', () => {
    test('should accept valid currency codes', () => {
      expect(validator.isValidCurrency('USD')).toBe(true);
      expect(validator.isValidCurrency('EUR')).toBe(true);
      expect(validator.isValidCurrency('GBP')).toBe(true);
    });

    test('should reject invalid currency codes', () => {
      expect(validator.isValidCurrency('usd')).toBe(false); // Must be uppercase
      expect(validator.isValidCurrency('US')).toBe(false); // Too short
      expect(validator.isValidCurrency('USDD')).toBe(false); // Too long
    });
  });

  describe('isValidSwiftCode', () => {
    test('should accept valid SWIFT codes', () => {
      expect(validator.isValidSwiftCode('ABCDEF2A')).toBe(true);
      expect(validator.isValidSwiftCode('ABCDEF2AXXX')).toBe(true);
      expect(validator.isValidSwiftCode('CHASUS33')).toBe(true);
    });

    test('should reject invalid SWIFT codes', () => {
      expect(validator.isValidSwiftCode('ABCDEF2')).toBe(false); // Too short
      expect(validator.isValidSwiftCode('ABCDEF2AXXXX')).toBe(false); // Too long
      expect(validator.isValidSwiftCode('abcdef2a')).toBe(false); // Must be uppercase
    });
  });

  describe('isValidAmount', () => {
    test('should accept valid amounts', () => {
      expect(validator.isValidAmount(100.50)).toBe(true);
      expect(validator.isValidAmount(0.01)).toBe(true);
      expect(validator.isValidAmount(999999999.99)).toBe(true);
    });

    test('should reject invalid amounts', () => {
      expect(validator.isValidAmount(0)).toBe(false); // Must be > 0
      expect(validator.isValidAmount(-100)).toBe(false); // Negative
      expect(validator.isValidAmount(1000000000)).toBe(false); // Too large
    });
  });

  describe('isValidProvider', () => {
    test('should accept valid provider names', () => {
      expect(validator.isValidProvider('SWIFT')).toBe(true);
      expect(validator.isValidProvider('Wire Transfer')).toBe(true);
      expect(validator.isValidProvider('SEPA')).toBe(true);
    });

    test('should reject invalid provider names', () => {
      expect(validator.isValidProvider('SWIFT123')).toBe(false); // Contains numbers
      expect(validator.isValidProvider('<script>')).toBe(false); // XSS attempt
      expect(validator.isValidProvider('S')).toBe(false); // Too short
    });
  });

  describe('isValidBankName', () => {
    test('should accept valid bank names', () => {
      expect(validator.isValidBankName('Chase Bank')).toBe(true);
      expect(validator.isValidBankName("Bank of America")).toBe(true);
      expect(validator.isValidBankName('Wells Fargo & Co')).toBe(true);
    });

    test('should reject invalid bank names', () => {
      expect(validator.isValidBankName('B')).toBe(false); // Too short
      expect(validator.isValidBankName('Bank123')).toBe(false); // Contains numbers
    });
  });

  describe('sanitizeInput', () => {
    test('should remove dangerous characters', () => {
      expect(validator.sanitizeInput('Normal text')).toBe('Normal text');
      expect(validator.sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert"xss"/script');
      expect(validator.sanitizeInput('Hello & goodbye')).toBe('Hello  goodbye');
      expect(validator.sanitizeInput('Test (parentheses)')).toBe('Test parentheses');
    });

    test('should handle empty strings', () => {
      expect(validator.sanitizeInput('')).toBe('');
    });

    test('should handle non-string inputs', () => {
      expect(validator.sanitizeInput(null)).toBe('');
      expect(validator.sanitizeInput(undefined)).toBe('');
      expect(validator.sanitizeInput(123)).toBe('');
    });
  });

  describe('isValidObjectId', () => {
    test('should accept valid MongoDB ObjectIds', () => {
      expect(validator.isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
      expect(validator.isValidObjectId('5f8d0d55b54764421b7156c9')).toBe(true);
    });

    test('should reject invalid ObjectIds', () => {
      expect(validator.isValidObjectId('invalid')).toBe(false);
      expect(validator.isValidObjectId('507f1f77bcf86cd79943901')).toBe(false); // Too short
      expect(validator.isValidObjectId('507f1f77bcf86cd7994390111')).toBe(false); // Too long
    });
  });
});
