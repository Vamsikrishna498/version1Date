import React, { useState, useEffect } from 'react';
import { configAPI } from '../api/apiService';
import '../styles/AddressForm.css';

const AddressForm = ({ 
  formData, 
  onFormDataChange, 
  disabled = false, 
  showTitle = true,
  title = "Address Information"
}) => {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAddressData();
  }, []);

  const loadAddressData = async () => {
    try {
      setLoading(true);
      const [countriesData, statesData, districtsData, blocksData, villagesData] = await Promise.all([
        configAPI.getAllCountries(),
        configAPI.getAllStates(),
        configAPI.getAllDistricts(),
        configAPI.getAllBlocks(),
        configAPI.getAllVillages()
      ]);
      
      setCountries(countriesData?.data || countriesData || []);
      setStates(statesData?.data || statesData || []);
      setDistricts(districtsData?.data || districtsData || []);
      setBlocks(blocksData?.data || blocksData || []);
      setVillages(villagesData?.data || villagesData || []);
    } catch (error) {
      console.error('Failed to load address data:', error);
    } finally {
      setLoading(false);
    }
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

  const getFilteredStates = () => {
    if (!formData.country) return states;
    return states.filter(state => state.parentId == formData.country);
  };

  const getFilteredDistricts = () => {
    if (!formData.state) return districts;
    return districts.filter(district => district.parentId == formData.state);
  };

  const getFilteredBlocks = () => {
    if (!formData.district) return blocks;
    return blocks.filter(block => block.parentId == formData.district);
  };

  const getFilteredVillages = () => {
    if (!formData.block) return villages;
    return villages.filter(village => village.parentId == formData.block);
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
            <select
              value={formData.country || ''}
              onChange={(e) => handleFieldChange('country', e.target.value)}
              className="form-control"
              disabled={disabled}
              required
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>State *</label>
            <select
              value={formData.state || ''}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              className="form-control"
              disabled={disabled || !formData.country}
              required
            >
              <option value="">Select State</option>
              {getFilteredStates().map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name} ({state.code})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>District *</label>
            <select
              value={formData.district || ''}
              onChange={(e) => handleFieldChange('district', e.target.value)}
              className="form-control"
              disabled={disabled || !formData.state}
              required
            >
              <option value="">Select District</option>
              {getFilteredDistricts().map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name} ({district.code})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Block (Mandal) *</label>
            <select
              value={formData.block || ''}
              onChange={(e) => handleFieldChange('block', e.target.value)}
              className="form-control"
              disabled={disabled || !formData.district}
              required
            >
              <option value="">Select Block (Mandal)</option>
              {getFilteredBlocks().map((block) => (
                <option key={block.id} value={block.id}>
                  {block.name} ({block.code})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Village *</label>
            <select
              value={formData.village || ''}
              onChange={(e) => handleFieldChange('village', e.target.value)}
              className="form-control"
              disabled={disabled || !formData.block}
              required
            >
              <option value="">Select Village</option>
              {getFilteredVillages().map((village) => (
                <option key={village.id} value={village.id}>
                  {village.name} ({village.code})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Zipcode *</label>
            <input
              type="text"
              value={formData.zipcode || ''}
              onChange={(e) => handleFieldChange('zipcode', e.target.value)}
              className="form-control"
              placeholder="Enter Zipcode"
              disabled={disabled || !formData.village}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
