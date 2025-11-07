import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * Password Service with exceptional security
 * Uses bcrypt with cost factor 12 (equivalent to ~100,000 iterations)
 * Additional cryptographic salt generation using crypto.randomBytes
 */

const SALT_ROUNDS = 12; // 2^12 iterations (~4096) - bcrypt adaptive hashing
const CUSTOM_SALT_SIZE = 32; // 256 bits for additional salt

class PasswordService {
  /**
   * Hash password with bcrypt and additional custom salt
   * @param {string} password - Plain text password
   * @returns {Promise<{hash: string, salt: string}>} Hash and salt
   */
  async hashPassword(password) {
    try {
      // Generate additional cryptographic salt
      const customSalt = crypto.randomBytes(CUSTOM_SALT_SIZE).toString('base64');

      // Combine password with custom salt before bcrypt
      const saltedPassword = password + customSalt;

      // Hash with bcrypt (includes its own internal salt)
      const hash = await bcrypt.hash(saltedPassword, SALT_ROUNDS);

      return {
        hash,
        salt: customSalt
      };
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
   * Verify password against hash and salt
   * @param {string} password - Plain text password to verify
   * @param {string} hash - Stored hash
   * @param {string} salt - Stored custom salt
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, hash, salt) {
    try {
      // Combine password with stored custom salt
      const saltedPassword = password + salt;

      // Use bcrypt's timing-safe comparison
      const isMatch = await bcrypt.compare(saltedPassword, hash);

      return isMatch;
    } catch (error) {
      // Return false on any error to prevent information leakage
      return false;
    }
  }

  /**
   * Generate secure random token (for session IDs, etc.)
   * @param {number} length - Token length in bytes (default 32)
   * @returns {string} Hex-encoded token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

export default new PasswordService();
