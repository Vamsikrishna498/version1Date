import React, { useState, useEffect } from 'react';
import { configAPI } from '../../api/apiService';
import './config.css';

const PersonalizationTab = ({ isSuperAdmin, onFormatsUpdated }) => {
  const [codeFormats, setCodeFormats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFormat, setEditingFormat] = useState(null);

  const [formData, setFormData] = useState({
    codeType: '',
    prefix: '',
    startingNumber: '1',
    description: ''
  });

  const codeTypes = [
    { value: 'FARMER', label: 'Farmer Code' },
    { value: 'EMPLOYEE', label: 'Employee Code' }
  ];

  useEffect(() => {
    loadCodeFormats();
  }, []);

  const loadCodeFormats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await configAPI.getAllCodeFormats();
      setCodeFormats(response?.data || response || []);
    } catch (error) {
      setError('Failed to load code formats: ' + error.message);
      setCodeFormats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const submitData = {
        ...formData,
        startingNumber: parseInt(formData.startingNumber) || 1
      };
      
      console.log('📝 Submitting code format data:', submitData);
      
      if (editingFormat) {
        // Don't send currentNumber or codeType when updating - preserve existing values
        const { currentNumber, codeType, ...updateData } = submitData;
        await configAPI.updateCodeFormat(editingFormat.id, updateData);
      } else {
        await configAPI.createCodeFormat(submitData);
      }
      
      setShowModal(false);
      setEditingFormat(null);
      resetForm();
      loadCodeFormats();
      
      // Notify parent component that formats have been updated
      if (onFormatsUpdated) {
        onFormatsUpdated();
      }
    } catch (error) {
      console.error('❌ Failed to save code format:', error);
      setError('Failed to save code format: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (format) => {
    setEditingFormat(format);
    setFormData({
      codeType: format.codeType,
      prefix: format.prefix,
      startingNumber: format.startingNumber.toString(),
      description: format.description
    });
    setShowModal(true);
  };

  const handleTestCode = async (codeType) => {
    try {
      setLoading(true);
      setError('');
      console.log('🧪 Testing code generation for:', codeType);
      const response = await configAPI.generateNextCode(codeType);
      console.log('🧪 Test response:', response);
      
      // Handle different response structures
      const nextCode = response?.nextCode || response?.data?.nextCode || 'Unknown';
      alert(`Next generated code would be: ${nextCode}`);
    } catch (error) {
      console.error('❌ Test code generation failed:', error);
      setError('Failed to generate test code: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      codeType: '',
      prefix: '',
      startingNumber: '1',
      description: ''
    });
  };

  const getCodeTypeLabel = (codeType) => {
    const type = codeTypes.find(t => t.value === codeType);
    return type ? type.label : codeType;
  };

  return (
    <div className="config-tab">
      <div className="tab-header">
        <h2>🎨 Code Format Personalization</h2>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setEditingFormat(null);
              setShowModal(true);
            }}
          >
            ➕ Add New Format
          </button>
        </div>
      </div>

      <div className="code-formats-grid">
        {codeFormats.map((format) => (
          <div key={format.id} className="format-card">
            <div className="format-header">
              <h3>{getCodeTypeLabel(format.codeType)}</h3>
              <div className="format-actions">
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => handleTestCode(format.codeType)}
                >
                  🔍 Test Code
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleEdit(format)}
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
            
            <div className="format-details">
              <div className="detail-row">
                <strong>Prefix:</strong>
                <span className="prefix-display">{format.prefix}</span>
              </div>
              
              <div className="detail-row">
                <strong>Starting Number:</strong>
                <span>{format.startingNumber}</span>
              </div>
              
              <div className="detail-row">
                <strong>Current Number:</strong>
                <span className="current-number">{format.currentNumber}</span>
              </div>
              
              <div className="detail-row">
                <strong>Next Code:</strong>
                <span className="next-code">{format.prefix}-{String(format.currentNumber + 1).padStart(5, '0')}</span>
              </div>
            </div>
            
            {format.description && (
              <p className="format-description">{format.description}</p>
            )}
            
            <div className="format-status">
              <span className={`status-badge ${format.isActive ? 'active' : 'inactive'}`}>
                {format.isActive ? '✅ Active' : '❌ Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingFormat ? 'Edit Code Format' : 'Add New Code Format'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="format-form">
              <div className="form-group">
                <label>Code Type *</label>
                <select
                  value={formData.codeType}
                  onChange={(e) => setFormData({ ...formData, codeType: e.target.value })}
                  required
                  disabled={editingFormat}
                  className="form-control"
                >
                  <option value="">Select Code Type</option>
                  {codeTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Prefix *</label>
                <input
                  type="text"
                  value={formData.prefix}
                  onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                  required
                  placeholder="e.g., DATE-FAR, DATE-EMP"
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Starting Number *</label>
                <input
                  type="number"
                  value={formData.startingNumber}
                  onChange={(e) => setFormData({ ...formData, startingNumber: e.target.value })}
                  required
                  placeholder="e.g., 1, 100, 1000"
                  min="1"
                  className="form-control"
                />
                <small className="text-muted">Enter the starting number (e.g., 1 for F-00001, 100 for F-00100)</small>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-control"
                  rows="3"
                  placeholder="Describe the purpose of this code format..."
                />
              </div>
              
              <div className="preview-section">
                <h4>Preview:</h4>
                <div className="preview-code">
                  {formData.prefix && formData.startingNumber && (
                    <>
                      <span className="preview-text">Next generated code will be:</span>
                      <span className="preview-result">
                        {formData.prefix}-{String(parseInt(formData.startingNumber) || 1).padStart(5, '0')}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingFormat ? 'Update Format' : 'Create Format')}
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

export default PersonalizationTab;
