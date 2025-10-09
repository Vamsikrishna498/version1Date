import React, { useState, useEffect } from 'react';
import { fpoAPI } from '../api/apiService';
import '../styles/FPOTurnoverView.css';

const FPOTurnoverView = ({ fpo, onClose, onToast }) => {
  const [turnovers, setTurnovers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTurnover, setEditingTurnover] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Form state for creating/editing turnovers
  const [formData, setFormData] = useState({
    financialYear: '',
    turnoverAmount: ''
  });

  useEffect(() => {
    if (fpo?.id) {
      loadTurnovers();
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

  const loadTurnovers = async () => {
    try {
      setLoading(true);
      console.log('Loading turnovers for FPO ID:', fpo.id);
      const response = await fpoAPI.getFPOTurnovers(fpo.id);
      console.log('Turnovers response:', response);
      
      // Handle different response formats
      const turnoverData = response.data || response || [];
      console.log('Turnovers data:', turnoverData);
      setTurnovers(Array.isArray(turnoverData) ? turnoverData : []);
    } catch (error) {
      console.error('Error loading turnovers:', error);
      setTurnovers([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.financialYear.trim()) {
      errors.financialYear = 'Financial year is required';
    }
    
    if (!formData.turnoverAmount.trim()) {
      errors.turnoverAmount = 'Turnover amount is required';
    } else if (isNaN(parseFloat(formData.turnoverAmount)) || parseFloat(formData.turnoverAmount) < 0) {
      errors.turnoverAmount = 'Please enter a valid positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTurnover = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Map frontend form data to backend DTO format
      const turnoverData = {
        financialYear: parseInt(formData.financialYear) || 0,
        month: 1, // Default month
        quarter: 1, // Default quarter
        revenue: parseFloat(formData.turnoverAmount) || 0,
        expenses: 0, // Default expenses
        turnoverType: 'YEARLY', // Default type
        description: null,
        remarks: null,
        documentFileName: null,
        enteredBy: null
      };
      
      console.log('Creating turnover with data:', turnoverData);
      const response = await fpoAPI.createTurnover(fpo.id, turnoverData);
      console.log('Turnover created successfully:', response);
      
      setShowCreateForm(false);
      setFormData({
        financialYear: '',
        turnoverAmount: ''
      });
      setFormErrors({});
      
      // Add a small delay to ensure backend processing
      setTimeout(() => {
        loadTurnovers();
      }, 500);
      
      onToast && onToast('success', 'Turnover created successfully!');
    } catch (error) {
      console.error('Error creating turnover:', error);
      onToast && onToast('error', 'Error creating turnover: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditTurnover = (turnover) => {
    setEditingTurnover(turnover);
    setFormData({
      financialYear: turnover.financialYear?.toString() || '',
      turnoverAmount: turnover.revenue?.toString() || ''
    });
    setFormErrors({});
    setShowCreateForm(true);
  };

  const handleUpdateTurnover = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const turnoverData = {
        financialYear: parseInt(formData.financialYear) || 0,
        month: 1, // Default month
        quarter: 1, // Default quarter
        revenue: parseFloat(formData.turnoverAmount) || 0,
        expenses: 0, // Default expenses
        turnoverType: 'YEARLY', // Default type
        description: null,
        remarks: null,
        documentFileName: null,
        enteredBy: null
      };
      
      console.log('Updating turnover:', editingTurnover.id, 'with data:', turnoverData);
      await fpoAPI.updateTurnover(fpo.id, editingTurnover.id, turnoverData);
      
      setShowCreateForm(false);
      setEditingTurnover(null);
      setFormData({
        financialYear: '',
        turnoverAmount: ''
      });
      setFormErrors({});
      
      onToast && onToast('success', 'Turnover updated successfully!');
      loadTurnovers();
    } catch (error) {
      console.error('Error updating turnover:', error);
      onToast && onToast('error', 'Error updating turnover: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteTurnover = async (turnoverId) => {
    if (window.confirm('Are you sure you want to delete this turnover record?')) {
      try {
        await fpoAPI.deleteTurnover(fpo.id, turnoverId);
        onToast && onToast('success', 'Turnover deleted successfully!');
        loadTurnovers();
      } catch (error) {
        console.error('Error deleting turnover:', error);
        onToast && onToast('error', 'Error deleting turnover: ' + (error.response?.data?.message || error.message));
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

  const filteredTurnovers = turnovers.filter(turnover => {
    const financialYearDisplay = turnover.financialYear ? `${turnover.financialYear}-${turnover.financialYear + 1}` : '';
    const matchesSearch = financialYearDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         turnover.revenue?.toString().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Generate financial year options (as financial year format)
  const generateFinancialYears = () => {
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

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateTotalTurnover = () => {
    return turnovers.reduce((total, turnover) => total + (turnover.revenue || 0), 0);
  };

  const calculateAverageTurnover = () => {
    if (turnovers.length === 0) return 0;
    return calculateTotalTurnover() / turnovers.length;
  };

  const getHighestTurnover = () => {
    if (turnovers.length === 0) return 0;
    return Math.max(...turnovers.map(t => t.revenue || 0));
  };

  const getLatestYear = () => {
    if (turnovers.length === 0) return null;
    return Math.max(...turnovers.map(t => t.financialYear || 0));
  };

  // If showing create/edit form, render the form in full width
  if (showCreateForm) {
    return (
      <div className="fpo-turnover-form">
        {/* Header */}
        <div className="form-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="form-title">
                {editingTurnover ? 'Edit Turnover Record' : 'Add New Turnover Record'}
              </h1>
              <p className="form-subtitle">
                {editingTurnover ? 'Update turnover record information' : 'Add a new turnover record for ' + (fpo?.fpoName || 'FPO')}
              </p>
            </div>
            <div className="header-right">
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingTurnover(null);
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
          <form onSubmit={editingTurnover ? handleUpdateTurnover : handleCreateTurnover} className="turnover-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="financialYear" className="form-label">
                  Financial Year <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="financialYear"
                  value={formData.financialYear}
                  onChange={(e) => updateField('financialYear', e.target.value)}
                  className={`form-input ${formErrors.financialYear ? 'error' : ''}`}
                  placeholder="e.g., 2023-24"
                />
                {formErrors.financialYear && <span className="error-message">{formErrors.financialYear}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="turnoverAmount" className="form-label">
                  Turnover Amount <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="turnoverAmount"
                  value={formData.turnoverAmount}
                  onChange={(e) => updateField('turnoverAmount', e.target.value)}
                  className={`form-input ${formErrors.turnoverAmount ? 'error' : ''}`}
                  placeholder="Enter turnover amount in INR"
                  min="0"
                  step="0.01"
                />
                {formErrors.turnoverAmount && <span className="error-message">{formErrors.turnoverAmount}</span>}
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
                  setEditingTurnover(null);
                  setFormErrors({});
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                <i className="fas fa-plus"></i>
                {editingTurnover ? 'Update Record' : 'Add Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fpo-turnover-view">
      {/* Header Section */}
      <div className="turnover-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="turnover-title">Financial Turnover Management</h1>
            <p className="turnover-subtitle">Manage financial turnover records for {fpo?.fpoName || 'FPO'}</p>
          </div>
          <div className="header-right">
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="turnover-content">
        {/* Action Bar */}
        <div className="action-bar">
          <div className="action-buttons">
            <button 
              className="create-turnover-btn"
              onClick={() => {
                setShowCreateForm(true);
                setEditingTurnover(null);
                setFormData({
                  financialYear: '',
                  turnoverAmount: ''
                });
                setFormErrors({});
              }}
            >
              <i className="fas fa-plus"></i>
              Add Turnover Record
            </button>
          </div>
          
          <div className="refresh-container">
            <button 
              className="refresh-btn"
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                loadTurnovers();
              }}
              title="Refresh turnover records list"
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
                placeholder="Search turnover records..."
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

        {/* Turnover Table */}
        <div className="turnover-table-container">
          <div className="table-wrapper">
            <table className="turnover-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Financial Year</th>
                  <th>Turnover Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="loading-cell">
                      <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        Loading turnover records...
                      </div>
                    </td>
                  </tr>
                ) : filteredTurnovers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data-cell">
                      <div className="no-data-message">
                        <i className="fas fa-chart-line"></i>
                        <p>No turnover records found</p>
                        <span>Try adjusting your search criteria or add a new turnover record</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTurnovers.map((turnover, index) => (
                    <tr key={turnover.id || index} className="turnover-row">
                      <td className="turnover-id">{turnover.id || `T${index + 1}`}</td>
                      <td className="turnover-year">
                        {turnover.financialYear ? `${turnover.financialYear}-${turnover.financialYear + 1}` : '-'}
                      </td>
                      <td className="turnover-amount">
                        <span className="amount-display">
                          {formatCurrency(turnover.revenue)}
                        </span>
                      </td>
                      <td className="turnover-actions">
                        <div className="action-dropdown">
                          <button 
                            className="dropdown-toggle"
                            onClick={() => setActiveDropdown(activeDropdown === turnover.id ? null : turnover.id)}
                          >
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                          {activeDropdown === turnover.id && (
                            <div className={`dropdown-menu ${index >= 2 ? 'dropdown-menu-bottom' : 'dropdown-menu-top'}`}>
                              <button 
                                className="dropdown-item-enhanced edit-item"
                                onClick={() => {
                                  handleEditTurnover(turnover);
                                  setActiveDropdown(null);
                                }}
                              >
                                <i className="fas fa-edit"></i>
                                Edit
                              </button>
                              <button 
                                className="dropdown-item-enhanced delete-item"
                                onClick={() => {
                                  handleDeleteTurnover(turnover.id);
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
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{turnovers.length}</span>
              <span className="stat-label">Total Records</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-rupee-sign"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{formatCurrency(calculateTotalTurnover())}</span>
              <span className="stat-label">Total Turnover</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-chart-bar"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{formatCurrency(calculateAverageTurnover())}</span>
              <span className="stat-label">Average Turnover</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-trophy"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{formatCurrency(getHighestTurnover())}</span>
              <span className="stat-label">Highest Turnover</span>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        {turnovers.length > 0 && (
          <div className="financial-overview">
            <div className="overview-header">
              <h3>Financial Overview</h3>
              <p>Comprehensive financial analysis and insights</p>
            </div>
            <div className="overview-content">
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Latest Financial Year</span>
                  <span className="overview-value">
                    {getLatestYear() ? `${getLatestYear()}-${getLatestYear() + 1}` : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-trending-up"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Growth Potential</span>
                  <span className="overview-value">
                    {turnovers.length >= 2 ? 'Analyzing...' : 'Insufficient Data'}
                  </span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-chart-pie"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Performance</span>
                  <span className="overview-value">
                    {turnovers.length > 0 ? 'Good' : 'No Data'}
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

export default FPOTurnoverView;
