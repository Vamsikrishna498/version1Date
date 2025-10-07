/**
 * Input Validation Utilities
 * 
 * Provides validation functions for common input types used in the application.
 * All functions return boolean indicating if the input is valid.
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

/**
 * Validate Indian phone number (10 digits starting with 6-9)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validatePhone = (phone) => {
  if (!phone) return false;
  
  const cleanPhone = phone.toString().replace(/\D/g, '');
  const regex = /^[6-9]\d{9}$/;
  return regex.test(cleanPhone);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Object with isValid boolean and errors object
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: {
        length: true,
        uppercase: true,
        lowercase: true,
        numbers: true,
        specialChar: true
      }
    };
  }

  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = {
    length: password.length < minLength,
    uppercase: !hasUpperCase,
    lowercase: !hasLowerCase,
    numbers: !hasNumbers,
    specialChar: !hasSpecialChar
  };

  const isValid = Object.values(errors).every(error => !error);
  
  return { isValid, errors };
};

/**
 * Get password strength message
 * @param {string} password - Password to check
 * @returns {string} - Strength message
 */
export const getPasswordStrength = (password) => {
  if (!password) return 'No password';
  
  const { isValid, errors } = validatePassword(password);
  
  if (isValid) return 'Strong';
  
  const errorCount = Object.values(errors).filter(Boolean).length;
  
  if (errorCount >= 4) return 'Very Weak';
  if (errorCount >= 3) return 'Weak';
  if (errorCount >= 2) return 'Fair';
  return 'Good';
};

/**
 * Validate Aadhaar number (12 digits)
 * @param {string} aadhaar - Aadhaar number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateAadhaar = (aadhaar) => {
  if (!aadhaar) return false;
  
  const cleanAadhaar = aadhaar.toString().replace(/\D/g, '');
  const regex = /^\d{12}$/;
  return regex.test(cleanAadhaar);
};

/**
 * Validate PAN card number
 * Format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
 * @param {string} pan - PAN number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validatePAN = (pan) => {
  if (!pan || typeof pan !== 'string') return false;
  
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return regex.test(pan.toUpperCase().trim());
};

/**
 * Validate Indian pincode (6 digits)
 * @param {string} pincode - Pincode to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validatePincode = (pincode) => {
  if (!pincode) return false;
  
  const cleanPincode = pincode.toString().replace(/\D/g, '');
  const regex = /^[1-9][0-9]{5}$/;
  return regex.test(cleanPincode);
};

/**
 * Validate name (letters, spaces, and common characters only)
 * @param {string} name - Name to validate
 * @param {number} minLength - Minimum length (default: 2)
 * @param {number} maxLength - Maximum length (default: 50)
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateName = (name, minLength = 2, maxLength = 50) => {
  if (!name || typeof name !== 'string') return false;
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < minLength || trimmedName.length > maxLength) {
    return false;
  }
  
  // Allow letters (including unicode for Indian languages), spaces, hyphens, and apostrophes
  const regex = /^[a-zA-Z\u0900-\u097F\s'-]+$/;
  return regex.test(trimmedName);
};

/**
 * Validate age (must be a number within range)
 * @param {number|string} age - Age to validate
 * @param {number} minAge - Minimum age (default: 18)
 * @param {number} maxAge - Maximum age (default: 120)
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateAge = (age, minAge = 18, maxAge = 120) => {
  const numAge = parseInt(age, 10);
  
  if (isNaN(numAge)) return false;
  
  return numAge >= minAge && numAge <= maxAge;
};

/**
 * Validate date of birth (must be in the past and within age limits)
 * @param {string|Date} dob - Date of birth
 * @param {number} minAge - Minimum age (default: 18)
 * @param {number} maxAge - Maximum age (default: 120)
 * @returns {object} - Object with isValid boolean and age number
 */
export const validateDateOfBirth = (dob, minAge = 18, maxAge = 120) => {
  if (!dob) return { isValid: false, age: null };
  
  const birthDate = new Date(dob);
  const today = new Date();
  
  // Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, age: null };
  }
  
  // Check if date is in the future
  if (birthDate > today) {
    return { isValid: false, age: null };
  }
  
  // Calculate age
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  const isValid = age >= minAge && age <= maxAge;
  
  return { isValid, age };
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateURL = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate IFSC code (Indian bank code)
 * Format: 4 letters, 7 characters (e.g., SBIN0001234)
 * @param {string} ifsc - IFSC code to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateIFSC = (ifsc) => {
  if (!ifsc || typeof ifsc !== 'string') return false;
  
  const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return regex.test(ifsc.toUpperCase().trim());
};

/**
 * Validate bank account number (9-18 digits)
 * @param {string} accountNumber - Account number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateBankAccount = (accountNumber) => {
  if (!accountNumber) return false;
  
  const cleanAccount = accountNumber.toString().replace(/\D/g, '');
  const regex = /^\d{9,18}$/;
  return regex.test(cleanAccount);
};

/**
 * Validate land area (positive number with optional decimal)
 * @param {string|number} area - Land area to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateLandArea = (area) => {
  if (!area) return false;
  
  const numArea = parseFloat(area);
  
  if (isNaN(numArea) || numArea <= 0) return false;
  
  // Maximum realistic land area: 10000 acres
  return numArea <= 10000;
};

/**
 * Sanitize input by removing potentially dangerous characters
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB (default: 5)
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateFileSize = (file, maxSizeMB = 5) => {
  if (!file || !file.size) return false;
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateFileType = (file, allowedTypes = []) => {
  if (!file || !file.type) return false;
  
  if (allowedTypes.length === 0) return true;
  
  return allowedTypes.includes(file.type);
};

/**
 * Validate image file (common image types)
 * @param {File} file - File to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validateFileType(file, allowedTypes);
};

/**
 * Validate document file (PDF, DOC, DOCX)
 * @param {File} file - File to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateDocumentFile = (file) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  return validateFileType(file, allowedTypes);
};

export default {
  validateEmail,
  validatePhone,
  validatePassword,
  getPasswordStrength,
  validateAadhaar,
  validatePAN,
  validatePincode,
  validateName,
  validateAge,
  validateDateOfBirth,
  validateURL,
  validateIFSC,
  validateBankAccount,
  validateLandArea,
  sanitizeInput,
  validateFileSize,
  validateFileType,
  validateImageFile,
  validateDocumentFile,
};

