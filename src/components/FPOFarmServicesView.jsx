import React, { useState, useEffect } from 'react';
import { fpoAPI } from '../api/apiService';
import '../styles/FPOFarmServicesView.css';

const FPOFarmServicesView = ({ fpo, onClose, onToast }) => {
  const [farmServices, setFarmServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Form state for creating/editing farm services
  const [formData, setFormData] = useState({
    serviceType: '',
    description: ''
  });

  useEffect(() => {
    if (fpo?.id) {
      loadFarmServices();
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

  const loadFarmServices = async () => {
    try {
      setLoading(true);
      console.log('Loading farm services for FPO ID:', fpo.id);
      const response = await fpoAPI.getFPOServices(fpo.id);
      console.log('Farm services response:', response);
      
      // Handle different response formats
      const services = response.data || response || [];
      console.log('Farm services data:', services);
      setFarmServices(Array.isArray(services) ? services : []);
    } catch (error) {
      console.error('Error loading farm services:', error);
      setFarmServices([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.serviceType.trim()) {
      errors.serviceType = 'Service type is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Map frontend form data to backend DTO format
      const serviceData = {
        serviceType: formData.serviceType,
        description: formData.description || 'No description provided',
        scheduledAt: null,
        serviceProvider: null,
        serviceProviderContact: null,
        serviceCost: null,
        paymentStatus: null,
        remarks: null
      };
      
      console.log('Creating farm service with data:', serviceData);
      const response = await fpoAPI.createService(fpo.id, serviceData);
      console.log('Farm service created successfully:', response);
      
      setShowCreateForm(false);
      setFormData({
        serviceType: '',
        description: ''
      });
      setFormErrors({});
      
      // Add a small delay to ensure backend processing
      setTimeout(() => {
        loadFarmServices();
      }, 500);
      
      onToast && onToast('success', 'Farm service created successfully!');
    } catch (error) {
      console.error('Error creating farm service:', error);
      onToast && onToast('error', 'Error creating farm service: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      serviceType: service.serviceType || '',
      description: service.description || ''
    });
    setFormErrors({});
    setShowCreateForm(true);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const serviceData = {
        serviceType: formData.serviceType,
        description: formData.description || 'No description provided',
        scheduledAt: null,
        serviceProvider: null,
        serviceProviderContact: null,
        serviceCost: null,
        paymentStatus: null,
        remarks: null
      };
      
      console.log('Updating farm service:', editingService.id, 'with data:', serviceData);
      await fpoAPI.updateService(fpo.id, editingService.id, serviceData);
      
      setShowCreateForm(false);
      setEditingService(null);
      setFormData({
        serviceType: '',
        description: ''
      });
      setFormErrors({});
      
      onToast && onToast('success', 'Farm service updated successfully!');
      loadFarmServices();
    } catch (error) {
      console.error('Error updating farm service:', error);
      onToast && onToast('error', 'Error updating farm service: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStatusUpdate = async (serviceId, newStatus) => {
    try {
      console.log('Updating farm service status:', serviceId, 'to', newStatus);
      
      // Update the local state immediately for better UX
      setFarmServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, status: newStatus } : s
      ));
      
      // Use the dedicated status update API endpoint
      const response = await fpoAPI.updateServiceStatus(fpo.id, serviceId, newStatus);
      console.log('Status update response:', response);
      
      onToast && onToast('success', `Farm service status updated to ${newStatus}!`);
      
      // Reload to ensure data consistency
      setTimeout(() => {
        loadFarmServices();
      }, 1000);
    } catch (error) {
      console.error('Error updating farm service status:', error);
      onToast && onToast('error', 'Error updating farm service status: ' + (error.response?.data?.message || error.message));
      
      // Revert the local state on error
      setFarmServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, status: s.status } : s
      ));
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this farm service?')) {
      try {
        await fpoAPI.removeService(fpo.id, serviceId);
        onToast && onToast('success', 'Farm service deleted successfully!');
        loadFarmServices();
      } catch (error) {
        console.error('Error deleting farm service:', error);
        onToast && onToast('error', 'Error deleting farm service: ' + (error.response?.data?.message || error.message));
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

  const filteredServices = farmServices.filter(service => {
    const matchesSearch = service.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const serviceTypeOptions = [
    { value: 'SOIL_TEST', label: 'Soil Test' },
    { value: 'WATER_TEST', label: 'Water Test' },
    { value: 'MACHINERY_RENTAL', label: 'Machinery Rental' },
    { value: 'SEED_SUPPLY', label: 'Seed Supply' },
    { value: 'FERTILIZER_SUPPLY', label: 'Fertilizer Supply' },
    { value: 'PESTICIDE_SUPPLY', label: 'Pesticide Supply' },
    { value: 'TECHNICAL_SUPPORT', label: 'Technical Support' },
    { value: 'MARKETING_SUPPORT', label: 'Marketing Support' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'INSURANCE', label: 'Insurance' },
    { value: 'CREDIT_FACILITY', label: 'Credit Facility' },
    { value: 'OTHER', label: 'Other' }
  ];

  // If showing create/edit form, render the form in full width
  if (showCreateForm) {
    return (
      <div className="fpo-farm-service-form">
        {/* Header */}
        <div className="form-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="form-title">
                {editingService ? 'Edit Farm Service' : 'Add New Farm Service'}
              </h1>
              <p className="form-subtitle">
                {editingService ? 'Update farm service information' : 'Add a new farm service for ' + (fpo?.fpoName || 'FPO')}
              </p>
            </div>
            <div className="header-right">
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingService(null);
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
          <form onSubmit={editingService ? handleUpdateService : handleCreateService} className="farm-service-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="serviceType" className="form-label">
                  Service Type <span className="required">*</span>
                </label>
                <select
                  id="serviceType"
                  value={formData.serviceType}
                  onChange={(e) => updateField('serviceType', e.target.value)}
                  className={`form-select ${formErrors.serviceType ? 'error' : ''}`}
                >
                  <option value="">Select Service Type</option>
                  {serviceTypeOptions.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {formErrors.serviceType && <span className="error-message">{formErrors.serviceType}</span>}
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="form-textarea"
                  placeholder="Enter detailed description of the farm service..."
                  rows={4}
                />
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
                  setEditingService(null);
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
                {editingService ? 'Update Service' : 'Add Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fpo-farm-services-view">
      {/* Header Section */}
      <div className="farm-services-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="farm-services-title">Farm Services Management</h1>
            <p className="farm-services-subtitle">Manage farm services for {fpo?.fpoName || 'FPO'}</p>
          </div>
          <div className="header-right">
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="farm-services-content">
        {/* Action Bar */}
        <div className="action-bar">
          <button 
            className="create-service-btn"
            onClick={() => {
              setShowCreateForm(true);
              setEditingService(null);
              setFormData({
                serviceType: '',
                description: ''
              });
              setFormErrors({});
            }}
          >
            <i className="fas fa-plus"></i>
            Add Farm Service
          </button>

          {/* Filter Section */}
          <div className="filter-section">
            <div className="search-container">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Search farm services..."
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

        {/* Services Table */}
        <div className="services-table-container">
          <div className="table-wrapper">
            <table className="farm-services-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Service Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="loading-cell">
                      <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        Loading farm services...
                      </div>
                    </td>
                  </tr>
                ) : filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data-cell">
                      <div className="no-data-message">
                        <i className="fas fa-tractor"></i>
                        <p>No farm services found</p>
                        <span>Try adjusting your search criteria or add a new farm service</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service, index) => (
                    <tr key={service.id || index} className="service-row">
                      <td className="service-id">{service.id || `FS${index + 1}`}</td>
                      <td className="service-name">
                        {service.serviceType ? 
                          serviceTypeOptions.find(opt => opt.value === service.serviceType)?.label || 
                          service.serviceType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) 
                          : '-'}
                      </td>
                      <td className="service-description">
                        {service.description ? 
                          (service.description.length > 100 ? 
                            service.description.substring(0, 100) + '...' : 
                            service.description) 
                          : '-'}
                      </td>
                      <td className="service-status">
                        <div className="status-toggle-container">
                          <label className="status-toggle">
                            <input
                              type="checkbox"
                              checked={service.status === 'APPROVED' || service.status === 'IN_PROGRESS' || service.status === 'COMPLETED'}
                              onChange={(e) => {
                                const newStatus = e.target.checked ? 'APPROVED' : 'REQUESTED';
                                handleStatusUpdate(service.id, newStatus);
                              }}
                            />
                            <span className="status-slider">
                              <span className="status-text">
                                {service.status === 'APPROVED' || service.status === 'IN_PROGRESS' || service.status === 'COMPLETED' ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </span>
                          </label>
                        </div>
                      </td>
                      <td className="service-actions">
                        <div className="action-dropdown">
                          <button 
                            className="dropdown-toggle"
                            onClick={() => setActiveDropdown(activeDropdown === service.id ? null : service.id)}
                          >
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                          {activeDropdown === service.id && (
                            <div className={`dropdown-menu ${index >= 2 ? 'dropdown-menu-bottom' : 'dropdown-menu-top'}`}>
                              <button 
                                className="dropdown-item-enhanced edit-item"
                                onClick={() => {
                                  handleEditService(service);
                                  setActiveDropdown(null);
                                }}
                              >
                                <i className="fas fa-edit"></i>
                                Edit
                              </button>
                              <button 
                                className="dropdown-item-enhanced delete-item"
                                onClick={() => {
                                  handleDeleteService(service.id);
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
              <i className="fas fa-tractor"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{farmServices.length}</span>
              <span className="stat-label">Total Services</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">
                {farmServices.filter(s => s.status === 'APPROVED' || s.status === 'IN_PROGRESS' || s.status === 'COMPLETED').length}
              </span>
              <span className="stat-label">Active Services</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">
                {farmServices.filter(s => s.status === 'REQUESTED' || s.status === 'PENDING').length}
              </span>
              <span className="stat-label">Pending Services</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-times-circle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">
                {farmServices.filter(s => s.status === 'REJECTED' || s.status === 'CANCELLED').length}
              </span>
              <span className="stat-label">Rejected Services</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default FPOFarmServicesView;
