import React, { useState, useEffect } from 'react';
import { configAPI } from '../../api/apiService';
import '../../styles/settings/GlobalAreaSettings.css';

const GlobalAreaSettings = ({ isSuperAdmin, isAdmin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('age');
  
  // Data states
  const [ageSettings, setAgeSettings] = useState([]);
  const [educationTypes, setEducationTypes] = useState([]);
  const [educationCategories, setEducationCategories] = useState([]);
  
  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    minValue: '',
    maxValue: '',
    description: '',
    parentId: '',
    userType: '',
    isActive: true
  });
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});

  const sections = [
    { 
      id: 'age', 
      label: 'Age', 
      icon: '👥', 
      description: 'Define global age limit for entire DATE project',
      fieldType: 'number'
    },
    { 
      id: 'education', 
      label: 'Education', 
      icon: '🎓', 
      description: 'Add Education',
      fieldType: 'text'
    },
    { 
      id: 'type', 
      label: 'Type', 
      icon: '📋', 
      description: 'Map Type to Education',
      fieldType: 'text'
    }
  ];

  // Validation functions
  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'name':
        if (!value || value.trim().length === 0) {
          return 'Name is required';
        }
        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        if (value.trim().length > 100) {
          return 'Name must be less than 100 characters';
        }
        return null;
        
      case 'userType':
        if (!value || value.trim().length === 0) {
          return 'User type is required';
        }
        return null;
        
      case 'minValue':
        if (!value || value.toString().trim().length === 0) {
          return 'Minimum age is required';
        }
        const minNum = parseInt(value);
        if (isNaN(minNum)) {
          return 'Minimum age must be a valid number';
        }
        if (minNum < 1) {
          return 'Minimum age must be at least 1';
        }
        if (minNum > 100) {
          return 'Minimum age must not exceed 100';
        }
        return null;
        
      case 'maxValue':
        if (!value || value.toString().trim().length === 0) {
          return 'Maximum age is required';
        }
        const maxNum = parseInt(value);
        if (isNaN(maxNum)) {
          return 'Maximum age must be a valid number';
        }
        if (maxNum < 1) {
          return 'Maximum age must be at least 1';
        }
        if (maxNum > 100) {
          return 'Maximum age must not exceed 100';
        }
        // Check if max is greater than min
        const minValue = parseInt(formData.minValue);
        if (!isNaN(minValue) && maxNum <= minValue) {
          return 'Maximum age must be greater than minimum age';
        }
        return null;
        
      case 'parentId':
        if (activeSection === 'type' && (!value || value.trim().length === 0)) {
          return 'Education type is required';
        }
        return null;
        
      default:
        return null;
    }
  };

  const validateForm = () => {
    const errors = {};
    const fieldsToValidate = ['name'];
    
    if (activeSection === 'age') {
      fieldsToValidate.push('userType', 'minValue', 'maxValue');
    } else if (activeSection === 'type') {
      fieldsToValidate.push('parentId');
    }
    
    console.log('Validating form with data:', formData);
    console.log('Fields to validate:', fieldsToValidate);
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
        console.log(`Validation error for ${field}:`, error);
      }
    });
    
    console.log('Validation errors:', errors);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Special validation for maxValue when minValue changes
    if (field === 'minValue' && formData.maxValue) {
      const maxError = validateField('maxValue', formData.maxValue);
      if (maxError) {
        setValidationErrors(prev => ({ ...prev, maxValue: maxError }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.maxValue;
          return newErrors;
        });
      }
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSection]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      switch (activeSection) {
        case 'age':
          const ageData = await configAPI.getAgeSettings();
          console.log('Age API Response:', ageData);
          setAgeSettings(ageData?.data || ageData || []);
          break;
        case 'education':
          const educationData = await configAPI.getEducationTypes();
          console.log('Education API Response:', educationData);
          console.log('Education Data Details:', JSON.stringify(educationData, null, 2));
          const processedData = educationData?.data || educationData || [];
          console.log('Processed Education Data:', processedData);
          setEducationTypes(processedData);
          break;
        case 'type':
          const typeData = await configAPI.getEducationCategories();
          console.log('Type API Response:', typeData);
          setEducationCategories(typeData?.data || typeData || []);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`API Error for ${activeSection}:`, error);
      setError(`Failed to load ${activeSection} data: ${error.message}. The backend API endpoint may not be implemented yet.`);
      // Set empty arrays to clear any mock data
      switch (activeSection) {
        case 'age':
          setAgeSettings([]);
          break;
        case 'education':
          setEducationTypes([]);
          break;
        case 'type':
          setEducationCategories([]);
          break;
        default:
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched first to show validation errors
    const allFields = ['name'];
    if (activeSection === 'age') {
      allFields.push('userType', 'minValue', 'maxValue');
    } else if (activeSection === 'type') {
      allFields.push('parentId');
    }
    
    const touchedFields = {};
    allFields.forEach(field => {
      touchedFields[field] = true;
    });
    setTouched(touchedFields);
    
    // Validate form after marking fields as touched
    if (!validateForm()) {
      setError('Please fix all validation errors before saving.');
      return;
    }
    
    try {
      setLoading(true);
      
      let submitData;
      
      if (activeSection === 'age') {
        submitData = {
          name: formData.name,
          minValue: parseInt(formData.minValue),
          maxValue: parseInt(formData.maxValue),
          description: formData.description,
          userType: formData.userType,
          isActive: formData.isActive
        };
        
        // Use the specific age setting API
        if (editingItem) {
          // For age settings, we need to use the general update endpoint with type
          submitData.type = 'AGE_SETTING';
          await configAPI.updateGlobalAreaSetting(editingItem.id, submitData);
        } else {
          await configAPI.createAgeSetting(submitData);
        }
      } else if (activeSection === 'education') {
        submitData = {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          type: 'EDUCATION_TYPE'
        };
        
        if (editingItem) {
          await configAPI.updateGlobalAreaSetting(editingItem.id, submitData);
        } else {
          await configAPI.createGlobalAreaSetting(submitData);
        }
      } else if (activeSection === 'type') {
        submitData = {
          name: formData.name,
          description: formData.description,
          parentId: formData.parentId,
          isActive: formData.isActive,
          type: 'EDUCATION_CATEGORY'
        };
        
        if (editingItem) {
          await configAPI.updateGlobalAreaSetting(editingItem.id, submitData);
        } else {
          await configAPI.createGlobalAreaSetting(submitData);
        }
      }
      
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      loadData();
    } catch (error) {
      setError(`Failed to save ${activeSection}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      minValue: item.minValue || '',
      maxValue: item.maxValue || '',
      description: item.description || '',
      parentId: item.parentId || '',
      userType: item.userType || '',
      isActive: item.isActive !== false
    });
    setValidationErrors({});
    setTouched({});
    setShowModal(true);
  };

  const handleDelete = async (itemId) => {
    if (!isSuperAdmin) {
      setError('Only Super Admin can delete global area settings');
      return;
    }

    if (window.confirm(`Are you sure you want to delete this ${activeSection} setting?`)) {
      try {
        setLoading(true);
        console.log('Attempting to delete item:', itemId, 'from section:', activeSection);
        console.log('Current data before delete:', currentData);
        const deleteResponse = await configAPI.deleteGlobalAreaSetting(itemId);
        console.log('Delete API response:', deleteResponse);
        console.log('Delete successful, reloading data...');
        
        // Force clear the current state first
        switch (activeSection) {
          case 'age':
            setAgeSettings([]);
            break;
          case 'education':
            setEducationTypes([]);
            break;
          case 'type':
            setEducationCategories([]);
            break;
        }
        
        // Small delay to ensure state update is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Then reload the data
        await loadData();
        console.log('Data reloaded after delete');
      } catch (error) {
        console.error('Delete error:', error);
        console.error('Delete error details:', error.response?.data || error.message);
        setError(`Failed to delete ${activeSection}: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      minValue: activeSection === 'age' ? '18' : '',
      maxValue: activeSection === 'age' ? '90' : '',
      description: '',
      parentId: '',
      userType: activeSection === 'age' ? 'GLOBAL' : '',
      isActive: true
    });
    setValidationErrors({});
    setTouched({});
  };

  const getCurrentData = () => {
    switch (activeSection) {
      case 'age': return ageSettings;
      case 'education': return educationTypes;
      case 'type': return educationCategories;
      default: return [];
    }
  };

  const getParentOptions = () => {
    return activeSection === 'type' ? educationTypes : [];
  };

  const currentData = getCurrentData();
  const parentOptions = getParentOptions();

  return (
    <div className="global-area-settings">
      <div className="settings-header">
        <h2>🌐 Global Area Settings</h2>
        <p>Configure global settings including age limits for entire DATE project, education types, and categories</p>
      </div>

      <div className="section-navigation">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`section-button ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="section-icon">{section.icon}</span>
            <div className="section-info">
              <span className="section-label">{section.label}</span>
              <span className="section-description">{section.description}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="section-content">
        <div className="content-header">
          <h3>
            {sections.find(s => s.id === activeSection)?.icon} {sections.find(s => s.id === activeSection)?.label}
          </h3>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setEditingItem(null);
              setShowModal(true);
            }}
          >
            ➕ Add {sections.find(s => s.id === activeSection)?.label}
          </button>
        </div>

        <div className="data-table">
          {currentData.length === 0 ? (
            <div className="no-data-message">
              <p>No {activeSection} data available. The backend API endpoint may not be implemented yet.</p>
              <p>Please check the browser console for API error details.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  {activeSection === 'age' && <th>User Type</th>}
                  {activeSection === 'age' && <th>Min Value</th>}
                  {activeSection === 'age' && <th>Max Value</th>}
                  {activeSection === 'type' && <th>Education Type</th>}
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  {activeSection === 'age' && <td>{item.userType || 'GLOBAL'}</td>}
                  {activeSection === 'age' && <td>{item.minValue}</td>}
                  {activeSection === 'age' && <td>{item.maxValue}</td>}
                  {activeSection === 'type' && (
                    <td>
                      {parentOptions.find(p => p.id === item.parentId)?.name || 'N/A'}
                    </td>
                  )}
                  <td>{item.description || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
                      {item.isActive ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(item)}
                    >
                      ✏️ Edit
                    </button>
                    {isSuperAdmin && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(item.id)}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {editingItem ? 'Edit' : 'Add'} {sections.find(s => s.id === activeSection)?.label}
              </h3>
              <button className="close-btn" onClick={() => {
              setShowModal(false);
              setValidationErrors({});
              setTouched({});
              setError('');
            }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="global-area-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  required
                  className={`form-control ${validationErrors.name && (touched.name || Object.keys(validationErrors).length > 0) ? 'error' : ''}`}
                  placeholder={activeSection === 'age' ? 'Enter project name (e.g., DATE Application, Farmer Registration, Employee Module)' : `Enter ${activeSection} name`}
                />
                {validationErrors.name && (touched.name || Object.keys(validationErrors).length > 0) && (
                  <div className="validation-error">
                    <span className="error-icon">⚠️</span>
                    {validationErrors.name}
                  </div>
                )}
              </div>
              
              {activeSection === 'age' && (
                <div className="form-group">
                  <label>User Type *</label>
                  <select
                    value={formData.userType}
                    onChange={(e) => handleInputChange('userType', e.target.value)}
                    onBlur={() => handleBlur('userType')}
                    required
                    className={`form-control ${validationErrors.userType && (touched.userType || Object.keys(validationErrors).length > 0) ? 'error' : ''}`}
                  >
                    <option value="">Select User Type</option>
                    <option value="GLOBAL">Global (All Users)</option>
                    <option value="FARMER">Farmer</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                    <option value="FPO">FPO Member</option>
                  </select>
                  {validationErrors.userType && (touched.userType || Object.keys(validationErrors).length > 0) && (
                    <div className="validation-error">
                      <span className="error-icon">⚠️</span>
                      {validationErrors.userType}
                    </div>
                  )}
                </div>
              )}
              
              {activeSection === 'age' && (
                <>
                  
                  <div className="form-group">
                    <label>Minimum Age *</label>
                    <input
                      type="number"
                      value={formData.minValue}
                      onChange={(e) => handleInputChange('minValue', e.target.value)}
                      onBlur={() => handleBlur('minValue')}
                      required
                      className={`form-control ${validationErrors.minValue && (touched.minValue || Object.keys(validationErrors).length > 0) ? 'error' : ''}`}
                      placeholder="Enter minimum age"
                      min="1"
                      max="100"
                    />
                    {validationErrors.minValue && (touched.minValue || Object.keys(validationErrors).length > 0) && (
                      <div className="validation-error">
                        <span className="error-icon">⚠️</span>
                        {validationErrors.minValue}
                      </div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Maximum Age *</label>
                    <input
                      type="number"
                      value={formData.maxValue}
                      onChange={(e) => handleInputChange('maxValue', e.target.value)}
                      onBlur={() => handleBlur('maxValue')}
                      required
                      className={`form-control ${validationErrors.maxValue && (touched.maxValue || Object.keys(validationErrors).length > 0) ? 'error' : ''}`}
                      placeholder="Enter maximum age"
                      min="1"
                      max="100"
                    />
                    {validationErrors.maxValue && (touched.maxValue || Object.keys(validationErrors).length > 0) && (
                      <div className="validation-error">
                        <span className="error-icon">⚠️</span>
                        {validationErrors.maxValue}
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {activeSection === 'type' && (
                <div className="form-group">
                  <label>Education Type *</label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    required
                    className="form-control"
                  >
                    <option value="">Select Education Type</option>
                    {parentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-control"
                  rows="3"
                  placeholder="Enter description"
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <div className="custom-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="checkbox-input"
                    />
                    <span className="checkmark"></span>
                  </div>
                  <span className="checkbox-text">Active</span>
                </label>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  setValidationErrors({});
                  setTouched({});
                  setError('');
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}
    </div>
  );
};

export default GlobalAreaSettings;
