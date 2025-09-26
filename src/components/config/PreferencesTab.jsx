import React, { useState, useEffect } from 'react';
import { configAPI } from '../../api/apiService';
import './config.css';

const PreferencesTab = ({ isSuperAdmin }) => {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPreference, setEditingPreference] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  const [formData, setFormData] = useState({
    preferenceKey: '',
    preferenceValue: '',
    description: '',
    preferenceType: 'NOTIFICATION'
  });

  const preferenceTypes = [
    { value: 'NOTIFICATION', label: 'Notification Settings' },
    { value: 'SYSTEM', label: 'System Preferences' },
    { value: 'UI', label: 'User Interface' },
    { value: 'INTEGRATION', label: 'Integration Settings' }
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await configAPI.getAllSystemPreferences();
      setPreferences(response?.data || response || []);
    } catch (error) {
      setError('Failed to load system preferences: ' + error.message);
      setPreferences([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingPreference) {
        await configAPI.updateSystemPreference(editingPreference.id, {
          preferenceValue: formData.preferenceValue,
          description: formData.description,
          isActive: true
        });
      } else {
        await configAPI.createSystemPreference(formData);
      }
      
      setShowModal(false);
      setEditingPreference(null);
      resetForm();
      loadPreferences();
    } catch (error) {
      setError('Failed to save system preference: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (preference) => {
    setEditingPreference(preference);
    setFormData({
      preferenceKey: preference.preferenceKey,
      preferenceValue: preference.preferenceValue,
      description: preference.description,
      preferenceType: preference.preferenceType
    });
    setShowModal(true);
  };

  const handleDelete = async (preferenceId) => {
    if (!isSuperAdmin) {
      setError('Only Super Admin can delete preferences');
      return;
    }

    if (window.confirm('Are you sure you want to delete this preference?')) {
      try {
        setLoading(true);
        await configAPI.deleteSystemPreference(preferenceId);
        loadPreferences();
      } catch (error) {
        setError('Failed to delete system preference: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      preferenceKey: '',
      preferenceValue: '',
      description: '',
      preferenceType: 'NOTIFICATION'
    });
  };

  const filteredPreferences = (preferences && Array.isArray(preferences)) ? preferences.filter(preference => {
    const matchesSearch = preference.preferenceKey?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         preference.preferenceValue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         preference.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || preference.preferenceType === filterType;
    
    return matchesSearch && matchesType;
  }) : [];

  const getPreferenceTypeLabel = (type) => {
    const prefType = preferenceTypes.find(t => t.value === type);
    return prefType ? prefType.label : type;
  };

  const renderPreferenceValue = (preference) => {
    if (preference.preferenceKey?.includes('notification') || preference.preferenceKey?.includes('email') || preference.preferenceKey?.includes('sms')) {
      return (
        <span className={`notification-value ${preference.preferenceValue === 'true' ? 'enabled' : 'disabled'}`}>
          {preference.preferenceValue === 'true' ? '🔔 Enabled' : '🔕 Disabled'}
        </span>
      );
    }
    
    if (preference.preferenceKey?.includes('url') || preference.preferenceKey?.includes('endpoint')) {
      return (
        <span className="url-value">{preference.preferenceValue}</span>
      );
    }
    
    return <span className="preference-value">{preference.preferenceValue}</span>;
  };

  const toggleNotificationPreference = async (preference) => {
    try {
      setLoading(true);
      const newValue = preference.preferenceValue === 'true' ? 'false' : 'true';
      await configAPI.updateSystemPreference(preference.id, {
        preferenceValue: newValue,
        description: preference.description,
        isActive: true
      });
      loadPreferences();
    } catch (error) {
      setError('Failed to update preference: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="config-tab">
      <div className="tab-header">
        <h2>🔔 System Preferences</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search preferences..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            {preferenceTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setEditingPreference(null);
              setShowModal(true);
            }}
          >
            ➕ Add New Preference
          </button>
        </div>
      </div>

      <div className="preferences-grid">
        {filteredPreferences.map((preference) => (
          <div key={preference.id} className="preference-card">
            <div className="preference-header">
              <h3>{preference.preferenceKey}</h3>
              <div className="preference-actions">
                {(preference.preferenceKey.includes('notification') || preference.preferenceKey.includes('email') || preference.preferenceKey.includes('sms')) ? (
                  <button
                    className={`btn btn-sm toggle-btn ${preference.preferenceValue === 'true' ? 'enabled' : 'disabled'}`}
                    onClick={() => toggleNotificationPreference(preference)}
                    disabled={loading}
                  >
                    {preference.preferenceValue === 'true' ? '🔔 ON' : '🔕 OFF'}
                  </button>
                ) : (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEdit(preference)}
                  >
                    ✏️ Edit
                  </button>
                )}
                {isSuperAdmin && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(preference.id)}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>
            
            <div className="preference-meta">
              <div className="meta-row">
                <strong>Type:</strong>
                <span className="type-badge">{getPreferenceTypeLabel(preference.preferenceType)}</span>
              </div>
            </div>
            
            <div className="preference-content">
              <strong>Value:</strong>
              <div className="preference-value-container">
                {renderPreferenceValue(preference)}
              </div>
            </div>
            
            {preference.description && (
              <div className="preference-description">
                <strong>Description:</strong>
                <p>{preference.description}</p>
              </div>
            )}
            
            <div className="preference-status">
              <span className={`status-badge ${preference.isActive ? 'active' : 'inactive'}`}>
                {preference.isActive ? '✅ Active' : '❌ Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingPreference ? 'Edit Preference' : 'Add New Preference'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="preference-form">
              <div className="form-group">
                <label>Preference Type *</label>
                <select
                  value={formData.preferenceType}
                  onChange={(e) => setFormData({ ...formData, preferenceType: e.target.value })}
                  required
                  disabled={editingPreference}
                  className="form-control"
                >
                  {preferenceTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Preference Key *</label>
                <input
                  type="text"
                  value={formData.preferenceKey}
                  onChange={(e) => setFormData({ ...formData, preferenceKey: e.target.value })}
                  required
                  disabled={editingPreference}
                  placeholder="e.g., notification.email.enabled"
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Preference Value *</label>
                {formData.preferenceKey.includes('notification') || formData.preferenceKey.includes('email') || formData.preferenceKey.includes('sms') ? (
                  <select
                    value={formData.preferenceValue}
                    onChange={(e) => setFormData({ ...formData, preferenceValue: e.target.value })}
                    required
                    className="form-control"
                  >
                    <option value="">Select Value</option>
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.preferenceValue}
                    onChange={(e) => setFormData({ ...formData, preferenceValue: e.target.value })}
                    required
                    className="form-control"
                    placeholder="Enter preference value..."
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
                  placeholder="Describe the purpose of this preference..."
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingPreference ? 'Update Preference' : 'Create Preference')}
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

export default PreferencesTab;
