import React, { useState, useEffect } from 'react';
import { fpoAPI } from '../api/apiService';
import '../styles/FPOCreationForm.css';

const FPOCreationForm = ({ onClose, onFPOCreated, onSubmit, fpoData, onToast }) => {
  const [formData, setFormData] = useState({
    // Basic
    fpoName: '',
    registrationNumber: '',
    ceoName: '',
    phoneNumber: '',
    email: '',
    // Address
    address: '',
    state: '',
    district: '',
    mandal: '',
    village: '',
    streetName: '',
    pincode: '',
    // Business
    foodProcessingBusiness: '',
    otherBusiness: ''
  });

  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState('');
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    // Prefill when editing
    if (fpoData) {
      setFormData(prev => ({ ...prev, ...fpoData }));
    }
    loadStates();
  }, []);

  useEffect(() => {
    if (formData.state) {
      loadDistricts(formData.state);
    } else {
      setDistricts([]);
    }
  }, [formData.state]);

  const loadStates = async () => {
    try {
      const response = await fpoAPI.getDistinctStates();
      setStates(response);
    } catch (err) {
      console.error('Error loading states:', err);
    }
  };

  const loadDistricts = async (state) => {
    try {
      const response = await fpoAPI.getDistinctDistrictsByState(state);
      setDistricts(response);
    } catch (err) {
      console.error('Error loading districts:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let filteredValue = value;
    
    // Apply input restrictions based on field type
    switch (name) {
      case 'fpoName':
        filteredValue = value.replace(/[^A-Za-z0-9\s&.,()-]/g, '');
        if (filteredValue.length > 100) filteredValue = filteredValue.substring(0, 100);
        break;
      case 'ceoName':
        filteredValue = value.replace(/[^A-Za-z\s]/g, '');
        if (filteredValue.length > 50) filteredValue = filteredValue.substring(0, 50);
        break;
      case 'phoneNumber':
        filteredValue = value.replace(/[^0-9]/g, '');
        if (filteredValue.length > 10) filteredValue = filteredValue.substring(0, 10);
        break;
      case 'email':
        filteredValue = value.replace(/[^A-Za-z0-9@._-]/g, '');
        if (filteredValue.length > 100) filteredValue = filteredValue.substring(0, 100);
        break;
      case 'state':
      case 'district':
        filteredValue = value.replace(/[^A-Za-z\s]/g, '');
        if (filteredValue.length > 50) filteredValue = filteredValue.substring(0, 50);
        break;
      case 'village':
        filteredValue = value.replace(/[^A-Za-z0-9\s]/g, '');
        if (filteredValue.length > 50) filteredValue = filteredValue.substring(0, 50);
        break;
      case 'pincode':
        filteredValue = value.replace(/[^0-9]/g, '');
        if (filteredValue.length > 6) filteredValue = filteredValue.substring(0, 6);
        break;
      default:
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: filteredValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // FPO Name validation - alphabets, spaces, and common business characters
    if (!formData.fpoName.trim()) {
      newErrors.fpoName = 'FPO Name is required';
    } else if (!/^[A-Za-z0-9\s&.,()-]{2,100}$/.test(formData.fpoName.trim())) {
      newErrors.fpoName = 'FPO Name must contain only letters, numbers, spaces and common business characters (2-100 characters)';
    }

    // CEO Name validation - only alphabets and spaces
    if (!formData.ceoName.trim()) {
      newErrors.ceoName = 'CEO Name is required';
    } else if (!/^[A-Za-z\s]{2,50}$/.test(formData.ceoName.trim())) {
      newErrors.ceoName = 'CEO Name must contain only alphabets and spaces (2-50 characters)';
    }

    // Phone number validation - exactly 10 digits
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone Number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
    }

    // Email validation - proper email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address';
    }

    // State validation - alphabets and spaces
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    } else if (!/^[A-Za-z\s]{2,50}$/.test(formData.state.trim())) {
      newErrors.state = 'State must contain only alphabets and spaces';
    }

    // District validation - alphabets and spaces
    if (!formData.district.trim()) {
      newErrors.district = 'District is required';
    } else if (!/^[A-Za-z\s]{2,50}$/.test(formData.district.trim())) {
      newErrors.district = 'District must contain only alphabets and spaces';
    }

    // Village validation - alphabets, numbers, spaces
    if (!formData.village.trim()) {
      newErrors.village = 'Village is required';
    } else if (!/^[A-Za-z0-9\s]{2,50}$/.test(formData.village.trim())) {
      newErrors.village = 'Village must contain only letters, numbers and spaces (2-50 characters)';
    }

    // Pincode validation - exactly 6 digits
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be exactly 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Backend DTO expects additional fields. Provide sensible defaults
      const payload = {
        // required/new fields
        fpoName: formData.fpoName,
        registrationNumber: formData.registrationNumber || null,
        ceoName: formData.ceoName,
        phoneNumber: formData.phoneNumber,
        email: formData.email || null,
        // address mapping
        address: formData.address || null,
        state: formData.state,
        district: formData.district,
        mandal: formData.mandal || null,
        village: formData.village,
        streetName: formData.streetName || null,
        pincode: formData.pincode,
        // business info (optional)
        foodProcessingBusiness: formData.foodProcessingBusiness || null,
        otherBusiness: formData.otherBusiness || null,
        // hidden defaults to keep backend happy
        joinDate: new Date().toISOString().slice(0, 10),
        registrationType: 'COOPERATIVE',
        numberOfMembers: 1
      };

      if (typeof onSubmit === 'function') {
        await onSubmit(payload);
      } else {
        const response = await fpoAPI.createFPO(payload);
        if (typeof onFPOCreated === 'function') {
          onFPOCreated(response);
        }
      }
      onClose && onClose();
    } catch (err) {
      console.error('Error creating FPO:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to create FPO. Please check required fields.';
      onToast && onToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fpo-creation-form-page">
      <button className="close-btn" onClick={onClose}>×</button>
      <div className="form-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="form-title">Create FPO</h1>
            <p className="form-subtitle">Register a new Farmer Producer Organization</p>
          </div>
        </div>
      </div>

      <div className="form-content">
        <form onSubmit={handleSubmit} className="fpo-form">
          {/* Basic */}
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fpoName">FPO Name *</label>
                <input
                  type="text"
                  id="fpoName"
                  name="fpoName"
                  value={formData.fpoName}
                  onChange={handleInputChange}
                  className={errors.fpoName ? 'error' : ''}
                  maxLength={100}
                  placeholder="Enter FPO name"
                  onFocus={() => setFocusedField('fpoName')}
                  onBlur={() => setFocusedField('')}
                />
                {focusedField === 'fpoName' && !formData.fpoName && (
                  <div className="field-hint">
                    <i className="fas fa-info-circle"></i>
                    Enter FPO name using letters, numbers, spaces and common business characters (2-100 characters)
                  </div>
                )}
                {errors.fpoName && <span className="error-message">{errors.fpoName}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="registrationNumber">Registration No</label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ceoName">CEO Name</label>
                <input
                  type="text"
                  id="ceoName"
                  name="ceoName"
                  value={formData.ceoName}
                  onChange={handleInputChange}
                  className={errors.ceoName ? 'error' : ''}
                  maxLength={50}
                  placeholder="Enter CEO name (alphabets only)"
                  onFocus={() => setFocusedField('ceoName')}
                  onBlur={() => setFocusedField('')}
                />
                {focusedField === 'ceoName' && !formData.ceoName && (
                  <div className="field-hint">
                    <i className="fas fa-info-circle"></i>
                    Enter CEO name using only alphabets and spaces (2-50 characters)
                  </div>
                )}
                {errors.ceoName && <span className="error-message">{errors.ceoName}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone *</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={errors.phoneNumber ? 'error' : ''}
                  maxLength={10}
                  placeholder="Enter 10-digit phone number"
                  onFocus={() => setFocusedField('phoneNumber')}
                  onBlur={() => setFocusedField('')}
                />
                {focusedField === 'phoneNumber' && !formData.phoneNumber && (
                  <div className="field-hint">
                    <i className="fas fa-info-circle"></i>
                    Enter exactly 10 digits (numbers only, no spaces or special characters)
                  </div>
                )}
                {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                  maxLength={100}
                  placeholder="Enter email address"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                />
                {focusedField === 'email' && !formData.email && (
                  <div className="field-hint">
                    <i className="fas fa-info-circle"></i>
                    Enter a valid email address (example: user@domain.com)
                  </div>
                )}
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="state">State *</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={errors.state ? 'error' : ''}
                  list="state-suggestions"
                />
                <datalist id="state-suggestions">
                  {states.map((state) => (
                    <option key={state} value={state} />
                  ))}
                </datalist>
                {errors.state && <span className="error-message">{errors.state}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="district">District *</label>
                <input
                  type="text"
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className={errors.district ? 'error' : ''}
                />
                {errors.district && <span className="error-message">{errors.district}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mandal">Mandal</label>
                <input type="text" id="mandal" name="mandal" value={formData.mandal} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label htmlFor="village">Village</label>
                <input type="text" id="village" name="village" value={formData.village} onChange={handleInputChange} className={errors.village ? 'error' : ''} maxLength={50} placeholder="Enter village name" />
                {errors.village && <span className="error-message">{errors.village}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="streetName">Street Name</label>
                <input type="text" id="streetName" name="streetName" value={formData.streetName} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label htmlFor="pincode">Pincode *</label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className={errors.pincode ? 'error' : ''}
                  maxLength={6}
                  placeholder="Enter 6-digit pincode"
                />
                {errors.pincode && <span className="error-message">{errors.pincode}</span>}
              </div>
            </div>
          </div>

          {/* Business */}
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="foodProcessingBusiness">Food Processing Business</label>
                <textarea id="foodProcessingBusiness" name="foodProcessingBusiness" value={formData.foodProcessingBusiness} onChange={handleInputChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="otherBusiness">Other Business</label>
                <textarea id="otherBusiness" name="otherBusiness" value={formData.otherBusiness} onChange={handleInputChange} />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create FPO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FPOCreationForm;
