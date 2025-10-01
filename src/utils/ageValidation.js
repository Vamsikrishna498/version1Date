import { configAPI } from '../api/apiService';

/**
 * Validates age against configured age settings for a specific user type
 * @param {number} age - The age to validate
 * @param {string} userType - The user type (FARMER, EMPLOYEE, ADMIN, SUPER_ADMIN)
 * @returns {Promise<{isValid: boolean, message: string}>}
 */
export const validateAge = async (age, userType) => {
  try {
    const response = await configAPI.validateAge(age, userType);
    return {
      isValid: response.isValid,
      message: response.message
    };
  } catch (error) {
    console.error('Error validating age:', error);
    return {
      isValid: true, // Default to valid if validation fails
      message: 'Age validation failed'
    };
  }
};

/**
 * Validates age synchronously (for immediate feedback)
 * @param {number} age - The age to validate
 * @param {string} userType - The user type
 * @param {Array|Object} ageSettings - Array or object of age settings from the backend
 * @returns {Object} Validation result
 */
export const validateAgeSync = (age, userType, ageSettings) => {
  // Handle if ageSettings is not provided or is invalid
  if (!ageSettings) {
    return {
      isValid: true,
      message: 'No age restrictions configured'
    };
  }

  let userAgeSetting;
  
  // Handle object format from ConfigurationContext: { farmer: { min: 18, max: 100 } }
  if (!Array.isArray(ageSettings)) {
    const normalizedUserType = userType.toLowerCase();
    userAgeSetting = ageSettings[normalizedUserType];
    
    if (!userAgeSetting || typeof userAgeSetting.min === 'undefined' || typeof userAgeSetting.max === 'undefined') {
      return {
        isValid: true,
        message: 'No age restrictions configured'
      };
    }
    
    // Use min/max from object format
    if (age < userAgeSetting.min) {
      return {
        isValid: false,
        message: `Age must be at least ${userAgeSetting.min} years for ${normalizedUserType} registration`
      };
    }
    
    if (age > userAgeSetting.max) {
      return {
        isValid: false,
        message: `Age must not exceed ${userAgeSetting.max} years for ${normalizedUserType} registration`
      };
    }
    
    return {
      isValid: true,
      message: 'Age is valid'
    };
  }
  
  // Handle array format from backend API
  userAgeSetting = ageSettings.find(setting => 
    setting.userType === userType && setting.isActive
  );
  
  if (!userAgeSetting) {
    return {
      isValid: true,
      message: 'No age restrictions configured'
    };
  }
  
  if (age < userAgeSetting.minValue) {
    return {
      isValid: false,
      message: `Age must be at least ${userAgeSetting.minValue} years for ${userType.toLowerCase()} registration`
    };
  }
  
  if (age > userAgeSetting.maxValue) {
    return {
      isValid: false,
      message: `Age must not exceed ${userAgeSetting.maxValue} years for ${userType.toLowerCase()} registration`
    };
  }
  
  return {
    isValid: true,
    message: 'Age is valid'
  };
};

/**
 * Gets age settings for a specific user type
 * @param {string} userType - The user type
 * @param {Array} ageSettings - Array of age settings from the backend
 * @returns {Object|null} Age setting object or null if not found
 */
export const getAgeSettingForUserType = (userType, ageSettings) => {
  return ageSettings.find(setting => 
    setting.userType === userType && setting.isActive
  ) || null;
};

/**
 * Gets all available user types from age settings
 * @param {Array} ageSettings - Array of age settings from the backend
 * @returns {Array} Array of user types
 */
export const getAvailableUserTypes = (ageSettings) => {
  return ageSettings
    .filter(setting => setting.isActive)
    .map(setting => setting.userType);
};
