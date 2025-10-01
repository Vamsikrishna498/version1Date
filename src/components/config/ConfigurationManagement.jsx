import React, { useState } from 'react';
import { useConfiguration } from '../../contexts/ConfigurationContext';

const ConfigurationManagement = () => {
  const { 
    ageSettings, 
    educationRequirements, 
    cropNames, 
    cropTypes, 
    updateConfiguration, 
    loading, 
    error,
    clearError 
  } = useConfiguration();

  const [activeTab, setActiveTab] = useState('age');
  const [editMode, setEditMode] = useState({});

  const handleUpdateAgeSettings = async () => {
    try {
      await updateConfiguration('age', ageSettings);
      alert('Age settings updated successfully!');
    } catch (error) {
      alert('Failed to update age settings');
    }
  };

  const handleUpdateEducationRequirements = async () => {
    try {
      await updateConfiguration('education', educationRequirements);
      alert('Education requirements updated successfully!');
    } catch (error) {
      alert('Failed to update education requirements');
    }
  };

  const handleUpdateCropNames = async () => {
    try {
      await updateConfiguration('cropNames', cropNames);
      alert('Crop names updated successfully!');
    } catch (error) {
      alert('Failed to update crop names');
    }
  };

  const handleUpdateCropTypes = async () => {
    try {
      await updateConfiguration('cropTypes', cropTypes);
      alert('Crop types updated successfully!');
    } catch (error) {
      alert('Failed to update crop types');
    }
  };

  const addEducationType = (userType) => {
    const newType = prompt(`Enter new education type for ${userType}:`);
    if (newType && !educationRequirements[userType].includes(newType)) {
      const updated = {
        ...educationRequirements,
        [userType]: [...educationRequirements[userType], newType]
      };
      updateConfiguration('education', updated);
    }
  };

  const removeEducationType = (userType, index) => {
    const updated = {
      ...educationRequirements,
      [userType]: educationRequirements[userType].filter((_, i) => i !== index)
    };
    updateConfiguration('education', updated);
  };

  const addCropName = () => {
    const newCrop = prompt('Enter new crop name:');
    if (newCrop && !cropNames.includes(newCrop)) {
      const updated = [...cropNames, newCrop];
      updateConfiguration('cropNames', updated);
    }
  };

  const removeCropName = (index) => {
    const updated = cropNames.filter((_, i) => i !== index);
    updateConfiguration('cropNames', updated);
  };

  const addCropType = () => {
    const newType = prompt('Enter new crop type:');
    if (newType && !cropTypes.includes(newType)) {
      const updated = [...cropTypes, newType];
      updateConfiguration('cropTypes', updated);
    }
  };

  const removeCropType = (index) => {
    const updated = cropTypes.filter((_, i) => i !== index);
    updateConfiguration('cropTypes', updated);
  };

  return (
    <div className="configuration-management">
      <div className="config-header">
        <h2>🔧 Global Configuration Management</h2>
        <p>Manage system-wide configurations that apply to all dashboards</p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          <span>{error}</span>
          <button onClick={clearError} className="close-error">×</button>
        </div>
      )}

      <div className="config-tabs">
        <button 
          className={`tab-button ${activeTab === 'age' ? 'active' : ''}`}
          onClick={() => setActiveTab('age')}
        >
          Age Settings
        </button>
        <button 
          className={`tab-button ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => setActiveTab('education')}
        >
          Education Types
        </button>
        <button 
          className={`tab-button ${activeTab === 'crops' ? 'active' : ''}`}
          onClick={() => setActiveTab('crops')}
        >
          Crop Settings
        </button>
      </div>

      <div className="config-content">
        {activeTab === 'age' && (
          <div className="config-section">
            <h3>Age Validation Settings</h3>
            <div className="age-settings">
              {Object.entries(ageSettings).map(([userType, settings]) => (
                <div key={userType} className="age-setting-item">
                  <label>{userType.toUpperCase()}</label>
                  <div className="age-inputs">
                    <input
                      type="number"
                      value={settings.min}
                      onChange={(e) => {
                        const newSettings = {
                          ...ageSettings,
                          [userType]: { ...settings, min: parseInt(e.target.value) || 0 }
                        };
                        updateConfiguration('age', newSettings);
                      }}
                      placeholder="Min Age"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      value={settings.max}
                      onChange={(e) => {
                        const newSettings = {
                          ...ageSettings,
                          [userType]: { ...settings, max: parseInt(e.target.value) || 100 }
                        };
                        updateConfiguration('age', newSettings);
                      }}
                      placeholder="Max Age"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleUpdateAgeSettings} disabled={loading}>
              {loading ? 'Updating...' : 'Save Age Settings'}
            </button>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="config-section">
            <h3>Education Requirements by User Type</h3>
            
            {Object.entries(educationRequirements).map(([userType, types]) => (
              <div key={userType} className="user-type-education-section">
                <h4>{userType.toUpperCase()} Education Requirements</h4>
                <div className="education-types">
                  {types.map((type, index) => (
                    <div key={index} className="education-type-item">
                      <span>{type}</span>
                      <button onClick={() => removeEducationType(userType, index)}>Remove</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addEducationType(userType)}>
                  Add Education Type for {userType}
                </button>
              </div>
            ))}
            
            <button onClick={handleUpdateEducationRequirements} disabled={loading}>
              {loading ? 'Updating...' : 'Save Education Requirements'}
            </button>
          </div>
        )}

        {activeTab === 'crops' && (
          <div className="config-section">
            <h3>Crop Settings</h3>
            
            <div className="crop-section">
              <h4>Crop Names</h4>
              <div className="crop-items">
                {cropNames.map((crop, index) => (
                  <div key={index} className="crop-item">
                    <span>{crop}</span>
                    <button onClick={() => removeCropName(index)}>Remove</button>
                  </div>
                ))}
              </div>
              <button onClick={addCropName}>Add Crop Name</button>
            </div>

            <div className="crop-section">
              <h4>Crop Types</h4>
              <div className="crop-items">
                {cropTypes.map((type, index) => (
                  <div key={index} className="crop-item">
                    <span>{type}</span>
                    <button onClick={() => removeCropType(index)}>Remove</button>
                  </div>
                ))}
              </div>
              <button onClick={addCropType}>Add Crop Type</button>
            </div>

            <button onClick={handleUpdateCropNames} disabled={loading}>
              {loading ? 'Updating...' : 'Save Crop Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationManagement;
