import React, { useState, useEffect } from 'react';
import { fpoAPI } from '../api/apiService';
import '../styles/FPOCropEntriesView.css';

const FPOCropEntriesView = ({ fpo, onClose, onToast }) => {
  const [cropEntries, setCropEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCropEntry, setEditingCropEntry] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Form state for creating/editing crop entries
  const [formData, setFormData] = useState({
    cropYear: '',
    cropName: '',
    area: '',
    production: ''
  });

  useEffect(() => {
    if (fpo?.id) {
      loadCropEntries();
    }
  }, [fpo?.id]);

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
      console.log('Loading crop entries for FPO ID:', fpo.id);
      const response = await fpoAPI.getFPOCrops(fpo.id);
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

  const validateForm = () => {
    const errors = {};
    
    if (!formData.cropYear.trim()) {
      errors.cropYear = 'Crop year is required';
    }
    
    if (!formData.cropName.trim()) {
      errors.cropName = 'Crop name is required';
    }
    
    if (!formData.area.trim()) {
      errors.area = 'Area is required';
    } else if (isNaN(parseFloat(formData.area)) || parseFloat(formData.area) < 0) {
      errors.area = 'Please enter a valid positive number';
    }
    
    if (!formData.production.trim()) {
      errors.production = 'Production is required';
    } else if (isNaN(parseFloat(formData.production)) || parseFloat(formData.production) < 0) {
      errors.production = 'Please enter a valid positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCropEntry = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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
      const response = await fpoAPI.createCrop(fpo.id, cropData);
      console.log('Crop entry created successfully:', response);
      
      setShowCreateForm(false);
      setFormData({
        cropYear: '',
        cropName: '',
        area: '',
        production: ''
      });
      setFormErrors({});
      
      // Add a small delay to ensure backend processing
      setTimeout(() => {
        loadCropEntries();
      }, 500);
      
      onToast && onToast('success', 'Crop entry created successfully!');
    } catch (error) {
      console.error('Error creating crop entry:', error);
      onToast && onToast('error', 'Error creating crop entry: ' + (error.response?.data?.message || error.message));
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
    setFormErrors({});
    setShowCreateForm(true);
  };

  const handleUpdateCropEntry = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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
      await fpoAPI.updateCrop(fpo.id, editingCropEntry.id, cropData);
      
      setShowCreateForm(false);
      setEditingCropEntry(null);
      setFormData({
        cropYear: '',
        cropName: '',
        area: '',
        production: ''
      });
      setFormErrors({});
      
      onToast && onToast('success', 'Crop entry updated successfully!');
      loadCropEntries();
    } catch (error) {
      console.error('Error updating crop entry:', error);
      onToast && onToast('error', 'Error updating crop entry: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteCropEntry = async (cropEntryId) => {
    if (window.confirm('Are you sure you want to delete this crop entry?')) {
      try {
        await fpoAPI.deleteCrop(fpo.id, cropEntryId);
        onToast && onToast('success', 'Crop entry deleted successfully!');
        loadCropEntries();
      } catch (error) {
        console.error('Error deleting crop entry:', error);
        onToast && onToast('error', 'Error deleting crop entry: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
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

  const calculateTotalArea = () => {
    return cropEntries.reduce((total, cropEntry) => total + (cropEntry.area || 0), 0);
  };

  const calculateTotalProduction = () => {
    return cropEntries.reduce((total, cropEntry) => total + (cropEntry.expectedYield || 0), 0);
  };

  const calculateAverageYield = () => {
    if (cropEntries.length === 0) return 0;
    const totalArea = calculateTotalArea();
    if (totalArea === 0) return 0;
    return calculateTotalProduction() / totalArea;
  };

  const getUniqueCrops = () => {
    const uniqueCrops = [...new Set(cropEntries.map(crop => crop.cropName).filter(Boolean))];
    return uniqueCrops.length;
  };

  const getLatestYear = () => {
    if (cropEntries.length === 0) return null;
    const years = cropEntries.map(crop => crop.sowingDate ? new Date(crop.sowingDate).getFullYear() : null).filter(Boolean);
    return years.length > 0 ? Math.max(...years) : null;
  };

  // If showing create/edit form, render the form in full width
  if (showCreateForm) {
    return (
      <div className="fpo-crop-entry-form">
        {/* Header */}
        <div className="form-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="form-title">
                {editingCropEntry ? 'Edit Crop Entry' : 'Add New Crop Entry'}
              </h1>
              <p className="form-subtitle">
                {editingCropEntry ? 'Update crop entry information' : 'Add a new crop entry for ' + (fpo?.fpoName || 'FPO')}
              </p>
            </div>
            <div className="header-right">
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCropEntry(null);
                  setFormErrors({});
                }}
                title="Close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="form-content">
          <form onSubmit={editingCropEntry ? handleUpdateCropEntry : handleCreateCropEntry} className="crop-entry-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="cropYear" className="form-label">
                  Crop Year <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="cropYear"
                  value={formData.cropYear}
                  onChange={(e) => updateField('cropYear', e.target.value)}
                  className={`form-input ${formErrors.cropYear ? 'error' : ''}`}
                  placeholder="e.g., 2023"
                />
                {formErrors.cropYear && <span className="error-message">{formErrors.cropYear}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="cropName" className="form-label">
                  Crop Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="cropName"
                  value={formData.cropName}
                  onChange={(e) => updateField('cropName', e.target.value)}
                  className={`form-input ${formErrors.cropName ? 'error' : ''}`}
                  placeholder="Enter crop name (e.g., Rice, Wheat)"
                />
                {formErrors.cropName && <span className="error-message">{formErrors.cropName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="area" className="form-label">
                  Area (in acres) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="area"
                  value={formData.area}
                  onChange={(e) => updateField('area', e.target.value)}
                  className={`form-input ${formErrors.area ? 'error' : ''}`}
                  placeholder="Enter area in acres"
                  min="0"
                  step="0.01"
                />
                {formErrors.area && <span className="error-message">{formErrors.area}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="production" className="form-label">
                  Production (in metric tons) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="production"
                  value={formData.production}
                  onChange={(e) => updateField('production', e.target.value)}
                  className={`form-input ${formErrors.production ? 'error' : ''}`}
                  placeholder="Enter production in metric tons"
                  min="0"
                  step="0.01"
                />
                {formErrors.production && <span className="error-message">{formErrors.production}</span>}
              </div>
            </div>

            {/* Submit Error */}
            {formErrors.submit && (
              <div className="submit-error">
                <i className="fas fa-exclamation-triangle"></i>
                {formErrors.submit}
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCropEntry(null);
                  setFormErrors({});
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                <i className="fas fa-seedling"></i>
                {editingCropEntry ? 'Update Entry' : 'Add Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fpo-crop-entries-view">
      {/* Header Section */}
      <div className="crop-entries-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="crop-entries-title">Crop Production Management</h1>
            <p className="crop-entries-subtitle">Manage crop entries and production data for {fpo?.fpoName || 'FPO'}</p>
          </div>
          <div className="header-right">
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="crop-entries-content">
        {/* Action Bar */}
        <div className="action-bar">
          <button 
            className="create-crop-entry-btn"
            onClick={() => {
              setShowCreateForm(true);
              setEditingCropEntry(null);
              setFormData({
                cropYear: '',
                cropName: '',
                area: '',
                production: ''
              });
              setFormErrors({});
            }}
          >
            <i className="fas fa-seedling"></i>
            Add Crop Entry
          </button>

          {/* Filter Section */}
          <div className="filter-section">
            <div className="search-container">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Search crop entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="date-filter-container">
              <i className="fas fa-calendar-alt calendar-icon"></i>
              <input
                type="text"
                placeholder="Date range filter"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="date-filter-input"
              />
            </div>
          </div>
        </div>

        {/* Crop Entries Table */}
        <div className="crop-entries-table-container">
          <div className="table-wrapper">
            <table className="crop-entries-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Financial Year</th>
                  <th>Crop Name</th>
                  <th>Area (Acres)</th>
                  <th>Production (Metric Tons)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="loading-cell">
                      <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        Loading crop entries...
                      </div>
                    </td>
                  </tr>
                ) : filteredCropEntries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data-cell">
                      <div className="no-data-message">
                        <i className="fas fa-seedling"></i>
                        <p>No crop entries found</p>
                        <span>Try adjusting your search criteria or add a new crop entry</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCropEntries.map((cropEntry, index) => (
                    <tr key={cropEntry.id || index} className="crop-entry-row">
                      <td className="crop-entry-id">{cropEntry.id || `C${index + 1}`}</td>
                      <td className="crop-entry-year">
                        {cropEntry.sowingDate ? `${new Date(cropEntry.sowingDate).getFullYear()}-${new Date(cropEntry.sowingDate).getFullYear() + 1}` : '-'}
                      </td>
                      <td className="crop-entry-name">
                        <span className="crop-name-display">
                          {cropEntry.cropName || '-'}
                        </span>
                      </td>
                      <td className="crop-entry-area">
                        <span className="area-display">
                          {formatNumber(cropEntry.area)} acres
                        </span>
                      </td>
                      <td className="crop-entry-production">
                        <span className="production-display">
                          {formatNumber(cropEntry.expectedYield)} MT
                        </span>
                      </td>
                      <td className="crop-entry-actions">
                        <div className="action-dropdown">
                          <button 
                            className="dropdown-toggle"
                            onClick={() => setActiveDropdown(activeDropdown === cropEntry.id ? null : cropEntry.id)}
                          >
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                          {activeDropdown === cropEntry.id && (
                            <div className={`dropdown-menu ${index >= 2 ? 'dropdown-menu-bottom' : 'dropdown-menu-top'}`}>
                              <button 
                                className="dropdown-item-enhanced edit-item"
                                onClick={() => {
                                  handleEditCropEntry(cropEntry);
                                  setActiveDropdown(null);
                                }}
                              >
                                <i className="fas fa-edit"></i>
                                Edit
                              </button>
                              <button 
                                className="dropdown-item-enhanced delete-item"
                                onClick={() => {
                                  handleDeleteCropEntry(cropEntry.id);
                                  setActiveDropdown(null);
                                }}
                              >
                                <i className="fas fa-trash"></i>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="stats-summary">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-list"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{cropEntries.length}</span>
              <span className="stat-label">Total Entries</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-seedling"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{getUniqueCrops()}</span>
              <span className="stat-label">Unique Crops</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-map"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{formatNumber(calculateTotalArea())}</span>
              <span className="stat-label">Total Area (Acres)</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-weight"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{formatNumber(calculateTotalProduction())}</span>
              <span className="stat-label">Total Production (MT)</span>
            </div>
          </div>
        </div>

        {/* Production Overview */}
        {cropEntries.length > 0 && (
          <div className="production-overview">
            <div className="overview-header">
              <h3>Production Overview</h3>
              <p>Comprehensive crop production analysis and insights</p>
            </div>
            <div className="overview-content">
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Average Yield</span>
                  <span className="overview-value">
                    {formatNumber(calculateAverageYield())} MT/Acre
                  </span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Latest Crop Year</span>
                  <span className="overview-value">
                    {getLatestYear() ? `${getLatestYear()}-${getLatestYear() + 1}` : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-leaf"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Crop Diversity</span>
                  <span className="overview-value">
                    {getUniqueCrops()} Different Crops
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default FPOCropEntriesView;
