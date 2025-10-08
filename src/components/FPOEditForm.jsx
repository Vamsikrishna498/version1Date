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
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialFpoId, setInitialFpoId] = useState(null);

  useEffect(() => {
    if (fpo && (!isInitialized || initialFpoId !== fpo.id)) {
      // Initialize only when component first loads or when FPO ID changes
      console.log('🔍 FPOEditForm initializing with fpo:', fpo);
      console.log('🔍 Address components:', {
        village: fpo.village,
        district: fpo.district,
        state: fpo.state,
        pincode: fpo.pincode
      });
      
      let address = '';
      
      // Check if village already contains a complete address
      if (fpo.village && (fpo.village.includes(',') || fpo.village.includes('-'))) {
        // Village already contains a complete address, clean it and use it
        address = cleanAddress(fpo.village);
        console.log('🔍 Using village as complete address (cleaned):', address);
      } else if (fpo.village && fpo.village.trim()) {
        // Village has content but no commas/dashes, use it as is
        address = fpo.village.trim();
        console.log('🔍 Using village as simple address:', address);
      } else {
        // Construct address from individual components only if they exist and are separate
        const parts = [];
        if (fpo.village && !fpo.village.includes(',')) parts.push(fpo.village);
        if (fpo.district && !fpo.district.includes(',')) parts.push(fpo.district);
        if (fpo.state && !fpo.state.includes(',')) parts.push(fpo.state);
        if (fpo.pincode && !fpo.pincode.includes(',')) parts.push(`- ${fpo.pincode}`);
        address = parts.join(', ');
        console.log('🔍 Constructed address from parts:', address);
      }
      
      setForm({
        fpoName: fpo.fpoName || '',
        registrationNumber: fpo.registrationNumber || '',
        ceoName: fpo.ceoName || '',
        email: fpo.email || '',
        phoneNumber: fpo.phoneNumber || '',
        address: address
      });
      
      setIsInitialized(true);
      setInitialFpoId(fpo.id);
      console.log('🔍 FPOEditForm initialized with address:', address);
    }
  }, [fpo, isInitialized, initialFpoId]);

  const updateField = (e) => {
    const { name, value } = e.target;
    
    // Special handling for address field to prevent duplication
    if (name === 'address') {
      const cleanedValue = cleanAddress(value);
      setForm(prev => ({ ...prev, [name]: cleanedValue }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Function to clean address and prevent duplication
  const cleanAddress = (address) => {
    if (!address) return '';
    
    // If address contains repeated patterns, clean it up
    const parts = address.split(',');
    const uniqueParts = [];
    const seen = new Set();
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        uniqueParts.push(trimmed);
      }
    }
    
    return uniqueParts.join(', ');
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

      // Handle address field - preserve original structure but prevent duplication
      if (form.address && form.address.trim()) {
        console.log('🔍 Setting address in village field:', form.address.trim());
        next.village = form.address.trim();
        
        // Ensure required fields are present for backend validation
        // Extract components from the address if individual fields are missing
        if (!next.district || !next.state || !next.pincode) {
          console.log('🔍 Extracting address components for backend validation');
          const addressParts = form.address.split(',').map(part => part.trim());
          
          // Try to extract district, state, and pincode from the address
          if (addressParts.length >= 2) {
            next.district = next.district || addressParts[1] || 'Unknown';
          }
          if (addressParts.length >= 3) {
            next.state = next.state || addressParts[2] || 'Unknown';
          }
          if (addressParts.length >= 4) {
            const pincodeMatch = addressParts[3].match(/\d{6}/);
            next.pincode = next.pincode || (pincodeMatch ? pincodeMatch[0] : '000000');
          }
        }
        
        console.log('🔍 Address components for backend:', {
          village: next.village,
          district: next.district,
          state: next.state,
          pincode: next.pincode
        });
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
