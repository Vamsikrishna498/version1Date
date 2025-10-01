import React, { useState, useEffect } from 'react';
import { fpoAPI } from '../api/apiService';
import '../styles/FPOInputShopView.css';

const FPOInputShopView = ({ fpo, onClose, onToast }) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Form state for creating/editing input shops
  const [formData, setFormData] = useState({
    shopName: '',
    seedLicense: '',
    pesticideLicense: '',
    fertiliserLicense: ''
  });

  useEffect(() => {
    if (fpo?.id) {
      loadShops();
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

  const loadShops = async () => {
    try {
      setLoading(true);
      console.log('Loading input shops for FPO ID:', fpo.id);
      const response = await fpoAPI.getFPOInputShops(fpo.id);
      console.log('Input shops response:', response);
      
      // Handle different response formats
      const shopData = response.data || response || [];
      console.log('Input shops data:', shopData);
      setShops(Array.isArray(shopData) ? shopData : []);
    } catch (error) {
      console.error('Error loading input shops:', error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.shopName.trim()) {
      errors.shopName = 'Shop name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const payload = {
        shopName: formData.shopName,
        seedLicense: formData.seedLicense || null,
        pesticideLicense: formData.pesticideLicense || null,
        fertiliserLicense: formData.fertiliserLicense || null,
      };
      
      console.log('Creating input shop with data:', payload);
      await fpoAPI.createInputShop(fpo.id, payload);
      console.log('Input shop created successfully');
      
      setShowCreateForm(false);
      setFormData({
        shopName: '',
        seedLicense: '',
        pesticideLicense: '',
        fertiliserLicense: ''
      });
      setFormErrors({});
      
      // Add a small delay to ensure backend processing
      setTimeout(() => {
        loadShops();
      }, 500);
      
      onToast && onToast('success', 'Input Shop created successfully!');
    } catch (error) {
      console.error('Error creating input shop:', error);
      onToast && onToast('error', 'Error creating shop: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditShop = (shop) => {
    setEditingShop(shop);
    setFormData({
      shopName: shop.shopName || '',
      seedLicense: shop.seedLicense || '',
      pesticideLicense: shop.pesticideLicense || '',
      fertiliserLicense: shop.fertiliserLicense || ''
    });
    setFormErrors({});
    setShowCreateForm(true);
  };

  const handleUpdateShop = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const payload = {
        shopName: formData.shopName,
        seedLicense: formData.seedLicense || null,
        pesticideLicense: formData.pesticideLicense || null,
        fertiliserLicense: formData.fertiliserLicense || null,
      };
      
      console.log('Updating input shop:', editingShop.id, 'with data:', payload);
      await fpoAPI.updateInputShop(fpo.id, editingShop.id, payload);
      
      setShowCreateForm(false);
      setEditingShop(null);
      setFormData({
        shopName: '',
        seedLicense: '',
        pesticideLicense: '',
        fertiliserLicense: ''
      });
      setFormErrors({});
      
      onToast && onToast('success', 'Input Shop updated successfully!');
      loadShops();
    } catch (error) {
      console.error('Error updating input shop:', error);
      onToast && onToast('error', 'Error updating shop: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteShop = async (shopId) => {
    if (window.confirm('Are you sure you want to delete this input shop?')) {
      try {
        await fpoAPI.deleteInputShop(fpo.id, shopId);
        onToast && onToast('success', 'Input Shop deleted successfully!');
        loadShops();
      } catch (error) {
        console.error('Error deleting input shop:', error);
        onToast && onToast('error', 'Error deleting shop: ' + (error.response?.data?.message || error.message));
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

  const filteredShops = shops.filter(shop =>
    (shop.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.seedLicense || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.pesticideLicense || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.fertiliserLicense || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLicenseStatus = (license) => {
    if (!license) return { status: 'Not Available', color: '#ef4444', bg: '#fef2f2' };
    return { status: 'Available', color: '#10b981', bg: '#f0fdf4' };
  };

  const getShopsWithAllLicenses = () => {
    return shops.filter(shop => 
      shop.seedLicense && shop.pesticideLicense && shop.fertiliserLicense
    ).length;
  };

  const getShopsWithPartialLicenses = () => {
    return shops.filter(shop => {
      const licenses = [shop.seedLicense, shop.pesticideLicense, shop.fertiliserLicense];
      const validLicenses = licenses.filter(Boolean);
      return validLicenses.length > 0 && validLicenses.length < 3;
    }).length;
  };

  const getShopsWithoutLicenses = () => {
    return shops.filter(shop => 
      !shop.seedLicense && !shop.pesticideLicense && !shop.fertiliserLicense
    ).length;
  };

  // If creating or editing, render a full-width form view (like Turnover form)
  if (showCreateForm) {
    return (
      <div className="fpo-input-shop-form">
        {/* Header */}
        <div className="form-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="form-title">{editingShop ? 'Edit Input Shop' : 'Add New Input Shop'}</h1>
              <p className="form-subtitle">
                {editingShop ? 'Update input shop information' : 'Add a new input shop for ' + (fpo?.fpoName || 'FPO')}
              </p>
            </div>
            <div className="header-right">
              <button
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingShop(null);
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
          <form onSubmit={editingShop ? handleUpdateShop : handleCreateShop} className="input-shop-form">
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="shopName" className="form-label">
                  Shop Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="shopName"
                  value={formData.shopName}
                  onChange={(e) => updateField('shopName', e.target.value)}
                  className={`form-input ${formErrors.shopName ? 'error' : ''}`}
                  placeholder="Enter shop name"
                />
                {formErrors.shopName && <span className="error-message">{formErrors.shopName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="seedLicense" className="form-label">Seed License</label>
                <input
                  type="text"
                  id="seedLicense"
                  value={formData.seedLicense}
                  onChange={(e) => updateField('seedLicense', e.target.value)}
                  className="form-input"
                  placeholder="Enter seed license number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="pesticideLicense" className="form-label">Pesticide License</label>
                <input
                  type="text"
                  id="pesticideLicense"
                  value={formData.pesticideLicense}
                  onChange={(e) => updateField('pesticideLicense', e.target.value)}
                  className="form-input"
                  placeholder="Enter pesticide license number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fertiliserLicense" className="form-label">Fertilizer License</label>
                <input
                  type="text"
                  id="fertiliserLicense"
                  value={formData.fertiliserLicense}
                  onChange={(e) => updateField('fertiliserLicense', e.target.value)}
                  className="form-input"
                  placeholder="Enter fertilizer license number"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingShop(null);
                  setFormErrors({});
                }}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-store"></i>
                {editingShop ? 'Update Shop' : 'Add Shop'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fpo-input-shop-view">
      {/* Header Section */}
      <div className="input-shop-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="input-shop-title">Input Shop Management</h1>
            <p className="input-shop-subtitle">Manage input shops and licensing for {fpo?.fpoName || 'FPO'}</p>
          </div>
          <div className="header-right">
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="input-shop-content">
        {/* Action Bar */}
        <div className="action-bar">
          <button 
            className="create-shop-btn"
            onClick={() => {
              setShowCreateForm(true);
              setEditingShop(null);
              setFormData({
                shopName: '',
                seedLicense: '',
                pesticideLicense: '',
                fertiliserLicense: ''
              });
              setFormErrors({});
            }}
          >
            <i className="fas fa-store"></i>
            Add Input Shop
          </button>

          {/* Filter Section */}
          <div className="filter-section">
            <div className="search-container">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Search input shops..."
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

        {/* Input Shops Table */}
        <div className="input-shop-table-container">
          <div className="table-wrapper">
            <table className="input-shop-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Shop Name</th>
                  <th>Seed License</th>
                  <th>Pesticide License</th>
                  <th>Fertilizer License</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="loading-cell">
                      <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        Loading input shops...
                      </div>
                    </td>
                  </tr>
                ) : filteredShops.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data-cell">
                      <div className="no-data-message">
                        <i className="fas fa-store"></i>
                        <p>No input shops found</p>
                        <span>Try adjusting your search criteria or add a new input shop</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredShops.map((shop, index) => {
                    const seedStatus = getLicenseStatus(shop.seedLicense);
                    const pesticideStatus = getLicenseStatus(shop.pesticideLicense);
                    const fertilizerStatus = getLicenseStatus(shop.fertiliserLicense);
                    
                    return (
                      <tr key={shop.id || index} className="input-shop-row">
                        <td className="shop-id">{shop.id || `S${index + 1}`}</td>
                        <td className="shop-name">
                          <span className="shop-name-display">
                            {shop.shopName || '-'}
                          </span>
                        </td>
                        <td className="license-cell">
                          <span 
                            className="license-status"
                            style={{ 
                              color: seedStatus.color, 
                              backgroundColor: seedStatus.bg,
                              border: `1px solid ${seedStatus.color}20`
                            }}
                          >
                            {seedStatus.status}
                          </span>
                        </td>
                        <td className="license-cell">
                          <span 
                            className="license-status"
                            style={{ 
                              color: pesticideStatus.color, 
                              backgroundColor: pesticideStatus.bg,
                              border: `1px solid ${pesticideStatus.color}20`
                            }}
                          >
                            {pesticideStatus.status}
                          </span>
                        </td>
                        <td className="license-cell">
                          <span 
                            className="license-status"
                            style={{ 
                              color: fertilizerStatus.color, 
                              backgroundColor: fertilizerStatus.bg,
                              border: `1px solid ${fertilizerStatus.color}20`
                            }}
                          >
                            {fertilizerStatus.status}
                          </span>
                        </td>
                        <td className="shop-actions">
                          <div className="action-dropdown">
                            <button 
                              className="dropdown-toggle"
                              onClick={() => setActiveDropdown(activeDropdown === shop.id ? null : shop.id)}
                            >
                              <i className="fas fa-ellipsis-v"></i>
                            </button>
                            {activeDropdown === shop.id && (
                              <div className={`dropdown-menu ${index >= 2 ? 'dropdown-menu-bottom' : 'dropdown-menu-top'}`}>
                                <button 
                                  className="dropdown-item-enhanced edit-item"
                                  onClick={() => {
                                    handleEditShop(shop);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  <i className="fas fa-edit"></i>
                                  Edit
                                </button>
                                <button 
                                  className="dropdown-item-enhanced delete-item"
                                  onClick={() => {
                                    handleDeleteShop(shop.id);
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="stats-summary">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-store"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{shops.length}</span>
              <span className="stat-label">Total Shops</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-certificate"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{getShopsWithAllLicenses()}</span>
              <span className="stat-label">Fully Licensed</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{getShopsWithPartialLicenses()}</span>
              <span className="stat-label">Partial Licensed</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-times-circle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{getShopsWithoutLicenses()}</span>
              <span className="stat-label">No Licenses</span>
            </div>
          </div>
        </div>

        {/* Licensing Overview */}
        {shops.length > 0 && (
          <div className="licensing-overview">
            <div className="overview-header">
              <h3>Licensing Overview</h3>
              <p>Comprehensive licensing status and compliance analysis</p>
            </div>
            <div className="overview-content">
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-seedling"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Seed License</span>
                  <span className="overview-value">
                    {shops.filter(s => s.seedLicense).length} / {shops.length}
                  </span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Pesticide License</span>
                  <span className="overview-value">
                    {shops.filter(s => s.pesticideLicense).length} / {shops.length}
                  </span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-leaf"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Fertilizer License</span>
                  <span className="overview-value">
                    {shops.filter(s => s.fertiliserLicense).length} / {shops.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="form-modal-overlay">
          <div className="form-modal-content">
            <div className="form-modal-header">
              <h3>{editingShop ? 'Edit Input Shop' : 'Add New Input Shop'}</h3>
              <button 
                className="close-button" 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingShop(null);
                  setFormErrors({});
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={editingShop ? handleUpdateShop : handleCreateShop} className="input-shop-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="shopName" className="form-label">
                    Shop Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="shopName"
                    value={formData.shopName}
                    onChange={(e) => updateField('shopName', e.target.value)}
                    className={`form-input ${formErrors.shopName ? 'error' : ''}`}
                    placeholder="Enter shop name"
                  />
                  {formErrors.shopName && <span className="error-message">{formErrors.shopName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="seedLicense" className="form-label">
                    Seed License
                  </label>
                  <input
                    type="text"
                    id="seedLicense"
                    value={formData.seedLicense}
                    onChange={(e) => updateField('seedLicense', e.target.value)}
                    className="form-input"
                    placeholder="Enter seed license number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pesticideLicense" className="form-label">
                    Pesticide License
                  </label>
                  <input
                    type="text"
                    id="pesticideLicense"
                    value={formData.pesticideLicense}
                    onChange={(e) => updateField('pesticideLicense', e.target.value)}
                    className="form-input"
                    placeholder="Enter pesticide license number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fertiliserLicense" className="form-label">
                    Fertilizer License
                  </label>
                  <input
                    type="text"
                    id="fertiliserLicense"
                    value={formData.fertiliserLicense}
                    onChange={(e) => updateField('fertiliserLicense', e.target.value)}
                    className="form-input"
                    placeholder="Enter fertilizer license number"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingShop(null);
                    setFormErrors({});
                  }}
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  <i className="fas fa-store"></i>
                  {editingShop ? 'Update Shop' : 'Add Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FPOInputShopView;
