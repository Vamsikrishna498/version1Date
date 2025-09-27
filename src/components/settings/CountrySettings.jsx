import React, { useState, useEffect } from 'react';
import { configAPI } from '../../api/apiService';
import '../../styles/settings/CountrySettings.css';

const CountrySettings = ({ isSuperAdmin, isAdmin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('address-form');
  
  // Data states
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [villages, setVillages] = useState([]);
  const [zipcodes, setZipcodes] = useState([]);
  
  // Hierarchical data for dropdowns
  const [allStates, setAllStates] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [allBlocks, setAllBlocks] = useState([]);
  const [allVillages, setAllVillages] = useState([]);
  
  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    parentId: '',
    isActive: true
  });
  
  // Pincode auto-fill state
  const [pincodeData, setPincodeData] = useState(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  
  // Address form state
  const [addressFormData, setAddressFormData] = useState({
    country: '',
    state: '',
    district: '',
    block: '',
    village: '',
    zipcode: ''
  });

  const sections = [
    { id: 'address-form', label: 'Country Settings', icon: '📍', description: 'Unified Address Form for Farmer & Employee' }
  ];

  useEffect(() => {
    loadData();
    loadHierarchicalData();
  }, [activeSection]);

  // Load all hierarchical data for dropdowns
  const loadHierarchicalData = async () => {
    try {
      // Load countries first
      const countriesData = await configAPI.getAllCountries();
      const countries = countriesData || [];
      
      console.log('Loaded countries:', countries);
      
      setCountries(countries);
      
      // Load other data only if we have countries
      if (countries.length > 0) {
        // For now, we'll load states for the first country (India)
        const indiaCountry = countries.find(c => c.name === 'India');
        console.log('Found India country:', indiaCountry);
        if (indiaCountry) {
          console.log('Fetching states for country ID:', indiaCountry.id);
          const statesData = await configAPI.getStatesByCountryId(indiaCountry.id);
          const states = statesData || [];
          
          console.log('Loaded states for India:', states);
          setAllStates(states);
        } else {
          console.log('India country not found in countries list:', countries);
        }
      }
    } catch (error) {
      console.error('Failed to load hierarchical data:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // For address-form, load countries and initialize empty arrays for others
      if (activeSection === 'address-form') {
        const countriesData = await configAPI.getAllCountries();
        const countries = countriesData || [];
        
        console.log('Address form data loaded:', { 
          countries: countries.length
        });
        console.log('Sample countries:', countries.slice(0, 5));
        
        setCountries(countries);
        setAllStates([]);
        setAllDistricts([]);
        setAllBlocks([]);
        setAllVillages([]);
        setZipcodes([]);
      } else {
        // Legacy support for other sections
        switch (activeSection) {
          case 'country':
            const countriesData = await configAPI.getAllCountries();
            setCountries(countriesData?.data || countriesData || []);
            break;
          case 'state':
            const statesData = await configAPI.getAllStates();
            setStates(statesData?.data || statesData || []);
            break;
          case 'district':
            const districtsData = await configAPI.getAllDistricts();
            setDistricts(districtsData?.data || districtsData || []);
            break;
          case 'block':
            const blocksData = await configAPI.getAllBlocks();
            setBlocks(blocksData?.data || blocksData || []);
            break;
          case 'village':
            const villagesData = await configAPI.getAllVillages();
            setVillages(villagesData?.data || villagesData || []);
            break;
          case 'zipcode':
            const zipcodesData = await configAPI.getAllZipcodes();
            setZipcodes(zipcodesData?.data || zipcodesData || []);
            break;
          default:
            break;
        }
      }
    } catch (error) {
      setError(`Failed to load ${activeSection} data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        type: activeSection.toUpperCase()
      };

      if (editingItem) {
        await configAPI.updateLocationData(editingItem.id, submitData);
      } else {
        await configAPI.createLocationData(submitData);
      }
      
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      loadData();
    } catch (error) {
      setError(`Failed to save ${activeSection}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      code: item.code || '',
      parentId: item.parentId || '',
      isActive: item.isActive !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (itemId) => {
    if (!isSuperAdmin) {
      setError('Only Super Admin can delete location data');
      return;
    }

    if (window.confirm(`Are you sure you want to delete this ${activeSection}?`)) {
      try {
        setLoading(true);
        await configAPI.deleteLocationData(itemId);
        loadData();
      } catch (error) {
        setError(`Failed to delete ${activeSection}: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      parentId: '',
      isActive: true
    });
    setPincodeData(null);
  };

  const getCurrentData = () => {
    switch (activeSection) {
      case 'country': return countries;
      case 'state': return states;
      case 'district': return districts;
      case 'block': return blocks;
      case 'village': return villages;
      case 'zipcode': return zipcodes;
      case 'address-form': return [];
      default: return [];
    }
  };

  const getParentOptions = () => {
    switch (activeSection) {
      case 'state': return countries;
      case 'district': return allStates;
      case 'block': return allDistricts;
      case 'village': return allBlocks;
      case 'zipcode': return allVillages;
      default: return [];
    }
  };

  // Get filtered options based on current form parent selection
  const getCurrentParentOptions = () => {
    // For the first level (state), always show all countries
    if (activeSection === 'state') {
      return countries;
    }
    
    // For other levels, show all options if no parent is selected
    if (!formData.parentId) {
      return getParentOptions();
    }
    
    // Filter based on parent selection
    let filteredOptions = [];
    switch (activeSection) {
      case 'district':
        filteredOptions = allStates.filter(state => state.parentId == formData.parentId);
        break;
      case 'block':
        filteredOptions = allDistricts.filter(district => district.parentId == formData.parentId);
        break;
      case 'village':
        filteredOptions = allBlocks.filter(block => block.parentId == formData.parentId);
        break;
      case 'zipcode':
        filteredOptions = allVillages.filter(village => village.parentId == formData.parentId);
        break;
      default:
        filteredOptions = getParentOptions();
    }
    
    console.log(`Filtering ${activeSection} options for parentId ${formData.parentId}:`, filteredOptions);
    return filteredOptions;
  };

  // Filter options based on parent selection
  const getFilteredOptions = (parentId) => {
    switch (activeSection) {
      case 'district':
        return allDistricts.filter(district => district.parentId === parentId);
      case 'block':
        return allBlocks.filter(block => block.parentId === parentId);
      case 'village':
        return allVillages.filter(village => village.parentId === parentId);
      default:
        return getParentOptions();
    }
  };

  // Pincode auto-fill functionality
  const handlePincodeChange = async (pincode) => {
    if (pincode && pincode.length === 6) {
      setPincodeLoading(true);
      try {
        // Use the existing AddressService to fetch pincode details
        const response = await configAPI.getAddressByPincode(pincode);
        if (response) {
          setPincodeData(response);
          // Auto-fill the form with pincode data
          setFormData(prev => ({
            ...prev,
            name: response.name || '',
            code: pincode,
            parentId: response.villageId || prev.parentId
          }));
        }
      } catch (error) {
        console.error('Failed to fetch pincode details:', error);
        setPincodeData(null);
      } finally {
        setPincodeLoading(false);
      }
    } else {
      setPincodeData(null);
    }
  };

  const getParentLabel = () => {
    switch (activeSection) {
      case 'state': return 'Country';
      case 'district': return 'State';
      case 'block': return 'District';
      case 'village': return 'Block (Mandal)';
      case 'zipcode': return 'Village';
      case 'address-form': return '';
      default: return 'Parent';
    }
  };

  const getFieldType = () => {
    return activeSection === 'zipcode' ? 'number' : 'text';
  };

  // Address form handlers
  const handleAddressFormChange = async (field, value) => {
    setAddressFormData(prev => {
      const newData = { ...prev, [field]: value };
      
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
      
      return newData;
    });
    
    // Load hierarchical data dynamically
    if (field === 'country' && value) {
      try {
        const statesData = await configAPI.getStatesByCountryId(value);
        setAllStates(statesData || []);
        setAllDistricts([]);
        setAllBlocks([]);
        setAllVillages([]);
        setZipcodes([]);
      } catch (error) {
        console.error('Failed to load states:', error);
      }
    } else if (field === 'state' && value) {
      try {
        const districtsData = await configAPI.getDistrictsByStateId(value);
        setAllDistricts(districtsData || []);
        setAllBlocks([]);
        setAllVillages([]);
        setZipcodes([]);
      } catch (error) {
        console.error('Failed to load districts:', error);
      }
    } else if (field === 'district' && value) {
      try {
        const blocksData = await configAPI.getBlocksByDistrictId(value);
        setAllBlocks(blocksData || []);
        setAllVillages([]);
        setZipcodes([]);
      } catch (error) {
        console.error('Failed to load blocks:', error);
      }
    } else if (field === 'block' && value) {
      try {
        const villagesData = await configAPI.getVillagesByBlockId(value);
        setAllVillages(villagesData || []);
        setZipcodes([]);
      } catch (error) {
        console.error('Failed to load villages:', error);
      }
    } else if (field === 'village' && value) {
      try {
        const zipcodesData = await configAPI.getZipcodesByVillageId(value);
        setZipcodes(zipcodesData || []);
      } catch (error) {
        console.error('Failed to load zipcodes:', error);
      }
    }
  };

  const getFilteredStates = () => {
    // States are already filtered by country in the API call
    return allStates;
  };

  const getFilteredDistricts = () => {
    // Districts are already filtered by state in the API call
    return allDistricts;
  };

  const getFilteredBlocks = () => {
    // Blocks are already filtered by district in the API call
    return allBlocks;
  };

  const getFilteredVillages = () => {
    // Villages are already filtered by block in the API call
    return allVillages;
  };

  const getFilteredZipcodes = () => {
    // Zipcodes are already filtered by village in the API call
    return zipcodes;
  };

  // Save address data function
  const handleSaveAddressData = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!addressFormData.country || !addressFormData.state || !addressFormData.district || 
          !addressFormData.block || !addressFormData.village || !addressFormData.zipcode) {
        setError('Please fill in all required fields');
        return;
      }

      // Create location data object
      const locationData = {
        type: 'address',
        country: addressFormData.country,
        state: addressFormData.state,
        district: addressFormData.district,
        block: addressFormData.block,
        village: addressFormData.village,
        zipcode: addressFormData.zipcode
      };

      // Save the address data
      const response = await configAPI.createLocationData(locationData);
      
      if (response) {
        alert('Address data saved successfully!');
        console.log('Saved address data:', addressFormData);
        
        // Reset form after successful save
        setAddressFormData({
          country: '',
          state: '',
          district: '',
          block: '',
          village: '',
          zipcode: ''
        });
      }
    } catch (error) {
      console.error('Error saving address data:', error);
      setError('Failed to save address data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentData = getCurrentData();
  const parentOptions = getParentOptions();

  return (
    <div className="country-settings">
      <div className="settings-header">
        <h2>🌍 Country Settings</h2>
        <p>Manage hierarchical location data: Country → State → District → Block → Village → Zipcode</p>
      </div>

      <div className="section-content">
        <div className="content-header">
          <h3>
            📍 Country Settings
          </h3>
        </div>

        <div className="address-form-container">
          <div className="address-form">
            <div className="form-row">
              <div className="form-group">
                <label>Country *</label>
                <select
                  value={addressFormData.country}
                  onChange={(e) => handleAddressFormChange('country', e.target.value)}
                  className="form-control"
                >
                  <option value="">Select</option>
                  {countries && countries.length > 0 ? (
                    countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading countries...</option>
                  )}
                </select>
              </div>
              
              <div className="form-group">
                <label>State *</label>
                <select
                  value={addressFormData.state}
                  onChange={(e) => handleAddressFormChange('state', e.target.value)}
                  className="form-control"
                  disabled={!addressFormData.country}
                >
                  <option value="">Select</option>
                  {getFilteredStates().length > 0 ? (
                    getFilteredStates().map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {addressFormData.country ? 'No states found' : 'Select country first'}
                    </option>
                  )}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>District *</label>
                <select
                  value={addressFormData.district}
                  onChange={(e) => handleAddressFormChange('district', e.target.value)}
                  className="form-control"
                  disabled={!addressFormData.state}
                >
                  <option value="">Select</option>
                  {getFilteredDistricts().map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Block (mandal) *</label>
                <select
                  value={addressFormData.block}
                  onChange={(e) => handleAddressFormChange('block', e.target.value)}
                  className="form-control"
                  disabled={!addressFormData.district}
                >
                  <option value="">Select</option>
                  {getFilteredBlocks().map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Village *</label>
                <select
                  value={addressFormData.village}
                  onChange={(e) => handleAddressFormChange('village', e.target.value)}
                  className="form-control"
                  disabled={!addressFormData.block}
                >
                  <option value="">Select</option>
                  {getFilteredVillages().map((village) => (
                    <option key={village.id} value={village.id}>
                      {village.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Zipcode *</label>
                <input
                  type="text"
                  value={addressFormData.zipcode}
                  onChange={(e) => handleAddressFormChange('zipcode', e.target.value)}
                  className="form-control"
                  placeholder="Zipcode"
                  disabled={!addressFormData.village}
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveAddressData}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>


      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}
    </div>
  );
};

export default CountrySettings;
