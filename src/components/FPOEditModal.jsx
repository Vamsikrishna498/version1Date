import React, { useState, useEffect } from 'react';
import { fpoAPI } from '../api/apiService';
import '../styles/FPOEditForm.css';

const FPOEditModal = ({ fpo, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    fpoName: '',
    registrationNumber: '',
    ceoName: '',
    email: '',
    phoneNumber: '',
    address: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');
  const [saving, setSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialFpoId, setInitialFpoId] = useState(null);

  useEffect(() => {
    if (fpo && (!isInitialized || initialFpoId !== fpo.id)) {
      // Initialize only when component first loads or when FPO ID changes
      
      let address = '';
      
      // Check if village already contains a complete address
      if (fpo.village && (fpo.village.includes(',') || fpo.village.includes('-'))) {
        // Village already contains a complete address, clean it and use it
        address = cleanAddress(fpo.village);
      } else if (fpo.village && fpo.village.trim()) {
        // Village has content but no commas/dashes, use it as is
        address = fpo.village.trim();
      } else {
        // Construct address from individual components only if they exist and are separate
        const parts = [];
        if (fpo.village && !fpo.village.includes(',')) parts.push(fpo.village);
        if (fpo.district && !fpo.district.includes(',')) parts.push(fpo.district);
        if (fpo.state && !fpo.state.includes(',')) parts.push(fpo.state);
        if (fpo.pincode && !fpo.pincode.includes(',')) parts.push(`- ${fpo.pincode}`);
        address = parts.join(', ');
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
    }
  }, [fpo, isInitialized, initialFpoId]);

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
    const errors = {};
    
    // FPO Name validation
    if (!form.fpoName.trim()) {
      errors.fpoName = 'FPO Name is required';
    } else if (!/^[A-Za-z0-9\s&.,()-]{2,100}$/.test(form.fpoName.trim())) {
      errors.fpoName = 'FPO Name must contain only letters, numbers, and common business characters (2-100 characters)';
    }
    
    // CEO Name validation
    if (form.ceoName && !/^[A-Za-z\s]{2,50}$/.test(form.ceoName.trim())) {
      errors.ceoName = 'CEO Name must contain only alphabets and spaces (2-50 characters)';
    }
    
    // Phone Number validation
    if (form.phoneNumber && !/^[0-9]{10}$/.test(form.phoneNumber.trim())) {
      errors.phoneNumber = 'Phone number must be exactly 10 digits';
    }
    
    // Email validation
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateField = (field, value) => {
    let filteredValue = value;
    
    // Apply field-specific filtering
    switch (field) {
      case 'fpoName':
        filteredValue = value.replace(/[^A-Za-z0-9\s&.,()-]/g, '').substring(0, 100);
        break;
      case 'ceoName':
        filteredValue = value.replace(/[^A-Za-z\s]/g, '').substring(0, 50);
        break;
      case 'phoneNumber':
        filteredValue = value.replace(/[^0-9]/g, '').substring(0, 10);
        break;
      case 'email':
        filteredValue = value.replace(/[^A-Za-z0-9@._-]/g, '').substring(0, 100);
        break;
      case 'address':
        filteredValue = cleanAddress(value);
        break;
      default:
        break;
    }
    
    setForm(prev => ({ ...prev, [field]: filteredValue }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
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

      const updated = await fpoAPI.updateFPO(fpo.id, next);
      onUpdated && onUpdated(updated);
      onClose && onClose();
    } catch (err) {
      console.error('Failed to update FPO', err);
      alert('Failed to update FPO');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 800 }}>
        <div className="modal-header">
          <h2>Update FPO</h2>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>FPO Name*</label>
              <input 
                name="fpoName" 
                value={form.fpoName} 
                onChange={(e) => updateField('fpoName', e.target.value)}
                onFocus={() => setFocusedField('fpoName')}
                onBlur={() => setFocusedField('')}
                className={`form-input ${formErrors.fpoName ? 'error' : ''}`}
                maxLength={100}
                placeholder="Enter FPO name"
              />
              {focusedField === 'fpoName' && !form.fpoName && <div className="field-hint">Please enter FPO name (letters, numbers, spaces, and common business characters)</div>}
              {formErrors.fpoName && <div className="error-message">{formErrors.fpoName}</div>}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Registration No</label>
              <input name="registrationNumber" value={form.registrationNumber} onChange={updateField} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>CEO Name</label>
              <input 
                name="ceoName" 
                value={form.ceoName} 
                onChange={(e) => updateField('ceoName', e.target.value)}
                onFocus={() => setFocusedField('ceoName')}
                onBlur={() => setFocusedField('')}
                className={`form-input ${formErrors.ceoName ? 'error' : ''}`}
                maxLength={50}
                placeholder="Enter CEO name (alphabets only)"
              />
              {focusedField === 'ceoName' && !form.ceoName && <div className="field-hint">Please enter CEO name using only alphabets</div>}
              {formErrors.ceoName && <div className="error-message">{formErrors.ceoName}</div>}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Email</label>
              <input 
                name="email" 
                type="email"
                value={form.email} 
                onChange={(e) => updateField('email', e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                className={`form-input ${formErrors.email ? 'error' : ''}`}
                maxLength={100}
                placeholder="Enter email address"
              />
              {focusedField === 'email' && !form.email && <div className="field-hint">Please enter valid email address</div>}
              {formErrors.email && <div className="error-message">{formErrors.email}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Phone</label>
              <input 
                name="phoneNumber" 
                type="tel"
                value={form.phoneNumber} 
                onChange={(e) => updateField('phoneNumber', e.target.value)}
                onFocus={() => setFocusedField('phoneNumber')}
                onBlur={() => setFocusedField('')}
                className={`form-input ${formErrors.phoneNumber ? 'error' : ''}`}
                maxLength={10}
                placeholder="Enter 10-digit phone number"
              />
              {focusedField === 'phoneNumber' && !form.phoneNumber && <div className="field-hint">Please enter 10-digit phone number using only numbers</div>}
              {formErrors.phoneNumber && <div className="error-message">{formErrors.phoneNumber}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Address</label>
              <textarea 
                name="address" 
                value={form.address} 
                onChange={(e) => updateField('address', e.target.value)}
                onFocus={() => setFocusedField('address')}
                onBlur={() => setFocusedField('')}
                className="form-textarea"
                rows={3}
                placeholder="Enter complete address"
              />
              {focusedField === 'address' && !form.address && <div className="field-hint">Please enter complete address</div>}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FPOEditModal;


