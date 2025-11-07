/**
 * CSRF PROTECTION UTILITY
 *
 * Implements CSRF (Cross-Site Request Forgery) protection
 * using double-submit cookie pattern
 *
 * NOTE: For production, coordinate with backend to implement
 * server-side CSRF token validation
 */

class CSRFProtection {
  constructor() {
    this.tokenKey = 'csrf_token';
    this.headerName = 'X-CSRF-Token';
  }

  /**
   * Generate a random CSRF token
   */
  generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get or create CSRF token
   */
  getToken() {
    let token = sessionStorage.getItem(this.tokenKey);

    if (!token) {
      token = this.generateToken();
      sessionStorage.setItem(this.tokenKey, token);
    }

    return token;
  }

  /**
   * Set CSRF token in session storage
   */
  setToken(token) {
    if (!token) return false;
    sessionStorage.setItem(this.tokenKey, token);
    return true;
  }

  /**
   * Remove CSRF token
   */
  removeToken() {
    sessionStorage.removeItem(this.tokenKey);
  }

  /**
   * Get CSRF token for headers
   */
  getHeaderValue() {
    return this.getToken();
  }

  /**
   * Validate CSRF token (client-side check)
   */
  validateToken(token) {
    const storedToken = this.getToken();
    return token === storedToken;
  }

  /**
   * Rotate CSRF token (should be called after sensitive operations)
   */
  rotateToken() {
    const newToken = this.generateToken();
    this.setToken(newToken);
    return newToken;
  }

  /**
   * Clear CSRF token on logout
   */
  clearToken() {
    this.removeToken();
  }
}

export default new CSRFProtection();
