/**
 * Environment detection and API origin utilities
 * Helps with consistent API origin detection across different environments
 */

/**
 * Detects if we're running in a staging/production environment
 * @returns {boolean} True if staging/production, false if local development
 */
export const isStagingEnvironment = () => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname !== 'localhost' && hostname !== '127.0.0.1';
};

/**
 * Detects if we're running in a local development environment
 * @returns {boolean} True if local development, false otherwise
 */
export const isLocalDevelopment = () => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

/**
 * Gets the effective API origin based on current environment
 * @param {string} defaultApiOrigin - Default API origin from environment variables
 * @returns {string} Effective API origin for the current environment
 */
export const getEffectiveApiOrigin = (defaultApiOrigin) => {
  if (typeof window === 'undefined') return defaultApiOrigin;
  
  const isStaging = isStagingEnvironment();
  
  if (isStaging) {
    // For staging/production, use the current origin
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    const stagingOrigin = `${protocol}//${hostname}${port ? ':' + port : ''}`;
    console.log('Environment Utils: Detected staging environment, using origin:', stagingOrigin);
    return stagingOrigin;
  }
  
  // For local development, check if we're using a different origin
  const currentOrigin = window.location.origin;
  if (currentOrigin !== defaultApiOrigin) {
    console.log('Environment Utils: Local development with different origin, using:', currentOrigin);
    return currentOrigin;
  }
  
  return defaultApiOrigin;
};

/**
 * Builds multiple URL candidates for logo loading with environment-aware paths
 * @param {string} basePath - Base path for the logo file
 * @param {string} companyId - Company ID for organized storage
 * @param {string} filename - Logo filename
 * @param {string} apiOrigin - API origin to use
 * @returns {Array<string>} Array of URL candidates to try
 */
export const buildLogoCandidates = (basePath, companyId, filename, apiOrigin) => {
  const candidates = [];
  
  if (!basePath || !filename) return candidates;
  
  // If it's already an absolute URL, add it as-is
  if (basePath.startsWith('http')) {
    candidates.push(basePath);
    return candidates;
  }
  
  const tail = filename.split('/').pop();
  
  if (companyId) {
    // Primary staging-friendly paths - try multiple variations
    candidates.push(`${apiOrigin}/api/public/uploads/company-logos/${companyId}/${tail}`);
    candidates.push(`${apiOrigin}/uploads/company-logos/${companyId}/${tail}`);
    candidates.push(`${apiOrigin}/api/public/files/company-logos/${companyId}/${tail}`);
    candidates.push(`${apiOrigin}/files/company-logos/${companyId}/${tail}`);
    
    // Additional variations for different backend configurations
    candidates.push(`${apiOrigin}/api/companies/${companyId}/logos/${tail}`);
    candidates.push(`${apiOrigin}/companies/${companyId}/logos/${tail}`);
    candidates.push(`${apiOrigin}/static/uploads/company-logos/${companyId}/${tail}`);
    candidates.push(`${apiOrigin}/static/files/company-logos/${companyId}/${tail}`);
  }
  
  if (basePath.startsWith('/uploads/')) {
    candidates.push(`${apiOrigin}/api/public${basePath}`);
    candidates.push(`${apiOrigin}${basePath}`);
    candidates.push(`${apiOrigin}/static${basePath}`);
  }
  
  if (basePath.startsWith('/files/')) {
    candidates.push(`${apiOrigin}/api/public${basePath}`);
    candidates.push(`${apiOrigin}${basePath}`);
    candidates.push(`${apiOrigin}/static${basePath}`);
  }
  
  // Generic fallback paths with multiple variations
  candidates.push(`${apiOrigin}/api/public/${basePath.replace(/^\//, '')}`);
  candidates.push(`${apiOrigin}/${basePath.replace(/^\//, '')}`);
  candidates.push(`${apiOrigin}/static/${basePath.replace(/^\//, '')}`);
  
  // Remove duplicates and return
  return Array.from(new Set(candidates));
};

/**
 * Adds cache-busting parameter to URL
 * @param {string} url - URL to add cache-busting to
 * @param {number|string} version - Version number or timestamp
 * @returns {string} URL with cache-busting parameter
 */
export const addCacheBust = (url, version) => {
  if (!url) return url;
  const sep = url.includes('?') ? '&' : '?';
  const versionParam = version ?? Date.now();
  return `${url}${sep}v=${versionParam}`;
};

/**
 * Enhanced logging for debugging environment issues
 * @param {string} context - Context for the log (e.g., 'LogoCell', 'BrandingContext')
 * @param {Object} data - Data to log
 */
export const logEnvironmentDebug = (context, data) => {
  console.log(`${context} Environment Debug:`, {
    ...data,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'undefined',
    windowLocation: typeof window !== 'undefined' ? window.location.href : 'undefined',
    isStaging: isStagingEnvironment(),
    isLocal: isLocalDevelopment(),
    nodeEnv: process.env.NODE_ENV
  });
};

export default {
  isStagingEnvironment,
  isLocalDevelopment,
  getEffectiveApiOrigin,
  buildLogoCandidates,
  addCacheBust,
  logEnvironmentDebug
};
