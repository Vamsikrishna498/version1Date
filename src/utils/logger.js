// Secure logging utility for production
class Logger {
  static isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  static isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  static log(message, ...args) {
    if (this.isDevelopment()) {
      console.log(message, ...args);
    }
  }

  static info(message, ...args) {
    if (this.isDevelopment()) {
      console.info(message, ...args);
    }
  }

  static warn(message, ...args) {
    if (this.isDevelopment()) {
      console.warn(message, ...args);
    }
  }

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

  static debug(message, ...args) {
    if (this.isDevelopment()) {
      console.debug(message, ...args);
    }
  }

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

  // API logging with request/response sanitization
  static logApiCall(url, method, data = null) {
    if (this.isDevelopment()) {
      console.log(`API ${method.toUpperCase()} ${url}`, data);
    }
  }

  static logApiResponse(url, method, response) {
    if (this.isDevelopment()) {
      console.log(`API ${method.toUpperCase()} ${url} Response:`, response);
    }
  }

  static logApiError(url, method, error) {
    const sanitizedError = this.isProduction() 
      ? this.sanitizeMessage(error.message || 'API Error')
      : error;
    console.error(`API ${method.toUpperCase()} ${url} Error:`, sanitizedError);
  }
}

export default Logger;

