import tokenService from '../services/tokenService.js';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = tokenService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = tokenService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      userType: decoded.userType
    };

    next();

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

/**
 * Require Customer Role Middleware
 */
export const requireCustomer = (req, res, next) => {
  if (req.user.userType !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer role required.'
    });
  }
  next();
};

/**
 * Require Employee Role Middleware
 */
export const requireEmployee = (req, res, next) => {
  if (req.user.userType !== 'employee') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Employee role required.'
    });
  }
  next();
};
