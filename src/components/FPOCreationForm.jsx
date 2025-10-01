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
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    if (!formData.fpoName.trim()) {
      newErrors.fpoName = 'FPO Name is required';
    }

    if (!formData.ceoName.trim()) {
      newErrors.ceoName = 'CEO Name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone Number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.district.trim()) {
      newErrors.district = 'District is required';
    }

    if (!formData.village.trim()) {
      newErrors.village = 'Village is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
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
                />
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
                />
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
                  maxLength="10"
                />
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
                />
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
                <input type="text" id="village" name="village" value={formData.village} onChange={handleInputChange} className={errors.village ? 'error' : ''} />
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
                  maxLength="6"
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
