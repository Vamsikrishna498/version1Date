import React, { useState, useEffect } from 'react';
import { fpoAPI } from '../api/apiService';

const FPOEditModal = ({ fpo, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    fpoName: '',
    registrationNumber: '',
    ceoName: '',
    email: '',
    phoneNumber: '',
    address: ''
  });
  const [saving, setSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialFpoId, setInitialFpoId] = useState(null);

  useEffect(() => {
    if (fpo && (!isInitialized || initialFpoId !== fpo.id)) {
      // Initialize only when component first loads or when FPO ID changes
      console.log('🔍 FPOEditModal initializing with fpo:', fpo);
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
      console.log('🔍 FPOEditModal initialized with address:', address);
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

  const updateField = (e) => {
    const { name, value } = e.target;
    
    // Special handling for address field to prevent duplication
    if (name === 'address') {
      const cleanedValue = cleanAddress(value);
      setForm(prev => ({ ...prev, [name]: cleanedValue }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
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
              <input name="fpoName" value={form.fpoName} onChange={updateField} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Registration No</label>
              <input name="registrationNumber" value={form.registrationNumber} onChange={updateField} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>CEO Name</label>
              <input name="ceoName" value={form.ceoName} onChange={updateField} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Email</label>
              <input name="email" value={form.email} onChange={updateField} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Phone</label>
              <input name="phoneNumber" value={form.phoneNumber} onChange={updateField} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Address</label>
              <textarea name="address" value={form.address} onChange={updateField} />
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


