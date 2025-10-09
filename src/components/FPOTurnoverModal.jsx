import React, { useState, useEffect } from 'react';
import { fpoAPI } from '../api/apiService';
import '../styles/FPOModal.css';

const FPOTurnoverModal = ({ isOpen, onClose, fpoId, fpoName }) => {
  const [turnovers, setTurnovers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTurnover, setEditingTurnover] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Form state for creating/editing turnovers
  const [formData, setFormData] = useState({
    financialYear: '',
    turnoverAmount: ''
  });

  useEffect(() => {
    if (isOpen && fpoId) {
      loadTurnovers();
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

  const loadTurnovers = async () => {
    try {
      setLoading(true);
      console.log('Loading turnovers for FPO ID:', fpoId);
      const response = await fpoAPI.getFPOTurnovers(fpoId);
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

  const handleCreateTurnover = async (e) => {
    e.preventDefault();
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
      console.log('FPO ID:', fpoId);
      
      const response = await fpoAPI.createTurnover(fpoId, turnoverData);
      console.log('Turnover created successfully:', response);
      
      setShowCreateForm(false);
      setFormData({
        financialYear: '',
        turnoverAmount: ''
      });
      
      // Add a small delay to ensure backend processing
      setTimeout(() => {
        loadTurnovers();
      }, 500);
      
      alert('Turnover created successfully!');
    } catch (error) {
      console.error('Error creating turnover:', error);
      alert('Error creating turnover: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditTurnover = (turnover) => {
    setEditingTurnover(turnover);
    setFormData({
      financialYear: turnover.financialYear?.toString() || '',
      turnoverAmount: turnover.revenue?.toString() || ''
    });
    setShowCreateForm(true);
  };

  const handleUpdateTurnover = async (e) => {
    e.preventDefault();
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
      await fpoAPI.updateTurnover(fpoId, editingTurnover.id, turnoverData);
      
      setShowCreateForm(false);
      setEditingTurnover(null);
      setFormData({
        financialYear: '',
        turnoverAmount: ''
      });
      
      alert('Turnover updated successfully!');
      loadTurnovers();
    } catch (error) {
      console.error('Error updating turnover:', error);
      alert('Error updating turnover: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteTurnover = async (turnoverId) => {
    if (window.confirm('Are you sure you want to delete this turnover record?')) {
      try {
        await fpoAPI.deleteTurnover(fpoId, turnoverId);
        alert('Turnover deleted successfully!');
        loadTurnovers();
      } catch (error) {
        console.error('Error deleting turnover:', error);
        alert('Error deleting turnover: ' + (error.response?.data?.message || error.message));
      }
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content turnover-modal">
        <div className="modal-header">
          <h2>FPO Turnover List</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Action Bar */}
          <div className="action-bar">
            <div className="action-buttons">
              <button 
                className="create-button"
                onClick={() => {
                  setEditingTurnover(null);
                  setFormData({
                    financialYear: '',
                    turnoverAmount: ''
                  });
                  setShowCreateForm(true);
                }}
              >
                + Create Turnover
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

          {/* Turnovers Table */}
          <div className="table-container">
            <table className="turnover-table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Financial Year</th>
                  <th>Turnover</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="loading-cell">Loading turnovers...</td>
                  </tr>
                ) : filteredTurnovers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data-cell">No data matching the filter</td>
                  </tr>
                ) : (
                  filteredTurnovers.map((turnover, index) => {
                    console.log('Rendering turnover:', turnover);
                    return (
                    <tr key={turnover.id || index}>
                      <td>{turnover.id || `T${index + 1}`}</td>
                      <td>{turnover.financialYear ? `${turnover.financialYear}-${turnover.financialYear + 1}` : '-'}</td>
                      <td>{formatCurrency(turnover.revenue)}</td>
                      <td>
                        <div className="action-dropdown">
                          <button 
                            className="dropdown-toggle"
                            onClick={() => setActiveDropdown(activeDropdown === turnover.id ? null : turnover.id)}
                          >
                            ⋯
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
                                Edit
                              </button>
                              <button 
                                className="dropdown-item-enhanced delete-item"
                                onClick={() => {
                                  handleDeleteTurnover(turnover.id);
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

      {/* Create/Edit Turnover Form Modal */}
      {showCreateForm && (
        <div className="form-modal-overlay">
          <div className="form-modal-content">
            <div className="form-modal-header">
              <h3>{editingTurnover ? 'Edit Turnover' : 'Create Turnover'}</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingTurnover(null);
                  setFormData({ financialYear: '', turnoverAmount: '' });
                }}
              >
                ×
              </button>
            </div>
            <div className="form-modal-body">
              <form onSubmit={editingTurnover ? handleUpdateTurnover : handleCreateTurnover}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Financial Year *</label>
                    <select
                      value={formData.financialYear}
                      onChange={(e) => setFormData({...formData, financialYear: e.target.value})}
                      required
                      className={!formData.financialYear ? 'required-field' : ''}
                    >
                      <option value="">Select Financial Year</option>
                      {generateFinancialYears().map(year => (
                        <option key={year.value} value={year.value}>{year.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Turnover Amount *</label>
                    <input
                      type="number"
                      value={formData.turnoverAmount}
                      onChange={(e) => setFormData({...formData, turnoverAmount: e.target.value})}
                      placeholder="Enter turnover amount"
                      required
                      min="0"
                      step="0.01"
                      className={!formData.turnoverAmount ? 'required-field' : ''}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingTurnover(null);
                      setFormData({
                        financialYear: '',
                        turnoverAmount: ''
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={`submit-btn ${!formData.financialYear || !formData.turnoverAmount ? 'disabled' : ''}`}
                    disabled={!formData.financialYear || !formData.turnoverAmount}
                  >
                    {editingTurnover ? 'Update' : 'Create'}
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

export default FPOTurnoverModal;
