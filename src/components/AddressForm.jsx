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
      
      <div className="address-form-fields address-two-column">
        <div className="form-row">
          <div className="form-group">
            <label>COUNTRY <span className="required">*</span></label>
            <input
              type="text"
              value={formData.country || ''}
              onChange={(e) => handleFieldChange('country', e.target.value)}
              className={`form-control ${errors?.country ? 'error' : ''}`}
              placeholder="Enter Country"
              disabled={disabled}
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#1f2937',
                backgroundColor: '#ffffff',
                minHeight: '56px',
                height: '56px',
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}
            />
            {errors?.country && (
              <p className="error-text">{errors.country.message || 'Country is required'}</p>
            )}
          </div>
          
          <div className="form-group">
            <label>STATE <span className="required">*</span></label>
            <input
              type="text"
              value={formData.state || ''}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              className={`form-control ${errors?.state ? 'error' : ''}`}
              placeholder="Enter State"
              disabled={disabled}
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#1f2937',
                backgroundColor: '#ffffff',
                minHeight: '56px',
                height: '56px',
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}
            />
            {errors?.state && (
              <p className="error-text">{errors.state.message || 'State is required'}</p>
            )}
          </div>

          <div className="form-group">
            <label>DISTRICT <span className="required">*</span></label>
            <input
              type="text"
              value={formData.district || ''}
              onChange={(e) => handleFieldChange('district', e.target.value)}
              className={`form-control ${errors?.district ? 'error' : ''}`}
              placeholder="Enter District"
              disabled={disabled}
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#1f2937',
                backgroundColor: '#ffffff',
                minHeight: '56px',
                height: '56px',
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}
            />
            {errors?.district && (
              <p className="error-text">{errors.district.message || 'District is required'}</p>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>BLOCK (MANDAL) <span className="required">*</span></label>
            <input
              type="text"
              value={formData.block || ''}
              onChange={(e) => handleFieldChange('block', e.target.value)}
              className={`form-control ${errors?.block ? 'error' : ''}`}
              placeholder="Enter Block (Mandal)"
              disabled={disabled}
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#1f2937',
                backgroundColor: '#ffffff',
                minHeight: '56px',
                height: '56px',
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}
            />
            {errors?.block && (
              <p className="error-text">{errors.block.message || 'Block is required'}</p>
            )}
          </div>
          
          <div className="form-group">
            <label>VILLAGE <span className="required">*</span></label>
            <input
              type="text"
              value={formData.village || ''}
              onChange={(e) => handleFieldChange('village', e.target.value)}
              className={`form-control ${errors?.village ? 'error' : ''}`}
              placeholder="Enter Village"
              disabled={disabled}
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#1f2937',
                backgroundColor: '#ffffff',
                minHeight: '56px',
                height: '56px',
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}
            />
            {errors?.village && (
              <p className="error-text">{errors.village.message || 'Village is required'}</p>
            )}
          </div>
          
          <div className="form-group">
            <label>ZIPCODE <span className="required">*</span></label>
            <input
              type="text"
              value={formData.zipcode || ''}
              onChange={(e) => handleFieldChange('zipcode', e.target.value)}
              className={`form-control ${errors?.zipcode ? 'error' : ''}`}
              placeholder="Enter Zipcode"
              disabled={disabled}
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '500',
                color: '#1f2937',
                backgroundColor: '#ffffff',
                minHeight: '56px',
                height: '56px',
                display: 'block',
                visibility: 'visible',
                opacity: '1',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease'
              }}
            />
            {errors?.zipcode && (
              <p className="error-text">{errors.zipcode.message || 'Zipcode is required'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
