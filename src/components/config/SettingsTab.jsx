import React, { useState, useEffect } from 'react';
import { configAPI } from '../../api/apiService';
import './config.css';

const SettingsTab = ({ isSuperAdmin }) => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [formData, setFormData] = useState({
    settingCategory: '',
    settingKey: '',
    settingValue: '',
    description: '',
    dataType: 'STRING'
  });

  const settingCategories = [
    { value: 'LOCATION', label: 'Location Settings' },
    { value: 'GLOBAL_AREA', label: 'Global Area Settings' },
    { value: 'CROP', label: 'Crop Settings' },
    { value: 'SYSTEM', label: 'System Settings' }
  ];

  const dataTypes = [
    { value: 'STRING', label: 'Text' },
    { value: 'INTEGER', label: 'Number' },
    { value: 'DECIMAL', label: 'Decimal' },
    { value: 'BOOLEAN', label: 'True/False' },
    { value: 'JSON', label: 'JSON Data' },
    { value: 'TEXT', label: 'Long Text' }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await configAPI.getAllSystemSettings();
      setSettings(response?.data || response || []);
    } catch (error) {
      setError('Failed to load system settings: ' + error.message);
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingSetting) {
        await configAPI.updateSystemSetting(editingSetting.id, {
          settingValue: formData.settingValue,
          description: formData.description,
          isActive: true
        });
      } else {
        await configAPI.createSystemSetting(formData);
      }
      
      setShowModal(false);
      setEditingSetting(null);
      resetForm();
      loadSettings();
    } catch (error) {
      setError('Failed to save system setting: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting) => {
    setEditingSetting(setting);
    setFormData({
      settingCategory: setting.settingCategory,
      settingKey: setting.settingKey,
      settingValue: setting.settingValue,
      description: setting.description,
      dataType: setting.dataType
    });
    setShowModal(true);
  };

  const handleDelete = async (settingId) => {
    if (!isSuperAdmin) {
      setError('Only Super Admin can delete settings');
      return;
    }

    if (window.confirm('Are you sure you want to delete this setting?')) {
      try {
        setLoading(true);
        await configAPI.deleteSystemSetting(settingId);
        loadSettings();
      } catch (error) {
        setError('Failed to delete system setting: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      settingCategory: '',
      settingKey: '',
      settingValue: '',
      description: '',
      dataType: 'STRING'
    });
  };

  const filteredSettings = (settings && Array.isArray(settings)) ? settings.filter(setting => {
    const matchesSearch = setting.settingKey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.settingValue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || setting.settingCategory === filterCategory;
    
    return matchesSearch && matchesCategory;
  }) : [];

  const getCategoryLabel = (category) => {
    const cat = settingCategories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getDataTypeLabel = (dataType) => {
    const type = dataTypes.find(t => t.value === dataType);
    return type ? type.label : dataType;
  };

  const renderSettingValue = (setting) => {
    switch (setting.dataType) {
      case 'BOOLEAN':
        return (
          <span className={`boolean-value ${setting.settingValue === 'true' ? 'true' : 'false'}`}>
            {setting.settingValue === 'true' ? '✅ True' : '❌ False'}
          </span>
        );
      case 'JSON':
        return (
          <div className="json-value">
            <pre>{JSON.stringify(JSON.parse(setting.settingValue || '{}'), null, 2)}</pre>
          </div>
        );
      default:
        return <span className="setting-value">{setting.settingValue}</span>;
    }
  };

  return (
    <div className="config-tab">
      <div className="tab-header">
        <h2>⚙️ System Settings</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search settings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {settingCategories.map(category => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setEditingSetting(null);
              setShowModal(true);
            }}
          >
            ➕ Add New Setting
          </button>
        </div>
      </div>

      <div className="settings-grid">
        {filteredSettings.map((setting) => (
          <div key={setting.id} className="setting-card">
            <div className="setting-header">
              <h3>{setting.settingKey}</h3>
              <div className="setting-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleEdit(setting)}
                >
                  ✏️ Edit
                </button>
                {isSuperAdmin && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(setting.id)}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>
            
            <div className="setting-meta">
              <div className="meta-row">
                <strong>Category:</strong>
                <span className="category-badge">{getCategoryLabel(setting.settingCategory)}</span>
              </div>
              
              <div className="meta-row">
                <strong>Data Type:</strong>
                <span className="data-type-badge">{getDataTypeLabel(setting.dataType)}</span>
              </div>
            </div>
            
            <div className="setting-content">
              <strong>Value:</strong>
              <div className="setting-value-container">
                {renderSettingValue(setting)}
              </div>
            </div>
            
            {setting.description && (
              <div className="setting-description">
                <strong>Description:</strong>
                <p>{setting.description}</p>
              </div>
            )}
            
            <div className="setting-status">
              <span className={`status-badge ${setting.isActive ? 'active' : 'inactive'}`}>
                {setting.isActive ? '✅ Active' : '❌ Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingSetting ? 'Edit Setting' : 'Add New Setting'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="setting-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Setting Category *</label>
                  <select
                    value={formData.settingCategory}
                    onChange={(e) => setFormData({ ...formData, settingCategory: e.target.value })}
                    required
                    disabled={editingSetting}
                    className="form-control"
                  >
                    <option value="">Select Category</option>
                    {settingCategories.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Data Type *</label>
                  <select
                    value={formData.dataType}
                    onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                    required
                    disabled={editingSetting}
                    className="form-control"
                  >
                    {dataTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Setting Key *</label>
                <input
                  type="text"
                  value={formData.settingKey}
                  onChange={(e) => setFormData({ ...formData, settingKey: e.target.value })}
                  required
                  disabled={editingSetting}
                  placeholder="e.g., farmer.age.min"
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Setting Value *</label>
                {formData.dataType === 'TEXT' || formData.dataType === 'JSON' ? (
                  <textarea
                    value={formData.settingValue}
                    onChange={(e) => setFormData({ ...formData, settingValue: e.target.value })}
                    required
                    className="form-control"
                    rows="4"
                    placeholder="Enter setting value..."
                  />
                ) : formData.dataType === 'BOOLEAN' ? (
                  <select
                    value={formData.settingValue}
                    onChange={(e) => setFormData({ ...formData, settingValue: e.target.value })}
                    required
                    className="form-control"
                  >
                    <option value="">Select Value</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <input
                    type={formData.dataType === 'INTEGER' || formData.dataType === 'DECIMAL' ? 'number' : 'text'}
                    value={formData.settingValue}
                    onChange={(e) => setFormData({ ...formData, settingValue: e.target.value })}
                    required
                    className="form-control"
                    placeholder="Enter setting value..."
                  />
                )}
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-control"
                  rows="3"
                  placeholder="Describe the purpose of this setting..."
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingSetting ? 'Update Setting' : 'Create Setting')}
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

export default SettingsTab;
