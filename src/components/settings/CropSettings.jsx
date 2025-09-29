import React, { useState, useEffect } from 'react';
import { configAPI } from '../../api/apiService';
import '../../styles/settings/CropSettings.css';

const CropSettings = ({ isSuperAdmin, isAdmin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('crop-name');
  
  // Data states
  const [cropNames, setCropNames] = useState([]);
  const [cropTypes, setCropTypes] = useState([]);
  
  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentId: '',
    isActive: true
  });

  const sections = [
    { 
      id: 'crop-name', 
      label: 'Crop Name (Feature)', 
      icon: '🌾', 
      description: 'Add Crop Feature (108 Crop upload)',
      fieldType: 'text'
    },
    { 
      id: 'crop-type', 
      label: 'Crop Type (Variety)', 
      icon: '🌱', 
      description: 'Map Variety to Crop Feature',
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
        case 'crop-name':
          const cropNamesData = await configAPI.getCropNames();
          setCropNames(cropNamesData?.data || cropNamesData || []);
          break;
        case 'crop-type':
          const cropTypesData = await configAPI.getCropTypes();
          setCropTypes(cropTypesData?.data || cropTypesData || []);
          break;
        default:
          break;
      }
    } catch (error) {
      setError(`Failed to load ${activeSection} data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      let submitData;
      
      if (activeSection === 'crop-name') {
        submitData = {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          isActive: formData.isActive,
          type: 'CROP_NAME'
        };
      } else if (activeSection === 'crop-type') {
        submitData = {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          parentId: formData.parentId,
          isActive: formData.isActive,
          type: 'CROP_TYPE'
        };
      }

      if (editingItem) {
        await configAPI.updateCropSetting(editingItem.id, submitData);
      } else {
        await configAPI.createCropSetting(submitData);
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
      code: item.code || '',
      description: item.description || '',
      parentId: item.parentId || '',
      isActive: item.isActive !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (itemId) => {
    if (!isSuperAdmin) {
      setError('Only Super Admin can delete crop settings');
      return;
    }

    if (window.confirm(`Are you sure you want to delete this ${activeSection}?`)) {
      try {
        setLoading(true);
        await configAPI.deleteCropSetting(itemId);
        loadData();
      } catch (error) {
        setError(`Failed to delete ${activeSection}: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      parentId: '',
      isActive: true
    });
  };

  const getCurrentData = () => {
    switch (activeSection) {
      case 'crop-name': return cropNames;
      case 'crop-type': return cropTypes;
      default: return [];
    }
  };

  const getParentOptions = () => {
    return activeSection === 'crop-type' ? cropNames : [];
  };

  const currentData = getCurrentData();
  const parentOptions = getParentOptions();

  return (
    <div className="crop-settings">
      <div className="settings-header">
        <h2>🌾 Crop Settings</h2>
        <p>Manage crop names, varieties, and crop-related configurations</p>
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
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                {activeSection === 'crop-type' && <th>Crop Feature</th>}
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.code}</td>
                  {activeSection === 'crop-type' && (
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
            
            <form onSubmit={handleSubmit} className="crop-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="form-control"
                  placeholder={`Enter ${activeSection} name`}
                />
              </div>
              
              <div className="form-group">
                <label>Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  className="form-control"
                  placeholder={`Enter ${activeSection} code`}
                />
              </div>
              
              {activeSection === 'crop-type' && (
                <div className="form-group">
                  <label>Crop Feature *</label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    required
                    className="form-control"
                  >
                    <option value="">Select Crop Feature</option>
                    {parentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} ({option.code})
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

export default CropSettings;
