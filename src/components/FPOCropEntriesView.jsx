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
  const [focusedField, setFocusedField] = useState('');

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
      console.log('First crop entry sample:', cropData[0]);
      
      // Debug each crop entry's sowing date
      if (Array.isArray(cropData)) {
        cropData.forEach((entry, index) => {
          console.log(`🔍 Crop entry ${index + 1}:`, {
            id: entry.id,
            cropName: entry.cropName,
            sowingDate: entry.sowingDate,
            calculatedYear: entry.sowingDate ? new Date(entry.sowingDate).getFullYear() : null
          });
        });
      }
      
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
    
    // Crop year validation - 4 digits, reasonable range
    if (!formData.cropYear.trim()) {
      errors.cropYear = 'Crop year is required';
    } else if (!/^(19|20)\d{2}$/.test(formData.cropYear.trim())) {
      errors.cropYear = 'Please enter a valid 4-digit year (1900-2099)';
    }
    
    // Crop name validation - alphabets, spaces, and common characters
    if (!formData.cropName.trim()) {
      errors.cropName = 'Crop name is required';
    } else if (!/^[A-Za-z\s&.,()-]{2,50}$/.test(formData.cropName.trim())) {
      errors.cropName = 'Crop name must contain only letters, spaces and common characters (2-50 characters)';
    }
    
    // Area validation - positive decimal numbers
    if (!formData.area.trim()) {
      errors.area = 'Area is required';
    } else if (!/^\d+(\.\d{1,2})?$/.test(formData.area.trim()) || parseFloat(formData.area) <= 0) {
      errors.area = 'Please enter a valid positive number (up to 2 decimal places)';
    }
    
    // Production validation - positive decimal numbers
    if (!formData.production.trim()) {
      errors.production = 'Production is required';
    } else if (!/^\d+(\.\d{1,2})?$/.test(formData.production.trim()) || parseFloat(formData.production) <= 0) {
      errors.production = 'Please enter a valid positive number (up to 2 decimal places)';
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
      // Convert crop year to sowing date (use June 1st of the selected year)
      const cropYear = parseInt(formData.cropYear);
      const sowingDate = new Date(cropYear, 5, 1); // June 1st (month is 0-indexed)
      
      // Map frontend form data to backend DTO format
      const cropData = {
        farmerId: null,
        cropName: formData.cropName,
        variety: 'Default Variety', // Default value
        area: parseFloat(formData.area) || 0,
        season: 'KHARIF', // Default season
        sowingDate: sowingDate.toISOString().split('T')[0], // Convert crop year to sowing date
        expectedHarvestDate: null,
        expectedYield: parseFloat(formData.production) || 0, // Map production to expectedYield
        actualYield: parseFloat(formData.production) || 0, // Also set actualYield for production display
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
      production: (cropEntry.actualYield || cropEntry.expectedYield)?.toString() || ''
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
      // Convert crop year to sowing date (use June 1st of the selected year)
      const cropYear = parseInt(formData.cropYear);
      const sowingDate = new Date(cropYear, 5, 1); // June 1st (month is 0-indexed)
      
      const cropData = {
        farmerId: null,
        cropName: formData.cropName,
        variety: 'Default Variety', // Default value
        area: parseFloat(formData.area) || 0,
        season: 'KHARIF', // Default season
        sowingDate: sowingDate.toISOString().split('T')[0], // Convert crop year to sowing date
        expectedHarvestDate: null,
        expectedYield: parseFloat(formData.production) || 0, // Map production to expectedYield
        actualYield: parseFloat(formData.production) || 0, // Also set actualYield for production display
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
    let filteredValue = value;
    
    // Apply input restrictions based on field type
    switch (field) {
      case 'cropYear':
        filteredValue = value.replace(/[^0-9]/g, '');
        if (filteredValue.length > 4) filteredValue = filteredValue.substring(0, 4);
        break;
      case 'cropName':
        filteredValue = value.replace(/[^A-Za-z\s&.,()-]/g, '');
        if (filteredValue.length > 50) filteredValue = filteredValue.substring(0, 50);
        break;
      case 'area':
      case 'production':
        // Allow numbers and one decimal point
        filteredValue = value.replace(/[^0-9.]/g, '');
        // Ensure only one decimal point
        const parts = filteredValue.split('.');
        if (parts.length > 2) {
          filteredValue = parts[0] + '.' + parts.slice(1).join('');
        }
        // Limit to 2 decimal places
        if (parts.length === 2 && parts[1].length > 2) {
          filteredValue = parts[0] + '.' + parts[1].substring(0, 2);
        }
        break;
      default:
        break;
    }
    
    setFormData(prev => ({ ...prev, [field]: filteredValue }));
    
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
                  maxLength={4}
                  onFocus={() => setFocusedField('cropYear')}
                  onBlur={() => setFocusedField('')}
                />
                {focusedField === 'cropYear' && !formData.cropYear && (
                  <div className="field-hint">
                    <i className="fas fa-info-circle"></i>
                    Enter a 4-digit year (1900-2099)
                  </div>
                )}
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
                  maxLength={50}
                  onFocus={() => setFocusedField('cropName')}
                  onBlur={() => setFocusedField('')}
                />
                {focusedField === 'cropName' && !formData.cropName && (
                  <div className="field-hint">
                    <i className="fas fa-info-circle"></i>
                    Enter crop name using letters, spaces and common characters (e.g., Rice, Wheat, Corn)
                  </div>
                )}
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
                  maxLength={10}
                  onFocus={() => setFocusedField('area')}
                  onBlur={() => setFocusedField('')}
                />
                {focusedField === 'area' && !formData.area && (
                  <div className="field-hint">
                    <i className="fas fa-info-circle"></i>
                    Enter area in acres as a positive number (e.g., 5.5, 10.25)
                  </div>
                )}
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
                  maxLength={10}
                  onFocus={() => setFocusedField('production')}
                  onBlur={() => setFocusedField('')}
                />
                {focusedField === 'production' && !formData.production && (
                  <div className="field-hint">
                    <i className="fas fa-info-circle"></i>
                    Enter production in metric tons as a positive number (e.g., 2.5, 15.75)
                  </div>
                )}
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
          <div className="action-buttons">
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
                        {(() => {
                          // Try to get year from sowingDate
                          if (cropEntry.sowingDate) {
                            try {
                              const year = new Date(cropEntry.sowingDate).getFullYear();
                              console.log('🔍 Displaying crop year for entry', cropEntry.id, ':', `${year}-${year + 1}`);
                              return `${year}-${year + 1}`;
                            } catch (e) {
                              console.error('Error parsing sowing date:', cropEntry.sowingDate, e);
                            }
                          }
                          
                          // Fallback: try to extract year from other date fields
                          const dateFields = [
                            cropEntry.expectedHarvestDate,
                            cropEntry.actualHarvestDate,
                            cropEntry.createdAt,
                            cropEntry.updatedAt
                          ];
                          
                          for (const dateField of dateFields) {
                            if (dateField) {
                              try {
                                const year = new Date(dateField).getFullYear();
                                console.log('🔍 Using fallback date for entry', cropEntry.id, ':', `${year}-${year + 1}`);
                                return `${year}-${year + 1}`;
                              } catch (e) {
                                continue;
                              }
                            }
                          }
                          
                          // Final fallback: use current year
                          const currentYear = new Date().getFullYear();
                          console.log('🔍 Using current year for entry', cropEntry.id, ':', `${currentYear}-${currentYear + 1}`);
                          return `${currentYear}-${currentYear + 1}`;
                        })()}
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
                          {formatNumber(cropEntry.actualYield || cropEntry.expectedYield || 0)} MT
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
