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
        setAgeSettings(ageData.value);
        console.log('✅ Age settings loaded from API');
      } else {
        console.warn('⚠️ Using fallback age settings');
      }

      // Process education requirements
      if (educationData.status === 'fulfilled' && educationData.value) {
        // If API returns user-type specific data, use it
        if (typeof educationData.value === 'object' && !Array.isArray(educationData.value)) {
          setEducationRequirements(educationData.value);
        } else {
          // If API returns array, distribute to user types
          const allEducationTypes = educationData.value;
          setEducationRequirements({
            farmer: allEducationTypes,
            employee: allEducationTypes.filter(type => 
              ['Secondary (9-10)', 'Higher Secondary (11-12)', 'Graduate', 'Post Graduate', 'Professional'].includes(type)
            ),
            admin: allEducationTypes.filter(type => 
              ['Graduate', 'Post Graduate', 'Professional'].includes(type)
            )
          });
        }
        console.log('✅ Education requirements loaded from API');
      } else {
        console.warn('⚠️ Using fallback education requirements');
      }

      // Process crop names
      if (cropNamesData.status === 'fulfilled' && cropNamesData.value) {
        setCropNames(cropNamesData.value);
        console.log('✅ Crop names loaded from API');
      } else {
        console.warn('⚠️ Using fallback crop names');
      }

      // Process crop types
      if (cropTypesData.status === 'fulfilled' && cropTypesData.value) {
        setCropTypes(cropTypesData.value);
        console.log('✅ Crop types loaded from API');
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
    const settings = ageSettings[userType] || ageSettings.farmer;
    if (age < settings.min || age > settings.max) {
      return {
        isValid: false,
        message: `Age must be between ${settings.min} and ${settings.max} for ${userType}s`
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
