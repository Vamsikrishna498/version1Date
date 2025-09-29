import React, { useState, useEffect } from 'react';
import { configAPI } from '../../api/apiService';
import '../../styles/settings/CountrySettings.css';

const CountrySettings = ({ isSuperAdmin, isAdmin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('country-settings');
  
  // Data states
  const [addressData, setAddressData] = useState([]);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  
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
    { 
      id: 'country-settings', 
      label: 'Country Settings', 
      icon: '🌍', 
      description: 'Add country settings for entire DATE project',
      fieldType: 'text'
    }
  ];

  useEffect(() => {
    loadData();
  }, [activeSection]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load data from localStorage
      const savedData = localStorage.getItem('countrySettingsData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setAddressData(parsedData);
        console.log('Country Settings loaded from localStorage:', parsedData);
      } else {
        setAddressData([]);
        console.log('No saved country settings data found');
      }
      
    } catch (error) {
      console.error(`Error loading country settings:`, error);
      setError(`Failed to load country settings: ${error.message}`);
      setAddressData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle address form changes
  const handleAddressFormChange = (field, value) => {
    setAddressFormData(prev => ({
            ...prev,
      [field]: value
    }));
  };

  // Save address data
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

      let updatedData;
      
      // Check if we're editing an existing item
      const editingItem = addressData.find(item => 
        item.country === addressFormData.country && 
        item.state === addressFormData.state && 
        item.district === addressFormData.district &&
        item.block === addressFormData.block &&
        item.village === addressFormData.village &&
        item.zipcode === addressFormData.zipcode
      );

      if (editingItem) {
        // Update existing item
        updatedData = addressData.map(item => 
          item.id === editingItem.id 
            ? {
                ...item,
                country: addressFormData.country,
                state: addressFormData.state,
                district: addressFormData.district,
                block: addressFormData.block,
                village: addressFormData.village,
                zipcode: addressFormData.zipcode,
                updatedAt: new Date().toISOString()
              }
            : item
        );
        console.log('Address data updated:', editingItem.id);
      } else {
        // Create new address entry with ID
        const newAddressEntry = {
          id: Date.now(), // Simple ID generation
        country: addressFormData.country,
        state: addressFormData.state,
        district: addressFormData.district,
        block: addressFormData.block,
        village: addressFormData.village,
          zipcode: addressFormData.zipcode,
          createdAt: new Date().toISOString()
        };
        
        updatedData = [...addressData, newAddressEntry];
        console.log('Address data saved:', newAddressEntry);
      }

      setAddressData(updatedData);
      
      // Save to localStorage
      localStorage.setItem('countrySettingsData', JSON.stringify(updatedData));
      
      // Reset form
        setAddressFormData({
          country: '',
          state: '',
          district: '',
          block: '',
          village: '',
          zipcode: ''
        });
      
      // Hide form
      setShowForm(false);
      
    } catch (error) {
      console.error('Error saving address data:', error);
      setError('Failed to save address data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setAddressFormData({
      country: '',
      state: '',
      district: '',
      block: '',
      village: '',
      zipcode: ''
    });
    setShowForm(false);
  };

  return (
    <div className="country-settings">
      <div className="settings-header">
        <h2>🌍 Country Settings</h2>
        <p>Add country settings for entire DATE project</p>
      </div>

      <div className="section-navigation">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`section-button ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="section-icon">{section.icon}</span>
            <span className="section-label">{section.label}</span>
          </button>
        ))}
      </div>

      <div className="section-content">
        <div className="content-header">
          <h3>{sections.find(s => s.id === activeSection)?.icon} {sections.find(s => s.id === activeSection)?.label}</h3>
          <p>{sections.find(s => s.id === activeSection)?.description}</p>
          <button 
            className="add-button"
            onClick={() => setShowForm(true)}
          >
            ➕ Add Country Settings
          </button>
        </div>

        {showForm && (
        <div className="address-form-container">
          <div className="address-form">
            <div className="form-row">
              <div className="form-group">
                <label>Country *</label>
                  <input
                    type="text"
                  value={addressFormData.country}
                  onChange={(e) => handleAddressFormChange('country', e.target.value)}
                  className="form-control"
                    placeholder="Enter country name"
                  />
              </div>
              
              <div className="form-group">
                <label>State *</label>
                  <input
                    type="text"
                  value={addressFormData.state}
                  onChange={(e) => handleAddressFormChange('state', e.target.value)}
                  className="form-control"
                    placeholder="Enter state name"
                  />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>District *</label>
                  <input
                    type="text"
                  value={addressFormData.district}
                  onChange={(e) => handleAddressFormChange('district', e.target.value)}
                  className="form-control"
                    placeholder="Enter district name"
                  />
              </div>
              
              <div className="form-group">
                <label>Block (mandal) *</label>
                  <input
                    type="text"
                  value={addressFormData.block}
                  onChange={(e) => handleAddressFormChange('block', e.target.value)}
                  className="form-control"
                    placeholder="Enter block name"
                  />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Village *</label>
                  <input
                    type="text"
                  value={addressFormData.village}
                  onChange={(e) => handleAddressFormChange('village', e.target.value)}
                  className="form-control"
                    placeholder="Enter village name"
                  />
              </div>
              
              <div className="form-group">
                <label>Zipcode *</label>
                <input
                  type="text"
                  value={addressFormData.zipcode}
                  onChange={(e) => handleAddressFormChange('zipcode', e.target.value)}
                  className="form-control"
                    placeholder="Enter zipcode"
                />
              </div>
            </div>
            
            <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
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
        )}

        {addressData.length > 0 && (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Country</th>
                  <th>State</th>
                  <th>District</th>
                  <th>Block</th>
                  <th>Village</th>
                  <th>Zipcode</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {addressData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.country}</td>
                    <td>{item.state}</td>
                    <td>{item.district}</td>
                    <td>{item.block}</td>
                    <td>{item.village}</td>
                    <td>{item.zipcode}</td>
                    <td>
                      <button 
                        className="edit-btn"
                        onClick={() => {
                          setAddressFormData({
                            country: item.country,
                            state: item.state,
                            district: item.district,
                            block: item.block,
                            village: item.village,
                            zipcode: item.zipcode
                          });
                          setShowForm(true);
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => {
                          const updatedData = addressData.filter(addr => addr.id !== item.id);
                          setAddressData(updatedData);
                          localStorage.setItem('countrySettingsData', JSON.stringify(updatedData));
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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