/**
 * TOKEN REFRESH UTILITY
 *
 * Implements automatic JWT token refresh to maintain session
 * Prevents users from being logged out during active sessions
 */

import secureStorage from './secureStorage';

class TokenRefresh {
  constructor() {
    this.refreshTimer = null;
    this.warningTimer = null;
    this.tokenLifetime = 2 * 60 * 60 * 1000; // 2 hours (match API)
    this.refreshBeforeExpiry = 10 * 60 * 1000; // Refresh 10 minutes before expiry
    this.warningBeforeExpiry = 5 * 60 * 1000; // Warn 5 minutes before expiry
    this.onTokenExpiring = null;
    this.onTokenExpired = null;
  }

  /**
   * Start automatic token refresh
   */
  start(onTokenExpiring, onTokenExpired) {
    this.onTokenExpiring = onTokenExpiring;
    this.onTokenExpired = onTokenExpired;

    this.scheduleRefresh();
  }

  /**
   * Stop automatic token refresh
   */
  stop() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * Schedule token refresh
   */
  scheduleRefresh() {
    this.stop(); // Clear existing timers

    const token = secureStorage.getToken();
    if (!token) return;

    // Decode JWT to get expiration time (simple implementation)
    const expirationTime = this.getTokenExpiration(token);

    if (!expirationTime) {
      console.warn('Unable to determine token expiration');
      return;
    }

    const now = Date.now();
    const timeUntilExpiry = expirationTime - now;
    const timeUntilRefresh = timeUntilExpiry - this.refreshBeforeExpiry;
    const timeUntilWarning = timeUntilExpiry - this.warningBeforeExpiry;

    // Schedule warning
    if (timeUntilWarning > 0) {
      this.warningTimer = setTimeout(() => {
        if (this.onTokenExpiring) {
          this.onTokenExpiring();
        }
      }, timeUntilWarning);
    }

    // Schedule refresh (client-side notification only)
    // Note: Actual refresh requires backend endpoint
    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(() => {
        this.handleTokenRefresh();
      }, timeUntilRefresh);
    } else if (timeUntilExpiry <= 0) {
      // Token already expired
      if (this.onTokenExpired) {
        this.onTokenExpired();
      }
    }
  }

  /**
   * Handle token refresh
   * NOTE: This requires a refresh endpoint on the backend
   * For now, we just notify the user to re-login
   */
  handleTokenRefresh() {
    console.log('Token refresh needed');

    // In a full implementation, you would:
    // 1. Call a /refresh-token endpoint with refresh token
    // 2. Update the stored token with the new one
    // 3. Reschedule the next refresh

    // For now, notify user to re-login
    if (this.onTokenExpiring) {
      this.onTokenExpiring();
    }
  }

  /**
   * Get token expiration time from JWT
   */
  getTokenExpiration(token) {
    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      // Decode payload (base64)
      const payload = JSON.parse(atob(parts[1]));

      // Get expiration time (exp is in seconds, convert to milliseconds)
      if (payload.exp) {
        return payload.exp * 1000;
      }

      // Fallback: Use issued at time + 2 hours
      if (payload.iat) {
        return (payload.iat * 1000) + this.tokenLifetime;
      }

      return null;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token) {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;

    return Date.now() >= expiration;
  }

  /**
   * Get time remaining until token expires (in seconds)
   */
  getTimeUntilExpiry(token) {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return 0;

    const remaining = expiration - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }
}

export default new TokenRefresh();
