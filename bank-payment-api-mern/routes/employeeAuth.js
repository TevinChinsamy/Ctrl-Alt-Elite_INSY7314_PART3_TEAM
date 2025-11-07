import express from 'express';
import Employee from '../models/Employee.js';
import AuditLog from '../models/AuditLog.js';
import passwordService from '../services/passwordService.js';
import tokenService from '../services/tokenService.js';
import validator from '../utils/validators.js';

const router = express.Router();

/**
 * POST /api/employee/auth/login
 * Employee login (no registration endpoint - employees are pre-registered)
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Get request metadata for audit logging
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Validate inputs
    if (!validator.isValidUsername(username)) {
      await AuditLog.logFailedLogin({
        userType: 'employee',
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

    if (!password || password.length === 0) {
      await AuditLog.logFailedLogin({
        userType: 'employee',
        username,
        ipAddress,
        userAgent,
        failureReason: 'Password not provided'
      });

      return res.status(400).json({
        success: false,
        message: 'Password is required.'
      });
    }

    // Find employee
    const employee = await Employee.findOne({
      username: username.toLowerCase(),
      isActive: true
    });

    if (!employee) {
      await AuditLog.logFailedLogin({
        userType: 'employee',
        username,
        ipAddress,
        userAgent,
        failureReason: 'Employee not found or inactive'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // Verify password
    const isPasswordValid = await passwordService.verifyPassword(
      password,
      employee.passwordHash,
      employee.passwordSalt
    );

    if (!isPasswordValid) {
      await AuditLog.logFailedLogin({
        userType: 'employee',
        username: employee.username,
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
    employee.lastLoginAt = new Date();
    await employee.save();

    // Log successful login
    await AuditLog.logSuccessfulLogin({
      userType: 'employee',
      username: employee.username,
      ipAddress,
      userAgent,
      metadata: { role: employee.role }
    });

    // Generate JWT token
    const token = tokenService.generateToken({
      userId: employee._id.toString(),
      username: employee.username,
      userType: 'employee'
    });

    res.json({
      success: true,
      token,
      username: employee.username,
      fullName: employee.fullName,
      role: employee.role
    });

  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

export default router;
