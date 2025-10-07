/**
 * Secure Logger Utility
 * 
 * Provides centralized logging with security features for production.
 * - Logs are disabled in production (except errors)
 * - Sensitive data is sanitized in production error logs
 * - Includes API request/response logging utilities
 * 
 * Usage:
 *   import Logger from './utils/logger';
 *   Logger.log('User logged in:', user);
 *   Logger.error('Error occurred:', error);
 *   Logger.logApiCall('/api/users', 'GET', data);
 */

class Logger {
  /**
   * Check if running in development mode
   * @returns {boolean}
   */
  static isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Check if running in production mode
   * @returns {boolean}
   */
  static isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Log general information (only in development)
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  static log(message, ...args) {
    if (this.isDevelopment()) {
      console.log(message, ...args);
    }
  }

  /**
   * Log info messages (only in development)
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  static info(message, ...args) {
    if (this.isDevelopment()) {
      console.info(message, ...args);
    }
  }

  /**
   * Log warning messages (only in development)
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  static warn(message, ...args) {
    if (this.isDevelopment()) {
      console.warn(message, ...args);
    }
  }

  /**
   * Log error messages (always logged, but sanitized in production)
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  static error(message, ...args) {
    // Always log errors, but sanitize sensitive data in production
    if (this.isProduction()) {
      // In production, only log error messages without sensitive data
      const sanitizedMessage = this.sanitizeMessage(message);
      console.error(sanitizedMessage);
    } else {
      console.error(message, ...args);
    }
  }

  /**
   * Log debug messages (only in development)
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  static debug(message, ...args) {
    if (this.isDevelopment()) {
      console.debug(message, ...args);
    }
  }

  /**
   * Log table data (only in development)
   * @param {any} data - Data to display as table
   */
  static table(data) {
    if (this.isDevelopment() && console.table) {
      console.table(data);
    }
  }

  /**
   * Start a timer (only in development)
   * @param {string} label - Timer label
   */
  static time(label) {
    if (this.isDevelopment() && console.time) {
      console.time(label);
    }
  }

  /**
   * End a timer (only in development)
   * @param {string} label - Timer label
   */
  static timeEnd(label) {
    if (this.isDevelopment() && console.timeEnd) {
      console.timeEnd(label);
    }
  }

  /**
   * Group logs together (only in development)
   * @param {string} label - Group label
   */
  static group(label) {
    if (this.isDevelopment() && console.group) {
      console.group(label);
    }
  }

  /**
   * End a log group (only in development)
   */
  static groupEnd() {
    if (this.isDevelopment() && console.groupEnd) {
      console.groupEnd();
    }
  }

  /**
   * Sanitize message to remove sensitive data patterns
   * @param {any} message - Message to sanitize
   * @returns {string} Sanitized message
   */
  static sanitizeMessage(message) {
    if (typeof message !== 'string') {
      return 'Error occurred';
    }
    
    // Remove potential sensitive data patterns
    return message
      .replace(/password[^,}]*/gi, 'password=***')
      .replace(/token[^,}]*/gi, 'token=***')
      .replace(/secret[^,}]*/gi, 'secret=***')
      .replace(/key[^,}]*/gi, 'key=***')
      .replace(/email[^,}]*/gi, 'email=***')
      .replace(/phone[^,}]*/gi, 'phone=***');
  }

  /**
   * Log API calls with request data (only in development)
   * @param {string} url - API endpoint URL
   * @param {string} method - HTTP method
   * @param {any} data - Request data
   */
  static logApiCall(url, method, data = null) {
    if (this.isDevelopment()) {
      console.log(`API ${method.toUpperCase()} ${url}`, data);
    }
  }

  /**
   * Log API responses (only in development)
   * @param {string} url - API endpoint URL
   * @param {string} method - HTTP method
   * @param {any} response - Response data
   */
  static logApiResponse(url, method, response) {
    if (this.isDevelopment()) {
      console.log(`API ${method.toUpperCase()} ${url} Response:`, response);
    }
  }

  /**
   * Log API errors (always logged, but sanitized in production)
   * @param {string} url - API endpoint URL
   * @param {string} method - HTTP method
   * @param {Error} error - Error object
   */
  static logApiError(url, method, error) {
    const sanitizedError = this.isProduction() 
      ? this.sanitizeMessage(error.message || 'API Error')
      : error;
    console.error(`API ${method.toUpperCase()} ${url} Error:`, sanitizedError);
  }
}

export default Logger;
