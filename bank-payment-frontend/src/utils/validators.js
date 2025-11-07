/**
 * FRONTEND INPUT VALIDATION - SECURITY LAYER
 *
 * Client-side validation matching backend security patterns
 * Prevents malicious input from reaching the API
 *
 * NOTE: This is NOT a replacement for backend validation,
 * but provides immediate feedback and reduces attack surface
 */

const patterns = {
  // Full name: Letters, spaces, hyphens, apostrophes only
  fullName: /^[a-zA-Z\s'-]{2,100}$/,

  // ID Number: Exactly 13 digits (South African ID format)
  idNumber: /^[0-9]{13}$/,

  // Account Number: 10-16 digits only
  accountNumber: /^[0-9]{10,16}$/,

  // Username: Alphanumeric and underscore only
  username: /^[a-zA-Z0-9_]{3,50}$/,

  // Strong password: Min 8 chars, uppercase, lowercase, digit, special char
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-\[\]{}|\\:;<>,.~`])[A-Za-z\d@$!%*?&#^()_+=\-\[\]{}|\\:;<>,.~`]{8,100}$/,

  // Currency: Exactly 3 uppercase letters (ISO 4217)
  currency: /^[A-Z]{3}$/,

  // SWIFT Code: 8 or 11 characters (ISO 9362)
  swiftCode: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,

  // Provider: Letters and spaces only
  provider: /^[a-zA-Z\s]{2,50}$/,

  // Bank Name: Letters, spaces, ampersand, hyphen, apostrophe
  bankName: /^[a-zA-Z\s&'-]{2,100}$/,

  // Email: RFC 5322 compliant
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
};

class InputValidator {
  /**
   * Validate full name
   */
  isValidFullName(fullName) {
    if (!fullName || typeof fullName !== 'string') return false;
    return patterns.fullName.test(fullName.trim());
  }

  /**
   * Validate ID number (13 digits)
   */
  isValidIdNumber(idNumber) {
    if (!idNumber || typeof idNumber !== 'string') return false;
    return patterns.idNumber.test(idNumber.trim());
  }

  /**
   * Validate account number (10-16 digits)
   */
  isValidAccountNumber(accountNumber) {
    if (!accountNumber || typeof accountNumber !== 'string') return false;
    return patterns.accountNumber.test(accountNumber.trim());
  }

  /**
   * Validate username (3-50 alphanumeric + underscore)
   */
  isValidUsername(username) {
    if (!username || typeof username !== 'string') return false;
    return patterns.username.test(username.trim());
  }

  /**
   * Validate password strength
   */
  isValidPassword(password) {
    if (!password || typeof password !== 'string') return false;
    return patterns.password.test(password);
  }

  /**
   * Get password strength feedback
   */
  getPasswordStrength(password) {
    if (!password) return { strength: 'empty', message: 'Password is required' };

    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      digit: /\d/.test(password),
      special: /[@$!%*?&#^()_+=\-\[\]{}|\\:;<>,.~`]/.test(password),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;

    if (passedChecks === 5) return { strength: 'strong', message: 'Strong password', checks };
    if (passedChecks >= 3) return { strength: 'medium', message: 'Medium strength password', checks };
    return { strength: 'weak', message: 'Weak password - add more variety', checks };
  }

  /**
   * Validate currency code (3 uppercase letters)
   */
  isValidCurrency(currency) {
    if (!currency || typeof currency !== 'string') return false;
    return patterns.currency.test(currency.trim());
  }

  /**
   * Validate SWIFT code (8 or 11 characters)
   */
  isValidSwiftCode(swiftCode) {
    if (!swiftCode || typeof swiftCode !== 'string') return false;
    return patterns.swiftCode.test(swiftCode.trim().toUpperCase());
  }

  /**
   * Validate payment amount
   */
  isValidAmount(amount) {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return typeof numAmount === 'number' &&
           !isNaN(numAmount) &&
           numAmount > 0 &&
           numAmount <= 999999999.99;
  }

  /**
   * Validate provider name
   */
  isValidProvider(provider) {
    if (!provider || typeof provider !== 'string') return false;
    return patterns.provider.test(provider.trim());
  }

  /**
   * Validate bank name
   */
  isValidBankName(bankName) {
    if (!bankName || typeof bankName !== 'string') return false;
    return patterns.bankName.test(bankName.trim());
  }

  /**
   * Validate email address
   */
  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return patterns.email.test(email.trim());
  }

  /**
   * Check for potential XSS patterns
   */
  containsXSS(input) {
    if (!input || typeof input !== 'string') return false;

    const xssPatterns = [
      /<script/i,
      /<iframe/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<embed/i,
      /<object/i,
      /vbscript:/i,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Check for SQL injection patterns
   */
  containsSQLInjection(input) {
    if (!input || typeof input !== 'string') return false;

    const sqlPatterns = [
      /(\bunion\b.*\bselect\b)/i,
      /(\bselect\b.*\bfrom\b)/i,
      /(\binsert\b.*\binto\b)/i,
      /(\bdelete\b.*\bfrom\b)/i,
      /(\bdrop\b.*\btable\b)/i,
      /(--|;)/,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize input by removing dangerous characters
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';

    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '') // Remove angle brackets
      .trim();
  }

  /**
   * Comprehensive validation for payment form
   */
  validatePaymentForm(formData) {
    const errors = {};

    // Validate amount
    if (!this.isValidAmount(formData.amount)) {
      errors.amount = 'Invalid amount. Must be between 0.01 and 999,999,999.99';
    }

    // Validate currency
    if (!this.isValidCurrency(formData.currency)) {
      errors.currency = 'Invalid currency code';
    }

    // Validate provider
    if (!this.isValidProvider(formData.provider)) {
      errors.provider = 'Invalid provider name';
    }

    // Validate payee account number
    if (!this.isValidAccountNumber(formData.payeeAccountNumber)) {
      errors.payeeAccountNumber = 'Invalid account number (must be 10-16 digits)';
    }

    // Validate payee full name
    if (!this.isValidFullName(formData.payeeFullName)) {
      errors.payeeFullName = 'Invalid name (letters, spaces, hyphens, apostrophes only)';
    }

    // Validate payee bank name
    if (!this.isValidBankName(formData.payeeBankName)) {
      errors.payeeBankName = 'Invalid bank name';
    }

    // Validate SWIFT code
    if (!this.isValidSwiftCode(formData.swiftCode)) {
      errors.swiftCode = 'Invalid SWIFT code (8 or 11 characters)';
    }

    // Check for injection attempts
    const fieldsToCheck = [
      formData.payeeFullName,
      formData.payeeBankName,
      formData.provider,
    ];

    for (const field of fieldsToCheck) {
      if (this.containsXSS(field)) {
        errors.security = 'Potential security threat detected in input';
        break;
      }
      if (this.containsSQLInjection(field)) {
        errors.security = 'Potential security threat detected in input';
        break;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Comprehensive validation for registration form
   */
  validateRegistrationForm(formData) {
    const errors = {};

    // Validate full name
    if (!this.isValidFullName(formData.fullName)) {
      errors.fullName = 'Invalid name (2-100 characters, letters only)';
    }

    // Validate ID number
    if (!this.isValidIdNumber(formData.idNumber)) {
      errors.idNumber = 'Invalid ID number (must be 13 digits)';
    }

    // Validate account number
    if (!this.isValidAccountNumber(formData.accountNumber)) {
      errors.accountNumber = 'Invalid account number (10-16 digits)';
    }

    // Validate username
    if (!this.isValidUsername(formData.username)) {
      errors.username = 'Invalid username (3-50 characters, alphanumeric and underscore only)';
    }

    // Validate password
    const passwordCheck = this.getPasswordStrength(formData.password);
    if (passwordCheck.strength === 'weak' || passwordCheck.strength === 'empty') {
      errors.password = 'Password must contain uppercase, lowercase, digit, and special character (min 8 chars)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Comprehensive validation for login form
   */
  validateLoginForm(formData, isCustomer = true) {
    const errors = {};

    // Validate username
    if (!this.isValidUsername(formData.username)) {
      errors.username = 'Invalid username format';
    }

    // Validate account number (customer only)
    if (isCustomer && formData.accountNumber) {
      if (!this.isValidAccountNumber(formData.accountNumber)) {
        errors.accountNumber = 'Invalid account number';
      }
    }

    // Validate password exists (don't validate strength for login)
    if (!formData.password || formData.password.length < 1) {
      errors.password = 'Password is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

export default new InputValidator();
