import React, { useState, useEffect } from 'react';
import { fpoAPI } from '../api/apiService';
import '../styles/FPOEditForm.css';

const FPOEditForm = ({ fpo, onClose, onUpdated, onCancel }) => {
  const [form, setForm] = useState({
    fpoName: '',
    registrationNumber: '',
    ceoName: '',
    email: '',
    phoneNumber: '',
    address: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (fpo) {
      setForm({
        fpoName: fpo.fpoName || '',
        registrationNumber: fpo.registrationNumber || '',
        ceoName: fpo.ceoName || '',
        email: fpo.email || '',
        phoneNumber: fpo.phoneNumber || '',
        address: `${fpo.village || ''}${fpo.village ? ', ' : ''}${fpo.district || ''}${fpo.district ? ', ' : ''}${fpo.state || ''}${fpo.pincode ? ' - ' + fpo.pincode : ''}`.trim()
      });
    }
  }, [fpo]);

  const updateField = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.fpoName.trim()) {
      newErrors.fpoName = 'FPO Name is required';
    }
    
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (form.phoneNumber && !/^[0-9+\-\s()]{10,}$/.test(form.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      console.log('🔄 Starting FPO update process...');
      console.log('FPO ID:', fpo.id);
      console.log('Form data:', form);
      
      // Derive address parts minimally; keep unknowns from original
      const next = {
        ...fpo,
        fpoName: form.fpoName,
        registrationNumber: form.registrationNumber,
        ceoName: form.ceoName,
        email: form.email,
        phoneNumber: form.phoneNumber
      };

      // If the address field is edited, store it back in village as a single line
      if (form.address && form.address !== `${fpo.village || ''}`) {
        next.village = form.address; // keep simple single-line address
      }

      console.log('Data to be sent to API:', next);
      const updated = await fpoAPI.updateFPOEmployee(fpo.id, next);
      console.log('✅ FPO updated successfully:', updated);
      
      if (onUpdated) {
        console.log('🔄 Calling onUpdated callback...');
        onUpdated(updated);
      } else {
        console.log('⚠️ No onUpdated callback provided');
      }
      
      if (onClose) {
        console.log('🔄 Calling onClose callback...');
        onClose();
      }
    } catch (err) {
      console.error('❌ Failed to update FPO:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      alert(`Failed to update FPO: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fpo-edit-form">
      {/* Header Section */}
      <div className="fpo-edit-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="edit-title">Edit FPO</h1>
            <p className="edit-subtitle">Update {fpo?.fpoName || 'FPO'} information</p>
          </div>
          <div className="header-right">
            <button className="close-btn" onClick={handleCancel}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="fpo-edit-content">
        <form onSubmit={handleSubmit} className="fpo-form">
          {/* Basic Information Section */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <i className="fas fa-building"></i>
              </div>
              <div className="section-info">
                <h2>Basic Information</h2>
                <p>Update the fundamental details of the FPO</p>
              </div>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fpoName" className="form-label">
                  FPO Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="fpoName"
                  name="fpoName"
                  value={form.fpoName}
                  onChange={updateField}
                  className={`form-input ${errors.fpoName ? 'error' : ''}`}
                  placeholder="Enter FPO name"
                />
                {errors.fpoName && <span className="error-message">{errors.fpoName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="registrationNumber" className="form-label">
                  Registration Number
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  value={form.registrationNumber}
                  onChange={updateField}
                  className="form-input"
                  placeholder="Enter registration number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ceoName" className="form-label">
                  CEO Name
                </label>
                <input
                  type="text"
                  id="ceoName"
                  name="ceoName"
                  value={form.ceoName}
                  onChange={updateField}
                  className="form-input"
                  placeholder="Enter CEO name"
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <i className="fas fa-phone"></i>
              </div>
              <div className="section-info">
                <h2>Contact Information</h2>
                <p>Update contact details and communication information</p>
              </div>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="Enter email address"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber" className="form-label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={updateField}
                  className={`form-input ${errors.phoneNumber ? 'error' : ''}`}
                  placeholder="Enter phone number"
                />
                {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div className="section-info">
                <h2>Address Information</h2>
                <p>Update the physical location and address details</p>
              </div>
            </div>
            
            <div className="form-group full-width">
              <label htmlFor="address" className="form-label">
                Complete Address
              </label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={updateField}
                className="form-textarea"
                placeholder="Enter complete address (village, district, state, pincode)"
                rows="3"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              <i className="fas fa-times"></i>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Updating...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Update FPO
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FPOEditForm;
