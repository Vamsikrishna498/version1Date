import React, { useState, useEffect } from 'react';
import { configAPI } from '../../api/apiService';
import './config.css';

const TemplatesTab = ({ isSuperAdmin }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterModule, setFilterModule] = useState('');

  const [formData, setFormData] = useState({
    templateName: '',
    templateType: 'EMAIL', // locked to Mail
    moduleType: '',
    subject: '',
    content: '',
    placeholders: ''
  });

  // Safely parse placeholders that may be saved as JSON or comma-separated string
  const parsePlaceholders = (value) => {
    try {
      if (!value) return [];
      // If it's already an array serialized as JSON
      const trimmed = String(value).trim();
      if (trimmed.startsWith('[')) {
        const arr = JSON.parse(trimmed);
        return Array.isArray(arr) ? arr : [];
      }
      // Fallback: comma/space separated list
      return trimmed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } catch (_) {
      return [];
    }
  };

  // Restrict to Mail Templates only (per requirement)
  const templateTypes = [
    { value: 'EMAIL', label: 'Mail Template' }
  ];

  const moduleTypes = [
    { value: 'FARMER', label: 'Farmer Module' },
    { value: 'EMPLOYEE', label: 'Employee Module' },
    { value: 'FPO', label: 'FPO Module' },
    { value: 'SYSTEM', label: 'System Module' }
  ];

  const commonPlaceholders = [
    '{name}', '{email}', '{phone}', '{otp}', '{date}', '{time}',
    '{farmerName}', '{employeeName}', '{fpoName}', '{loginUrl}',
    '{password}', '{userId}', '{registrationDate}'
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await configAPI.getAllTemplates();
      setTemplates(response?.data || response || []);
    } catch (error) {
      setError('Failed to load templates: ' + error.message);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Normalize placeholders to a JSON array string
      const normalized = { ...formData };
      if (normalized.placeholders && typeof normalized.placeholders === 'string') {
        const arr = parsePlaceholders(normalized.placeholders);
        normalized.placeholders = JSON.stringify(arr);
      }
      
      if (editingTemplate) {
        await configAPI.updateTemplate(editingTemplate.id, normalized);
      } else {
        await configAPI.createTemplate(normalized);
      }
      
      setShowForm(false);
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error) {
      setError('Failed to save template: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      templateName: template.templateName,
      templateType: template.templateType,
      moduleType: template.moduleType,
      subject: template.subject,
      content: template.content,
      placeholders: template.placeholders
    });
    setShowForm(true);
  };

  const handleDelete = async (templateId) => {
    if (!isSuperAdmin) {
      setError('Only Super Admin can delete templates');
      return;
    }

    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        setLoading(true);
        await configAPI.deleteTemplate(templateId);
        loadTemplates();
      } catch (error) {
        setError('Failed to delete template: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      templateName: '',
      templateType: 'EMAIL',
      moduleType: '',
      subject: '',
      content: '',
      placeholders: ''
    });
  };

  const insertPlaceholder = (placeholder) => {
    setFormData({
      ...formData,
      content: formData.content + placeholder
    });
  };

  const filteredTemplates = (templates && Array.isArray(templates)) ? templates.filter(template => {
    const matchesSearch = template.templateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || template.templateType === filterType;
    const matchesModule = !filterModule || template.moduleType === filterModule;
    
    return matchesSearch && matchesType && matchesModule;
  }) : [];

  const getTemplateTypeLabel = (type) => {
    const templateType = templateTypes.find(t => t.value === type);
    return templateType ? templateType.label : type;
  };

  const getModuleTypeLabel = (type) => {
    const moduleType = moduleTypes.find(t => t.value === type);
    return moduleType ? moduleType.label : type;
  };

  return (
    <div className="config-tab">
      {showForm ? (
        <>
          <div className="superadmin-overview-header" style={{ marginBottom: '24px' }}>
            <div className="header-left">
              <h2 className="superadmin-overview-title">{editingTemplate ? 'Edit Template' : 'Add New Mail Template'}</h2>
              <p className="overview-description">
                {editingTemplate ? 'Update the mail template content and settings.' : 'Create a new mail template for automated communications.'}
              </p>
            </div>
            <div className="header-right">
              <button 
                className="action-btn secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Templates List
              </button>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 250px)',
            overflowY: 'auto'
          }}>
            <form onSubmit={handleSubmit} className="template-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Template Name *</label>
                  <input
                    type="text"
                    value={formData.templateName}
                    onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                    required
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label>Template Type *</label>
                  <select
                    value={formData.templateType}
                    onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
                    required
                    className="form-control"
                  >
                    <option value="">Select Type</option>
                    {templateTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Module Type *</label>
                  <select
                    value={formData.moduleType}
                    onChange={(e) => setFormData({ ...formData, moduleType: e.target.value })}
                    required
                    className="form-control"
                  >
                    <option value="">Select Module</option>
                    {moduleTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="form-control"
                  placeholder="Email subject line..."
                />
              </div>
              
              <div className="form-group">
                <label>Content *</label>
                <div className="placeholder-toolbar">
                  <span className="toolbar-label">Insert Placeholders:</span>
                  {commonPlaceholders.map(placeholder => (
                    <button
                      key={placeholder}
                      type="button"
                      className="placeholder-btn"
                      onClick={() => insertPlaceholder(placeholder)}
                    >
                      {placeholder}
                    </button>
                  ))}
                </div>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  className="form-control content-textarea"
                  rows="8"
                  placeholder="Enter template content... Use placeholders like {name}, {email}, etc."
                />
              </div>
              
              <div className="form-group">
                <label>Placeholders (JSON Array)</label>
                <input
                  type="text"
                  value={formData.placeholders}
                  onChange={(e) => setFormData({ ...formData, placeholders: e.target.value })}
                  className="form-control"
                  placeholder='["{name}", "{email}", "{phone}"]'
                />
              </div>
              
              <div className="form-actions" style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'flex-end',
                marginTop: '24px' 
              }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Create Template')}
                </button>
              </div>
            </form>
          </div>
        </>
      ) : (
        <>
          <div className="tab-header">
            <h2>📧 Mail Templates</h2>
            <div className="header-actions">
              <input
                type="text"
                placeholder="Search templates..."
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
                {templateTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="filter-select"
              >
                <option value="">All Modules</option>
                {moduleTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={() => {
                  resetForm();
                  setEditingTemplate(null);
                  setShowForm(true);
                }}
              >
                ➕ Add New Template
              </button>
            </div>
          </div>

          <div className="templates-grid">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <h3>{template.templateName}</h3>
                  <div className="template-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(template)}
                    >
                      ✏️ Edit
                    </button>
                    {isSuperAdmin && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(template.id)}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="template-meta">
                  <div className="meta-row">
                    <strong>Type:</strong>
                    <span className={`type-badge ${template.templateType.toLowerCase()}`}>
                      {getTemplateTypeLabel(template.templateType)}
                    </span>
                  </div>
                  
                  <div className="meta-row">
                    <strong>Module:</strong>
                    <span className="module-badge">{getModuleTypeLabel(template.moduleType)}</span>
                  </div>
                  
                  {template.subject && (
                    <div className="meta-row">
                      <strong>Subject:</strong>
                      <span className="subject-text">{template.subject}</span>
                    </div>
                  )}
                </div>
                
                <div className="template-content">
                  <strong>Content Preview:</strong>
                  <div className="content-preview">
                    {template.content.substring(0, 150)}
                    {template.content.length > 150 && '...'}
                  </div>
                </div>
                
                {template.placeholders && (
                  <div className="template-placeholders">
                    <strong>Available Placeholders:</strong>
                    <div className="placeholder-tags">
                      {parsePlaceholders(template.placeholders).map((ph) => (
                        <span key={ph} className="placeholder-tag">{ph}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="template-status">
                  <span className={`status-badge ${template.isActive ? 'active' : 'inactive'}`}>
                    {template.isActive ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {error && !showForm && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}
    </div>
  );
};

export default TemplatesTab;
