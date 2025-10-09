import React, { useState, useEffect } from 'react';
import { fpoAPI } from '../api/apiService';

const FPOCropEntriesModal = ({ isOpen, onClose, fpoId, fpoName }) => {
  const [cropEntries, setCropEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCropEntry, setEditingCropEntry] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Form state for creating/editing crop entries
  const [formData, setFormData] = useState({
    cropYear: '',
    cropName: '',
    area: '',
    production: ''
  });

  useEffect(() => {
    if (isOpen && fpoId) {
      loadCropEntries();
    }
  }, [isOpen, fpoId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.action-dropdown')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const loadCropEntries = async () => {
    try {
      setLoading(true);
      console.log('Loading crop entries for FPO ID:', fpoId);
      const response = await fpoAPI.getFPOCrops(fpoId);
      console.log('Crop entries response:', response);
      
      // Handle different response formats
      const cropData = response.data || response || [];
      console.log('Crop entries data:', cropData);
      setCropEntries(Array.isArray(cropData) ? cropData : []);
    } catch (error) {
      console.error('Error loading crop entries:', error);
      setCropEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCropEntry = async (e) => {
    e.preventDefault();
    try {
      // Map frontend form data to backend DTO format
      const cropData = {
        farmerId: null,
        cropName: formData.cropName,
        variety: 'Default Variety', // Default value
        area: parseFloat(formData.area) || 0,
        season: 'KHARIF', // Default season
        sowingDate: new Date().toISOString().split('T')[0], // Today's date
        expectedHarvestDate: null,
        expectedYield: parseFloat(formData.production) || 0, // Map production to expectedYield
        marketPrice: null,
        soilType: null,
        irrigationMethod: null,
        seedSource: null,
        fertilizerUsed: null,
        pesticideUsed: null,
        remarks: null,
        photoFileName: null
      };
      
      console.log('Creating crop entry with data:', cropData);
      console.log('FPO ID:', fpoId);
      
      const response = await fpoAPI.createCrop(fpoId, cropData);
      console.log('Crop entry created successfully:', response);
      
      setShowCreateForm(false);
      setFormData({
        cropYear: '',
        cropName: '',
        area: '',
        production: ''
      });
      
      // Add a small delay to ensure backend processing
      setTimeout(() => {
        loadCropEntries();
      }, 500);
      
      alert('Crop entry created successfully!');
    } catch (error) {
      console.error('Error creating crop entry:', error);
      alert('Error creating crop entry: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditCropEntry = (cropEntry) => {
    setEditingCropEntry(cropEntry);
    setFormData({
      cropYear: cropEntry.sowingDate ? new Date(cropEntry.sowingDate).getFullYear().toString() : '',
      cropName: cropEntry.cropName || '',
      area: cropEntry.area?.toString() || '',
      production: cropEntry.expectedYield?.toString() || ''
    });
    setShowCreateForm(true);
  };

  const handleUpdateCropEntry = async (e) => {
    e.preventDefault();
    try {
      const cropData = {
        farmerId: null,
        cropName: formData.cropName,
        variety: 'Default Variety', // Default value
        area: parseFloat(formData.area) || 0,
        season: 'KHARIF', // Default season
        sowingDate: new Date().toISOString().split('T')[0], // Today's date
        expectedHarvestDate: null,
        expectedYield: parseFloat(formData.production) || 0, // Map production to expectedYield
        marketPrice: null,
        soilType: null,
        irrigationMethod: null,
        seedSource: null,
        fertilizerUsed: null,
        pesticideUsed: null,
        remarks: null,
        photoFileName: null
      };
      
      console.log('Updating crop entry:', editingCropEntry.id, 'with data:', cropData);
      await fpoAPI.updateCrop(fpoId, editingCropEntry.id, cropData);
      
      setShowCreateForm(false);
      setEditingCropEntry(null);
      setFormData({
        cropYear: '',
        cropName: '',
        area: '',
        production: ''
      });
      
      alert('Crop entry updated successfully!');
      loadCropEntries();
    } catch (error) {
      console.error('Error updating crop entry:', error);
      alert('Error updating crop entry: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteCropEntry = async (cropEntryId) => {
    if (window.confirm('Are you sure you want to delete this crop entry?')) {
      try {
        await fpoAPI.deleteCrop(fpoId, cropEntryId);
        alert('Crop entry deleted successfully!');
        loadCropEntries();
      } catch (error) {
        console.error('Error deleting crop entry:', error);
        alert('Error deleting crop entry: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const filteredCropEntries = cropEntries.filter(cropEntry => {
    const cropYear = cropEntry.sowingDate ? new Date(cropEntry.sowingDate).getFullYear() : null;
    const cropYearDisplay = cropYear ? `${cropYear}-${cropYear + 1}` : '';
    const matchesSearch = cropYearDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cropEntry.cropName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cropEntry.area?.toString().includes(searchTerm.toLowerCase()) ||
                         cropEntry.expectedYield?.toString().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Generate crop year options (as financial year format)
  const generateCropYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push({
        value: i,
        label: `${i}-${i + 1}`
      });
    }
    return years;
  };

  const formatNumber = (number) => {
    if (!number) return '0';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content crop-entries-modal">
        <div className="modal-header">
          <h2>FPO Crop Entry List</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Action Bar */}
          <div className="action-bar">
            <div className="action-buttons">
              <button 
                className="create-button"
                onClick={() => {
                  setEditingCropEntry(null);
                  setFormData({
                    cropYear: '',
                    cropName: '',
                    area: '',
                    production: ''
                  });
                  setShowCreateForm(true);
                }}
              >
                + Create Crop Entry
              </button>
            </div>
            
            <div className="refresh-container">
              <button 
                className="refresh-btn"
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  loadCropEntries();
                }}
                title="Refresh crop entries list"
              >
                <i className="fas fa-sync-alt"></i>
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Section - Hidden */}
          <div className="filter-section" style={{ display: 'none' }}>
            <div className="filter-label">FILTER</div>
            <div className="filter-inputs">
              <input
                type="text"
                placeholder="Search here..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <input
                type="text"
                placeholder="Enter a date range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="date-range-input"
              />
              <div className="date-format-hint">MM/DD/YYYY - MM/DD/YYYY</div>
            </div>
          </div>

          {/* Crop Entries Table */}
          <div className="table-container">
            <table className="crop-entries-table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Financial Year</th>
                  <th>Crop Name</th>
                  <th>Area (in Acres)</th>
                  <th>Production (in Metric Tons)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="loading-cell">Loading crop entries...</td>
                  </tr>
                ) : filteredCropEntries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data-cell">No data matching the filter</td>
                  </tr>
                ) : (
                  filteredCropEntries.map((cropEntry, index) => {
                    console.log('Rendering crop entry:', cropEntry);
                    return (
                    <tr key={cropEntry.id || index}>
                      <td>{cropEntry.id || `C${index + 1}`}</td>
                      <td>{cropEntry.sowingDate ? `${new Date(cropEntry.sowingDate).getFullYear()}-${new Date(cropEntry.sowingDate).getFullYear() + 1}` : '-'}</td>
                      <td>{cropEntry.cropName || '-'}</td>
                      <td>{formatNumber(cropEntry.area)}</td>
                      <td>{formatNumber(cropEntry.expectedYield)}</td>
                      <td>
                        <div className="action-dropdown">
                          <button 
                            className="dropdown-toggle"
                            onClick={() => setActiveDropdown(activeDropdown === cropEntry.id ? null : cropEntry.id)}
                          >
                            ⋯
                          </button>
                          {activeDropdown === cropEntry.id && (
                            <div className={`dropdown-menu ${index >= 2 ? 'dropdown-menu-bottom' : 'dropdown-menu-top'}`}>
                              <button 
                                className="dropdown-item edit-item"
                                onClick={() => {
                                  handleEditCropEntry(cropEntry);
                                  setActiveDropdown(null);
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                className="dropdown-item delete-item"
                                onClick={() => {
                                  handleDeleteCropEntry(cropEntry.id);
                                  setActiveDropdown(null);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Crop Entry Form Modal */}
      {showCreateForm && (
        <div className="form-modal-overlay">
          <div className="form-modal-content">
            <div className="form-modal-header">
              <h3>{editingCropEntry ? 'Edit Crop Entry' : 'Add Crop Entry'}</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCropEntry(null);
                  setFormData({
                    cropYear: '',
                    cropName: '',
                    area: '',
                    production: ''
                  });
                }}
              >
                ×
              </button>
            </div>
            <div className="form-modal-body">
              <form onSubmit={editingCropEntry ? handleUpdateCropEntry : handleCreateCropEntry}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Crop Year *</label>
                    <select
                      value={formData.cropYear}
                      onChange={(e) => setFormData({...formData, cropYear: e.target.value})}
                      required
                      className={!formData.cropYear ? 'required-field' : ''}
                    >
                      <option value="">Select Crop Year</option>
                      {generateCropYears().map(year => (
                        <option key={year.value} value={year.value}>{year.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Crop Name *</label>
                    <input
                      type="text"
                      value={formData.cropName}
                      onChange={(e) => setFormData({...formData, cropName: e.target.value})}
                      placeholder="Enter crop name"
                      required
                      className={!formData.cropName ? 'required-field' : ''}
                    />
                  </div>
                  <div className="form-group">
                    <label>Area (in Acres) *</label>
                    <input
                      type="number"
                      value={formData.area}
                      onChange={(e) => setFormData({...formData, area: e.target.value})}
                      placeholder="Enter area in acres"
                      required
                      min="0"
                      step="0.01"
                      className={!formData.area ? 'required-field' : ''}
                    />
                  </div>
                  <div className="form-group">
                    <label>Production (in Metric Tons) *</label>
                    <input
                      type="number"
                      value={formData.production}
                      onChange={(e) => setFormData({...formData, production: e.target.value})}
                      placeholder="Enter production in metric tons"
                      required
                      min="0"
                      step="0.01"
                      className={!formData.production ? 'required-field' : ''}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingCropEntry(null);
                      setFormData({
                        cropYear: '',
                        cropName: '',
                        area: '',
                        production: ''
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={`submit-btn ${!formData.cropYear || !formData.cropName || !formData.area || !formData.production ? 'disabled' : ''}`}
                    disabled={!formData.cropYear || !formData.cropName || !formData.area || !formData.production}
                  >
                    {editingCropEntry ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FPOCropEntriesModal;
