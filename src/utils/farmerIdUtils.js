// Utility functions for farmer ID generation

/**
 * Generate consistent farmer display ID
 * @param {Object} farmer - The farmer object
 * @param {Object} options - Optional configuration
 * @param {Object} options.farmerUniqueIds - Mapping of farmer IDs to unique IDs
 * @param {Function} options.getConfiguredFarmerPrefix - Function to get configured prefix
 * @returns {string} The generated farmer display ID
 */
export const getFarmerDisplayId = (farmer, options = {}) => {
  if (!farmer) return 'N/A';
  
  const { farmerUniqueIds, getConfiguredFarmerPrefix } = options;
  
  // Check for existing farmer ID fields first
  const candidates = [
    farmer.farmerId,
    farmer.farmerCode,
    farmer.farmerUniqueId,
    farmer.famId,
    farmer.famCode,
    farmer.userUniqueId,
    farmer.userId,
    farmer.uniqueId,
    farmerUniqueIds?.[farmer.id], // Include unique IDs mapping if provided
    farmer.cardId
  ];
  
  const firstNonEmpty = candidates.find(v => v !== undefined && v !== null && String(v).trim() !== '');
  if (firstNonEmpty) {
    return String(firstNonEmpty);
  }
  
  // Generate fallback ID using configured prefix or default
  const fallbackNumeric = farmer.id ? String(farmer.id).padStart(5, '0') : '00000';
  
  if (getConfiguredFarmerPrefix) {
    return getConfiguredFarmerPrefix() + '-' + fallbackNumeric;
  } else {
    // Default fallback
    return 'DATE-' + fallbackNumeric;
  }
};

/**
 * Get configured farmer prefix from code formats or default
 * @param {Array} codeFormats - Array of code format configurations
 * @returns {string} The configured prefix or 'DATE' as default
 */
export const getConfiguredFarmerPrefix = (codeFormats = []) => {
  // Try to get from codeFormats if available
  if (codeFormats && codeFormats.length > 0) {
    const farmerFormat = codeFormats.find(f => f.codeType === 'FARMER' && f.isActive);
    if (farmerFormat && farmerFormat.prefix) {
      return farmerFormat.prefix;
    }
  }
  
  // Default fallback
  return 'DATE';
};
