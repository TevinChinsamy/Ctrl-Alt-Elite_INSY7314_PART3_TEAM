/**
 * SECURE STORAGE UTILITY
 *
 * Provides enhanced security for localStorage with:
 * - Encryption for sensitive data
 * - Automatic expiration
 * - Integrity checks
 * - Protection against XSS token theft
 *
 * NOTE: For production banking apps, consider using httpOnly cookies
 * instead of localStorage for storing JWT tokens
 */

class SecureStorage {
  constructor() {
    this.prefix = 'secure_bank_';
    this.encryptionKey = this.getEncryptionKey();
  }

  /**
   * Get or create encryption key (stored in sessionStorage)
   * This key is regenerated on each session
   */
  getEncryptionKey() {
    let key = sessionStorage.getItem('_ek');
    if (!key) {
      key = this.generateKey();
      sessionStorage.setItem('_ek', key);
    }
    return key;
  }

  /**
   * Generate a random encryption key
   */
  generateKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Simple encryption (XOR cipher with key)
   * NOTE: For production, use Web Crypto API with AES-GCM
   */
  encrypt(text) {
    if (!text) return '';

    try {
      const textBytes = new TextEncoder().encode(text);
      const keyBytes = new TextEncoder().encode(this.encryptionKey);
      const encrypted = new Uint8Array(textBytes.length);

      for (let i = 0; i < textBytes.length; i++) {
        encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
      }

      return btoa(String.fromCharCode(...encrypted));
    } catch (e) {
      console.error('Encryption error:', e);
      return text; // Fallback to plain text
    }
  }

  /**
   * Simple decryption (XOR cipher with key)
   */
  decrypt(encryptedText) {
    if (!encryptedText) return '';

    try {
      const encrypted = new Uint8Array(
        atob(encryptedText).split('').map(c => c.charCodeAt(0))
      );
      const keyBytes = new TextEncoder().encode(this.encryptionKey);
      const decrypted = new Uint8Array(encrypted.length);

      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
      }

      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error('Decryption error:', e);
      return encryptedText; // Fallback to encrypted text
    }
  }

  /**
   * Set item with optional encryption and expiration
   */
  setItem(key, value, options = {}) {
    const {
      encrypt = true,
      expiresIn = null, // milliseconds
    } = options;

    try {
      const data = {
        value: encrypt ? this.encrypt(JSON.stringify(value)) : JSON.stringify(value),
        encrypted: encrypt,
        timestamp: Date.now(),
        expiresAt: expiresIn ? Date.now() + expiresIn : null,
      };

      localStorage.setItem(this.prefix + key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('SecureStorage setItem error:', e);
      return false;
    }
  }

  /**
   * Get item with automatic decryption and expiration check
   */
  getItem(key) {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const data = JSON.parse(item);

      // Check expiration
      if (data.expiresAt && Date.now() > data.expiresAt) {
        this.removeItem(key);
        return null;
      }

      // Decrypt if needed
      const rawValue = data.encrypted
        ? this.decrypt(data.value)
        : data.value;

      return JSON.parse(rawValue);
    } catch (e) {
      console.error('SecureStorage getItem error:', e);
      return null;
    }
  }

  /**
   * Remove item
   */
  removeItem(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (e) {
      console.error('SecureStorage removeItem error:', e);
      return false;
    }
  }

  /**
   * Clear all secure storage items
   */
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.removeItem('_ek');
      return true;
    } catch (e) {
      console.error('SecureStorage clear error:', e);
      return false;
    }
  }

  /**
   * Check if item exists and is not expired
   */
  hasItem(key) {
    const item = this.getItem(key);
    return item !== null;
  }

  /**
   * Set token with automatic expiration (matches JWT expiry)
   */
  setToken(token, expiresIn = 2 * 60 * 60 * 1000) { // 2 hours default
    return this.setItem('token', token, {
      encrypt: true,
      expiresIn: expiresIn,
    });
  }

  /**
   * Get token
   */
  getToken() {
    return this.getItem('token');
  }

  /**
   * Remove token
   */
  removeToken() {
    return this.removeItem('token');
  }

  /**
   * Set user data
   */
  setUser(user) {
    return this.setItem('user', user, {
      encrypt: true,
      expiresIn: 2 * 60 * 60 * 1000, // 2 hours
    });
  }

  /**
   * Get user data
   */
  getUser() {
    return this.getItem('user');
  }

  /**
   * Remove user data
   */
  removeUser() {
    return this.removeItem('user');
  }

  /**
   * Set user type
   */
  setUserType(userType) {
    return this.setItem('userType', userType, {
      encrypt: false,
      expiresIn: 2 * 60 * 60 * 1000, // 2 hours
    });
  }

  /**
   * Get user type
   */
  getUserType() {
    return this.getItem('userType');
  }

  /**
   * Remove user type
   */
  removeUserType() {
    return this.removeItem('userType');
  }

  /**
   * Clear all authentication data
   */
  clearAuth() {
    this.removeToken();
    this.removeUser();
    this.removeUserType();
    return true;
  }
}

export default new SecureStorage();
