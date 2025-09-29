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
    isActive: true
  });

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
    try {
      setLoading(true);
      
      let submitData;
      
      if (activeSection === 'age') {
        submitData = {
          name: formData.name,
          minValue: parseInt(formData.minValue),
          maxValue: parseInt(formData.maxValue),
          description: formData.description,
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
      isActive: item.isActive !== false
    });
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
      name: activeSection === 'age' ? 'DATE Application' : '',
      minValue: activeSection === 'age' ? '18' : '',
      maxValue: activeSection === 'age' ? '90' : '',
      description: '',
      parentId: '',
      isActive: true
    });
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
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="global-area-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="form-control"
                  placeholder={activeSection === 'age' ? 'Enter project name (e.g., DATE Application)' : `Enter ${activeSection} name`}
                />
              </div>
              
              {activeSection === 'age' && (
                <>
                  
                  <div className="form-group">
                    <label>Minimum Age *</label>
                    <input
                      type="number"
                      value={formData.minValue}
                      onChange={(e) => setFormData({ ...formData, minValue: e.target.value })}
                      required
                      className="form-control"
                      placeholder="Enter minimum age"
                      min="1"
                      max="100"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Maximum Age *</label>
                    <input
                      type="number"
                      value={formData.maxValue}
                      onChange={(e) => setFormData({ ...formData, maxValue: e.target.value })}
                      required
                      className="form-control"
                      placeholder="Enter maximum age"
                      min="1"
                      max="100"
                    />
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
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
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
