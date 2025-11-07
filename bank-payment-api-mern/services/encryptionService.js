import crypto from 'crypto';

/**
 * Encryption Service using AES-256-CBC
 * For encrypting sensitive data at rest
 */

const ALGORITHM = 'aes-256-cbc';

class EncryptionService {
  constructor() {
    // Get encryption key and IV from environment
    this.key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'base64');
    this.iv = Buffer.from(process.env.ENCRYPTION_IV || '', 'base64');

    // Validate key and IV lengths
    if (this.key.length !== 32) {
      console.warn('Warning: ENCRYPTION_KEY must be 32 bytes (256 bits) for AES-256');
    }
    if (this.iv.length !== 16) {
      console.warn('Warning: ENCRYPTION_IV must be 16 bytes (128 bits)');
    }
  }

  /**
   * Encrypt data using AES-256-CBC
   * @param {string} plaintext - Data to encrypt
   * @returns {string} Base64-encoded encrypted data
   */
  encrypt(plaintext) {
    try {
      const cipher = crypto.createCipheriv(ALGORITHM, this.key, this.iv);
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      return encrypted;
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AES-256-CBC
   * @param {string} ciphertext - Base64-encoded encrypted data
   * @returns {string} Decrypted plaintext
   */
  decrypt(ciphertext) {
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, this.iv);
      let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate secure random encryption key (256 bits)
   * @returns {string} Base64-encoded key
   */
  static generateKey() {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Generate secure random IV (128 bits)
   * @returns {string} Base64-encoded IV
   */
  static generateIV() {
    return crypto.randomBytes(16).toString('base64');
  }
}

export default new EncryptionService();
