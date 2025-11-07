import jwt from 'jsonwebtoken';

/**
 * JWT Token Service for authentication
 * Creates and verifies JWT tokens with appropriate claims
 */

class TokenService {
  /**
   * Generate JWT token for authenticated user
   * @param {Object} payload - Token payload (userId, username, userType)
   * @returns {string} JWT token
   */
  generateToken(payload) {
    const { userId, username, userType } = payload;

    const token = jwt.sign(
      {
        userId,
        username,
        userType,
        iat: Math.floor(Date.now() / 1000), // Issued at
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE || '2h',
        issuer: 'BankPaymentAPI',
        audience: 'BankPaymentClient'
      }
    );

    return token;
  }

  /**
   * Verify and decode JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'BankPaymentAPI',
        audience: 'BankPaymentClient'
      });

      return decoded;
    } catch (error) {
      // Token invalid, expired, or malformed
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} Token or null if not found
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
}

export default new TokenService();
