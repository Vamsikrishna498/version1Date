/**
 * Logger Utility
 * 
 * Provides centralized logging that can be disabled in production.
 * Only logs in development mode to avoid performance issues and
 * prevent exposing sensitive information in production.
 * 
 * Usage:
 *   import logger from './utils/logger';
 *   logger.log('User logged in:', user);
 *   logger.error('Error occurred:', error);
 */

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  /**
   * Log general information (only in development)
   * @param {...any} args - Arguments to log
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log error messages (always logged)
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },

  /**
   * Log warning messages (only in development)
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log info messages (only in development)
   * @param {...any} args - Arguments to log
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Log debug messages (only in development)
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Log table data (only in development)
   * @param {any} data - Data to display as table
   */
  table: (data) => {
    if (isDevelopment && console.table) {
      console.table(data);
    }
  },

  /**
   * Start a timer (only in development)
   * @param {string} label - Timer label
   */
  time: (label) => {
    if (isDevelopment && console.time) {
      console.time(label);
    }
  },

  /**
   * End a timer (only in development)
   * @param {string} label - Timer label
   */
  timeEnd: (label) => {
    if (isDevelopment && console.timeEnd) {
      console.timeEnd(label);
    }
  },

  /**
   * Group logs together (only in development)
   * @param {string} label - Group label
   */
  group: (label) => {
    if (isDevelopment && console.group) {
      console.group(label);
    }
  },

  /**
   * End a log group (only in development)
   */
  groupEnd: () => {
    if (isDevelopment && console.groupEnd) {
      console.groupEnd();
    }
  },
};

export default logger;

