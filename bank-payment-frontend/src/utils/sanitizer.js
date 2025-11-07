/**
 * XSS PROTECTION UTILITY
 *
 * Sanitizes user input and output to prevent Cross-Site Scripting (XSS) attacks
 * Implements DOMPurify-like functionality without external dependencies
 */

class Sanitizer {
  /**
   * Sanitize HTML content - removes all potentially dangerous tags and attributes
   */
  sanitizeHTML(dirty) {
    if (!dirty || typeof dirty !== 'string') return '';

    // Create a temporary div element
    const temp = document.createElement('div');
    temp.textContent = dirty; // This escapes all HTML

    return temp.innerHTML;
  }

  /**
   * Escape HTML special characters
   */
  escapeHTML(text) {
    if (!text || typeof text !== 'string') return '';

    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, (char) => escapeMap[char]);
  }

  /**
   * Strip all HTML tags from text
   */
  stripHTML(html) {
    if (!html || typeof html !== 'string') return '';

    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  /**
   * Sanitize URL - only allow http, https, and mailto protocols
   */
  sanitizeURL(url) {
    if (!url || typeof url !== 'string') return '';

    const trimmedUrl = url.trim();

    // Allow only safe protocols
    const safeProtocols = ['http:', 'https:', 'mailto:'];

    try {
      const urlObj = new URL(trimmedUrl);
      if (safeProtocols.includes(urlObj.protocol)) {
        return trimmedUrl;
      }
    } catch (e) {
      // Invalid URL - check if it's a relative URL
      if (trimmedUrl.startsWith('/')) {
        return trimmedUrl;
      }
    }

    // Default to empty string for unsafe URLs
    return '';
  }

  /**
   * Sanitize object recursively - escapes all string values
   */
  sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (typeof value === 'string') {
          sanitized[key] = this.escapeHTML(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitize form input - removes dangerous characters
   */
  sanitizeInput(input) {
    if (!input || typeof input !== 'string') return '';

    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick, onload, etc.)
      .replace(/<embed[^>]*>/gi, '') // Remove embed tags
      .replace(/<object[^>]*>/gi, '') // Remove object tags
      .trim();
  }

  /**
   * Safe JSON parse - prevents prototype pollution
   */
  safeJSONParse(jsonString, fallback = null) {
    try {
      const parsed = JSON.parse(jsonString);

      // Check for __proto__ pollution
      if (parsed && typeof parsed === 'object') {
        if (parsed.__proto__ || parsed.constructor || parsed.prototype) {
          console.warn('Potential prototype pollution detected');
          return fallback;
        }
      }

      return parsed;
    } catch (e) {
      console.error('JSON parse error:', e);
      return fallback;
    }
  }

  /**
   * Create safe innerHTML replacement
   */
  setInnerHTML(element, html) {
    if (!element || !html) return;

    // Clear existing content
    element.textContent = '';

    // Create sanitized content
    const sanitized = this.sanitizeHTML(html);
    element.innerHTML = sanitized;
  }

  /**
   * Validate and sanitize user display data
   */
  sanitizeUserData(userData) {
    if (!userData || typeof userData !== 'object') return {};

    return {
      username: this.escapeHTML(userData.username || ''),
      fullName: this.escapeHTML(userData.fullName || ''),
      role: this.escapeHTML(userData.role || ''),
    };
  }

  /**
   * Sanitize payment data for display
   */
  sanitizePaymentData(paymentData) {
    if (!paymentData || typeof paymentData !== 'object') return {};

    return {
      amount: paymentData.amount, // Numbers don't need sanitization
      currency: this.escapeHTML(paymentData.currency || ''),
      provider: this.escapeHTML(paymentData.provider || ''),
      payeeFullName: this.escapeHTML(paymentData.payeeFullName || ''),
      payeeBankName: this.escapeHTML(paymentData.payeeBankName || ''),
      payeeAccountNumber: this.escapeHTML(paymentData.payeeAccountNumber || ''),
      swiftCode: this.escapeHTML(paymentData.swiftCode || ''),
      status: this.escapeHTML(paymentData.status || ''),
    };
  }
}

export default new Sanitizer();
