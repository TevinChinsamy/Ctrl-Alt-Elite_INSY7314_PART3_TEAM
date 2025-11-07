import express from 'express';
import Customer from '../models/Customer.js';
import AuditLog from '../models/AuditLog.js';
import passwordService from '../services/passwordService.js';
import tokenService from '../services/tokenService.js';
import validator from '../utils/validators.js';

const router = express.Router();

/**
 * POST /api/customer/auth/register
 * DISABLED - Customer registration is not allowed via public API
 * Customers must be created by bank staff using the createCustomer.js script
 */
router.post('/register', async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Customer registration is disabled. Please contact your bank branch to open an account.'
  });
});

// Original registration code preserved for reference (used by createCustomer.js script)
// Kept here for script usage, not exposed via API
/*
router.post('/register', async (req, res) => {
  try {
    const { fullName, idNumber, accountNumber, username, password } = req.body;

    // Validate all inputs using RegEx whitelisting
    if (!validator.isValidFullName(fullName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid full name. Must be 2-100 characters, letters, spaces, hyphens, and apostrophes only.'
      });
    }

    if (!validator.isValidIdNumber(idNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID number. Must be exactly 13 digits.'
      });
    }

    if (!validator.isValidAccountNumber(accountNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account number. Must be 10-16 digits.'
      });
    }

    if (!validator.isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid username. Must be 3-50 characters, letters, numbers, and underscores only.'
      });
    }

    if (!validator.isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password. Must be 8-100 characters with uppercase, lowercase, digit, and special character.'
      });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [
        { idNumber },
        { accountNumber },
        { username: username.toLowerCase() }
      ]
    });

    if (existingCustomer) {
      if (existingCustomer.username === username.toLowerCase()) {
        return res.status(409).json({
          success: false,
          message: 'Username already taken. Please choose a different username.'
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Customer with this ID number or account number already exists.'
      });
    }

    // Hash password
    const { hash, salt } = await passwordService.hashPassword(password);

    // Create customer with user-provided username
    const customer = new Customer({
      fullName,
      idNumber,
      accountNumber,
      username: username.toLowerCase(),
      passwordHash: hash,
      passwordSalt: salt,
      isActive: true
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      username: username.toLowerCase()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});
*/

/**
 * POST /api/customer/auth/login
 * Customer login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, accountNumber, password } = req.body;

    // Get request metadata for audit logging
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Validate account number (required)
    if (!validator.isValidAccountNumber(accountNumber)) {
      await AuditLog.logFailedLogin({
        userType: 'customer',
        accountNumber,
        username: username || 'not-provided',
        ipAddress,
        userAgent,
        failureReason: 'Invalid account number format'
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid account number format.'
      });
    }

    // Username is optional - can login with just account number + password
    // If username is provided, validate it
    if (username && !validator.isValidUsername(username)) {
      await AuditLog.logFailedLogin({
        userType: 'customer',
        accountNumber,
        username,
        ipAddress,
        userAgent,
        failureReason: 'Invalid username format'
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid username format.'
      });
    }

    // Find customer by account number (and optionally username)
    const query = {
      accountNumber,
      isActive: true
    };

    if (username) {
      query.username = username.toLowerCase();
    }

    const customer = await Customer.findOne(query);

    if (!customer) {
      await AuditLog.logFailedLogin({
        userType: 'customer',
        accountNumber,
        username: username || 'not-provided',
        ipAddress,
        userAgent,
        failureReason: 'Account not found or inactive'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // Verify password
    const isPasswordValid = await passwordService.verifyPassword(
      password,
      customer.passwordHash,
      customer.passwordSalt
    );

    if (!isPasswordValid) {
      await AuditLog.logFailedLogin({
        userType: 'customer',
        accountNumber,
        username: customer.username,
        ipAddress,
        userAgent,
        failureReason: 'Invalid password'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // Update last login
    customer.lastLoginAt = new Date();
    await customer.save();

    // Log successful login
    await AuditLog.logSuccessfulLogin({
      userType: 'customer',
      accountNumber,
      username: customer.username,
      ipAddress,
      userAgent
    });

    // Generate JWT token
    const token = tokenService.generateToken({
      userId: customer._id.toString(),
      username: customer.username,
      userType: 'customer'
    });

    res.json({
      success: true,
      token,
      username: customer.username,
      fullName: customer.fullName
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

export default router;
