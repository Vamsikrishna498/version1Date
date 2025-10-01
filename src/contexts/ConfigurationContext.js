import React, { createContext, useContext, useState, useEffect } from 'react';
import { configAPI } from '../api/apiService';

const ConfigurationContext = createContext();

export const useConfiguration = () => {
  const context = useContext(ConfigurationContext);
  if (!context) {
    throw new Error('useConfiguration must be used within a ConfigurationProvider');
  }
  return context;
};

export const ConfigurationProvider = ({ children }) => {
  // Configuration state
  const [ageSettings, setAgeSettings] = useState({
    farmer: { min: 18, max: 100 },
    employee: { min: 21, max: 65 },
    admin: { min: 25, max: 60 }
  });
  
  // User-type specific education requirements
  const [educationRequirements, setEducationRequirements] = useState({
    farmer: [
      'Illiterate', 'Primary (1-5)', 'Middle (6-8)', 'Secondary (9-10)',
      'Higher Secondary (11-12)', 'Graduate', 'Post Graduate', 'Professional'
    ],
    employee: [
      'Secondary (9-10)', 'Higher Secondary (11-12)', 'Graduate', 'Post Graduate', 'Professional'
    ],
    admin: [
      'Graduate', 'Post Graduate', 'Professional'
    ]
  });
  
  const [cropNames, setCropNames] = useState([
    'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Potato', 
    'Tomato', 'Onion', 'Brinjal', 'Okra', 'Cabbage', 'Cauliflower'
  ]);
  
  const [cropTypes, setCropTypes] = useState([
    'Cereals', 'Pulses', 'Oilseeds', 'Cash Crops', 'Vegetables', 
    'Fruits', 'Spices', 'Medicinal Plants', 'Fodder Crops'
  ]);

  const [codeFormats, setCodeFormats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load configuration data from API
  const loadConfigurationData = async (forceRefresh = false) => {
    // Check if we have recent data and don't need to refresh
    if (!forceRefresh && lastUpdated && (Date.now() - lastUpdated < 5 * 60 * 1000)) { // 5 minutes cache
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading configuration data from API...');
      
      // Load all configuration data in parallel
      const [ageData, educationData, cropNamesData, cropTypesData, codeFormatsData] = await Promise.allSettled([
        configAPI.getAgeSettings(),
        configAPI.getEducationTypes(),
        configAPI.getCropNames(),
        configAPI.getCropTypes(),
        configAPI.getAllCodeFormats()
      ]);

      // Process age settings
      if (ageData.status === 'fulfilled' && ageData.value) {
        try {
          const apiAgeSettings = ageData.value;
          console.log('📊 Age settings from API - Type:', Array.isArray(apiAgeSettings) ? 'array' : typeof apiAgeSettings);
          
          // Transform API response to our format
          // API returns array of settings, we need to map to userType keys
          if (Array.isArray(apiAgeSettings) && apiAgeSettings.length > 0) {
            const transformedSettings = {};
            
            apiAgeSettings.forEach(setting => {
              if (setting && typeof setting === 'object' && setting.isActive) {
                const userType = String(setting.userType || setting.name || '').toLowerCase();
                // Map various user type names to our standard keys
                let key = userType;
                
                // Handle different naming conventions
                if (userType.includes('farmer')) {
                  key = 'farmer';
                } else if (userType.includes('employee')) {
                  key = 'employee';
                } else if (userType.includes('admin')) {
                  key = 'admin';
                } else if (userType.includes('date') || userType.includes('application')) {
                  // If it's a global DATE Application setting, apply to all user types
                  key = 'global';
                }
                
                transformedSettings[key] = {
                  min: Number(setting.minValue || setting.min || 18),
                  max: Number(setting.maxValue || setting.max || 100)
                };
              }
            });
            
            // If we have a global setting, apply it to all user types
            if (transformedSettings.global) {
              const globalSetting = { ...transformedSettings.global };
              transformedSettings.farmer = transformedSettings.farmer || { ...globalSetting };
              transformedSettings.employee = transformedSettings.employee || { ...globalSetting };
              transformedSettings.admin = transformedSettings.admin || { ...globalSetting };
            }
            
            // Merge with defaults to ensure all user types have settings
            const finalSettings = {
              farmer: transformedSettings.farmer || { min: 18, max: 100 },
              employee: transformedSettings.employee || { min: 21, max: 65 },
              admin: transformedSettings.admin || { min: 25, max: 60 }
            };
            
            setAgeSettings(finalSettings);
            console.log('✅ Age settings loaded and transformed');
          } else if (typeof apiAgeSettings === 'object' && !Array.isArray(apiAgeSettings)) {
            // If API already returns the correct format, ensure it has proper structure
            const finalSettings = {
              farmer: apiAgeSettings.farmer || { min: 18, max: 100 },
              employee: apiAgeSettings.employee || { min: 21, max: 65 },
              admin: apiAgeSettings.admin || { min: 25, max: 60 }
            };
            setAgeSettings(finalSettings);
            console.log('✅ Age settings loaded from API (object format)');
          } else {
            console.warn('⚠️ Invalid age settings format from API, using fallback');
            // Use fallback settings
            setAgeSettings({
              farmer: { min: 18, max: 100 },
              employee: { min: 21, max: 65 },
              admin: { min: 25, max: 60 }
            });
          }
        } catch (error) {
          console.error('❌ Error processing age settings:', error);
          // Use fallback settings on error
          setAgeSettings({
            farmer: { min: 18, max: 100 },
            employee: { min: 21, max: 65 },
            admin: { min: 25, max: 60 }
          });
        }
      } else {
        console.warn('⚠️ Using fallback age settings');
      }

      // Process education requirements
      if (educationData.status === 'fulfilled' && educationData.value) {
        try {
          const apiEducationData = educationData.value;
          
          // If API returns user-type specific data, use it
          if (typeof apiEducationData === 'object' && !Array.isArray(apiEducationData)) {
            setEducationRequirements(apiEducationData);
          } else if (Array.isArray(apiEducationData)) {
            // If API returns array, extract education type names and distribute to user types
            // API may return objects with {name, description, id, etc.} or just strings
            const allEducationTypes = apiEducationData.map(item => {
              // If item is an object, extract the name property
              if (typeof item === 'object' && item !== null) {
                return String(item.name || item.typeName || item.educationType || '');
              }
              // If item is already a string, use it
              return String(item);
            }).filter(name => name.trim() !== ''); // Remove empty strings
            
            setEducationRequirements({
              farmer: allEducationTypes,
              employee: allEducationTypes.filter(type => 
                ['Secondary (9-10)', 'Higher Secondary (11-12)', 'Graduate', 'Post Graduate', 'Professional'].includes(type)
              ),
              admin: allEducationTypes.filter(type => 
                ['Graduate', 'Post Graduate', 'Professional'].includes(type)
              )
            });
          } else {
            console.warn('⚠️ Invalid education data format, using fallback');
            setEducationRequirements({
              farmer: [
                'Illiterate', 'Primary (1-5)', 'Middle (6-8)', 'Secondary (9-10)',
                'Higher Secondary (11-12)', 'Graduate', 'Post Graduate', 'Professional'
              ],
              employee: [
                'Secondary (9-10)', 'Higher Secondary (11-12)', 'Graduate', 'Post Graduate', 'Professional'
              ],
              admin: [
                'Graduate', 'Post Graduate', 'Professional'
              ]
            });
          }
          console.log('✅ Education requirements loaded from API');
        } catch (error) {
          console.error('❌ Error processing education data:', error);
          setEducationRequirements({
            farmer: [
              'Illiterate', 'Primary (1-5)', 'Middle (6-8)', 'Secondary (9-10)',
              'Higher Secondary (11-12)', 'Graduate', 'Post Graduate', 'Professional'
            ],
            employee: [
              'Secondary (9-10)', 'Higher Secondary (11-12)', 'Graduate', 'Post Graduate', 'Professional'
            ],
            admin: [
              'Graduate', 'Post Graduate', 'Professional'
            ]
          });
        }
      } else {
        console.warn('⚠️ Using fallback education requirements');
      }

      // Process crop names
      if (cropNamesData.status === 'fulfilled' && cropNamesData.value) {
        try {
          const apiCropNames = cropNamesData.value;
          // Extract names if API returns objects
          const cropNamesArray = Array.isArray(apiCropNames) 
            ? apiCropNames.map(item => {
                if (typeof item === 'object' && item !== null) {
                  return String(item.name || item.cropName || '');
                }
                return String(item);
              }).filter(name => name.trim() !== '')
            : [];
          setCropNames(cropNamesArray.length > 0 ? cropNamesArray : [
            'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Potato', 
            'Tomato', 'Onion', 'Brinjal', 'Okra', 'Cabbage', 'Cauliflower'
          ]);
          console.log('✅ Crop names loaded from API');
        } catch (error) {
          console.error('❌ Error processing crop names:', error);
          setCropNames([
            'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Potato', 
            'Tomato', 'Onion', 'Brinjal', 'Okra', 'Cabbage', 'Cauliflower'
          ]);
        }
      } else {
        console.warn('⚠️ Using fallback crop names');
      }

      // Process crop types
      if (cropTypesData.status === 'fulfilled' && cropTypesData.value) {
        try {
          const apiCropTypes = cropTypesData.value;
          // Extract names if API returns objects
          const cropTypesArray = Array.isArray(apiCropTypes)
            ? apiCropTypes.map(item => {
                if (typeof item === 'object' && item !== null) {
                  return String(item.name || item.typeName || item.cropType || '');
                }
                return String(item);
              }).filter(name => name.trim() !== '')
            : [];
          setCropTypes(cropTypesArray.length > 0 ? cropTypesArray : [
            'Cereals', 'Pulses', 'Oilseeds', 'Cash Crops', 'Vegetables', 
            'Fruits', 'Spices', 'Medicinal Plants', 'Fodder Crops'
          ]);
          console.log('✅ Crop types loaded from API');
        } catch (error) {
          console.error('❌ Error processing crop types:', error);
          setCropTypes([
            'Cereals', 'Pulses', 'Oilseeds', 'Cash Crops', 'Vegetables', 
            'Fruits', 'Spices', 'Medicinal Plants', 'Fodder Crops'
          ]);
        }
      } else {
        console.warn('⚠️ Using fallback crop types');
      }

      // Process code formats
      if (codeFormatsData.status === 'fulfilled' && codeFormatsData.value) {
        setCodeFormats(codeFormatsData.value);
        console.log('✅ Code formats loaded from API');
      }

      setLastUpdated(Date.now());
      console.log('✅ Configuration data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading configuration data:', error);
      setError('Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  };

  // Update configuration data (for Super Admin)
  const updateConfiguration = async (type, data) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      switch (type) {
        case 'age':
          response = await configAPI.createAgeSetting(data);
          setAgeSettings(prev => ({ ...prev, ...data }));
          break;
        case 'education':
          response = await configAPI.createGlobalAreaSetting({ type: 'education', data });
          setEducationRequirements(data);
          break;
        case 'cropNames':
          response = await configAPI.createCropSetting({ type: 'names', data });
          setCropNames(data);
          break;
        case 'cropTypes':
          response = await configAPI.createCropSetting({ type: 'types', data });
          setCropTypes(data);
          break;
        case 'codeFormats':
          response = await configAPI.createCodeFormat(data);
          setCodeFormats(prev => [...prev, response]);
          break;
        default:
          throw new Error(`Unknown configuration type: ${type}`);
      }

      setLastUpdated(Date.now());
      console.log(`✅ Configuration updated: ${type}`);
      
      // Trigger refresh for all connected components
      loadConfigurationData(true);
      
      return response;
    } catch (error) {
      console.error(`❌ Error updating configuration ${type}:`, error);
      setError(`Failed to update ${type} configuration`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Validate age based on current settings
  const validateAge = (age, userType = 'farmer') => {
    // Convert userType to lowercase to match the ageSettings keys
    const normalizedUserType = userType.toLowerCase();
    const settings = ageSettings[normalizedUserType] || ageSettings.farmer;
    
    // Check if settings exist and have min/max properties
    if (!settings || typeof settings.min === 'undefined' || typeof settings.max === 'undefined') {
      // Return valid if no settings configured
      return { isValid: true, message: '' };
    }
    
    if (age < settings.min || age > settings.max) {
      return {
        isValid: false,
        message: `Age must be between ${settings.min} and ${settings.max} for ${normalizedUserType}s`
      };
    }
    return { isValid: true, message: '' };
  };

  // Get education types for specific user type
  const getEducationTypesForUser = (userType = 'farmer') => {
    return educationRequirements[userType] || educationRequirements.farmer;
  };

  // Get configuration by type
  const getConfiguration = (type) => {
    switch (type) {
      case 'ageSettings':
        return ageSettings;
      case 'educationRequirements':
        return educationRequirements;
      case 'cropNames':
        return cropNames;
      case 'cropTypes':
        return cropTypes;
      case 'codeFormats':
        return codeFormats;
      default:
        return null;
    }
  };

  // Load configuration data on mount
  useEffect(() => {
    loadConfigurationData();
  }, []);

  const value = {
    // Configuration data
    ageSettings,
    educationRequirements,
    cropNames,
    cropTypes,
    codeFormats,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Methods
    loadConfigurationData,
    updateConfiguration,
    validateAge,
    getConfiguration,
    getEducationTypesForUser,
    
    // Clear error
    clearError: () => setError(null)
  };

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  );
};

export default ConfigurationContext;
