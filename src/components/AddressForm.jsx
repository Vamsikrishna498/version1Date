import React, { useState, useEffect } from 'react';
import '../styles/AddressForm.css';

const AddressForm = ({ 
  formData, 
  onFormDataChange, 
  disabled = false, 
  showTitle = true,
  title = "Address Information",
  errors = {}
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAddressData();
  }, []);

  const loadAddressData = async () => {
    // No API calls needed - using text inputs instead of dropdowns
    setLoading(false);
  };

  const handleFieldChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    
    // Reset dependent fields when parent changes
    if (field === 'country') {
      newData.state = '';
      newData.district = '';
      newData.block = '';
      newData.village = '';
      newData.zipcode = '';
    } else if (field === 'state') {
      newData.district = '';
      newData.block = '';
      newData.village = '';
      newData.zipcode = '';
    } else if (field === 'district') {
      newData.block = '';
      newData.village = '';
      newData.zipcode = '';
    } else if (field === 'block') {
      newData.village = '';
      newData.zipcode = '';
    } else if (field === 'village') {
      newData.zipcode = '';
    }
    
    onFormDataChange(newData);
  };


  if (loading) {
    return (
      <div className="address-form-loading">
        <div className="loading-spinner"></div>
        <p>Loading address data...</p>
      </div>
    );
  }

  return (
    <div className="address-form-component">
      {showTitle && (
        <div className="address-form-title">
          <h3>📍 {title}</h3>
        </div>
      )}
      
      <div className="address-form-fields">
        <div className="form-row">
          <div className="form-group">
            <label>Country *</label>
            <input
              type="text"
              value={formData.country || ''}
              onChange={(e) => handleFieldChange('country', e.target.value)}
              className={`form-control ${errors?.country?.message ? 'error' : ''}`}
              placeholder="Enter Country"
              disabled={disabled}
              required
            />
            {errors?.country?.message && (
              <p className="error-text">{errors.country.message}</p>
            )}
          </div>
          
          <div className="form-group">
            <label>State *</label>
            <input
              type="text"
              value={formData.state || ''}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              className={`form-control ${errors?.state?.message ? 'error' : ''}`}
              placeholder="Enter State"
              disabled={disabled}
              required
            />
            {errors?.state?.message && (
              <p className="error-text">{errors.state.message}</p>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>District *</label>
            <input
              type="text"
              value={formData.district || ''}
              onChange={(e) => handleFieldChange('district', e.target.value)}
              className={`form-control ${errors?.district?.message ? 'error' : ''}`}
              placeholder="Enter District"
              disabled={disabled}
              required
            />
            {errors?.district?.message && (
              <p className="error-text">{errors.district.message}</p>
            )}
          </div>
          
          <div className="form-group">
            <label>Block (Mandal) *</label>
            <input
              type="text"
              value={formData.block || ''}
              onChange={(e) => handleFieldChange('block', e.target.value)}
              className={`form-control ${errors?.block?.message ? 'error' : ''}`}
              placeholder="Enter Block (Mandal)"
              disabled={disabled}
              required
            />
            {errors?.block?.message && (
              <p className="error-text">{errors.block.message}</p>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Village *</label>
            <input
              type="text"
              value={formData.village || ''}
              onChange={(e) => handleFieldChange('village', e.target.value)}
              className={`form-control ${errors?.village?.message ? 'error' : ''}`}
              placeholder="Enter Village"
              disabled={disabled}
              required
            />
            {errors?.village?.message && (
              <p className="error-text">{errors.village.message}</p>
            )}
          </div>
          
          <div className="form-group">
            <label>Zipcode *</label>
            <input
              type="text"
              value={formData.zipcode || ''}
              onChange={(e) => handleFieldChange('zipcode', e.target.value)}
              className={`form-control ${errors?.zipcode?.message ? 'error' : ''}`}
              placeholder="Enter Zipcode"
              disabled={disabled}
              required
            />
            {errors?.zipcode?.message && (
              <p className="error-text">{errors.zipcode.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
