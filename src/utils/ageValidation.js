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
 * @param {Array} ageSettings - Array of age settings from the backend
 * @returns {Object} Validation result
 */
export const validateAgeSync = (age, userType, ageSettings) => {
  const userAgeSetting = ageSettings.find(setting => 
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
