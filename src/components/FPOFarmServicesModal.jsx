import React, { useState, useEffect } from 'react';
import { fpoAPI } from '../api/apiService';
import '../styles/FPOModal.css';

const FPOFarmServicesModal = ({ isOpen, onClose, fpoId, fpoName }) => {
  const [farmServices, setFarmServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Form state for creating/editing farm services
  const [formData, setFormData] = useState({
    serviceType: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen && fpoId) {
      loadFarmServices();
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

  const loadFarmServices = async () => {
    try {
      setLoading(true);
      console.log('Loading farm services for FPO ID:', fpoId);
      const response = await fpoAPI.getFPOServices(fpoId);
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

  const handleCreateService = async (e) => {
    e.preventDefault();
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
      console.log('FPO ID:', fpoId);
      
      const response = await fpoAPI.createService(fpoId, serviceData);
      console.log('Farm service created successfully:', response);
      
      setShowCreateForm(false);
      setFormData({
        serviceType: '',
        description: ''
      });
      
      // Add a small delay to ensure backend processing
      setTimeout(() => {
        loadFarmServices();
      }, 500);
      
      alert('Farm service created successfully!');
    } catch (error) {
      console.error('Error creating farm service:', error);
      alert('Error creating farm service: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      serviceType: service.serviceType || '',
      description: service.description || ''
    });
    setShowCreateForm(true);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
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
      await fpoAPI.updateService(fpoId, editingService.id, serviceData);
      
      setShowCreateForm(false);
      setEditingService(null);
      setFormData({
        serviceType: '',
        description: ''
      });
      
      alert('Farm service updated successfully!');
      loadFarmServices();
    } catch (error) {
      console.error('Error updating farm service:', error);
      alert('Error updating farm service: ' + (error.response?.data?.message || error.message));
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
      const response = await fpoAPI.updateServiceStatus(fpoId, serviceId, newStatus);
      console.log('Status update response:', response);
      
      alert(`Farm service status updated to ${newStatus}!`);
      
      // Reload to ensure data consistency
      setTimeout(() => {
        loadFarmServices();
      }, 1000);
    } catch (error) {
      console.error('Error updating farm service status:', error);
      alert('Error updating farm service status: ' + (error.response?.data?.message || error.message));
      
      // Revert the local state on error
      setFarmServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, status: s.status } : s
      ));
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this farm service?')) {
      try {
        await fpoAPI.removeService(fpoId, serviceId);
        alert('Farm service deleted successfully!');
        loadFarmServices();
      } catch (error) {
        console.error('Error deleting farm service:', error);
        alert('Error deleting farm service: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const filteredServices = farmServices.filter(service => {
    const matchesSearch = service.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content farm-services-modal">
        <div className="modal-header">
          <h2>Farm Services List</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Action Bar */}
          <div className="action-bar">
            <div className="action-buttons">
              <button 
                className="create-button"
                onClick={() => {
                  setEditingService(null);
                  setFormData({ serviceType: '', description: '' });
                  setShowCreateForm(true);
                }}
              >
                + Create Farm Service
              </button>
            </div>
            
            <div className="refresh-container">
              <button 
                className="refresh-btn"
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  loadFarmServices();
                }}
                title="Refresh farm services list"
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

          {/* Farm Services Table */}
          <div className="table-container">
            <table className="farm-services-table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>FPO Service name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="loading-cell">Loading farm services...</td>
                  </tr>
                ) : filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data-cell">No data matching the filter</td>
                  </tr>
                ) : (
                  filteredServices.map((service, index) => {
                    console.log('Rendering service:', service);
                    return (
                    <tr key={service.id || index}>
                      <td>{service.id || `FS${index + 1}`}</td>
                      <td>{service.serviceType ? service.serviceType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : '-'}</td>
                      <td>{service.description || '-'}</td>
                      <td>
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
                      <td>
                        <div className="action-dropdown">
                          <button 
                            className="dropdown-toggle"
                            onClick={() => setActiveDropdown(activeDropdown === service.id ? null : service.id)}
                          >
                            ⋯
                          </button>
                          {activeDropdown === service.id && (
                            <div className={`dropdown-menu ${index >= 2 ? 'dropdown-menu-bottom' : 'dropdown-menu-top'}`}>
                              <button 
                                className="dropdown-item edit-item"
                                onClick={() => {
                                  handleEditService(service);
                                  setActiveDropdown(null);
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                className="dropdown-item delete-item"
                                onClick={() => {
                                  handleDeleteService(service.id);
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

      {/* Create/Edit Farm Service Form Modal */}
      {showCreateForm && (
        <div className="form-modal-overlay">
          <div className="form-modal-content">
            <div className="form-modal-header">
              <h3>{editingService ? 'Edit Farm Service' : 'Create Farm Service'}</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingService(null);
                  setFormData({ serviceType: '', description: '' });
                }}
              >
                ×
              </button>
            </div>
            <div className="form-modal-body">
              <form onSubmit={editingService ? handleUpdateService : handleCreateService}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Service Type *</label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                      required
                      className={!formData.serviceType ? 'required-field' : ''}
                    >
                      <option value="">Select Service Type</option>
                      <option value="SOIL_TEST">Soil Test</option>
                      <option value="WATER_TEST">Water Test</option>
                      <option value="MACHINERY_RENTAL">Machinery Rental</option>
                      <option value="SEED_SUPPLY">Seed Supply</option>
                      <option value="FERTILIZER_SUPPLY">Fertilizer Supply</option>
                      <option value="PESTICIDE_SUPPLY">Pesticide Supply</option>
                      <option value="TECHNICAL_SUPPORT">Technical Support</option>
                      <option value="MARKETING_SUPPORT">Marketing Support</option>
                      <option value="TRAINING">Training</option>
                      <option value="INSURANCE">Insurance</option>
                      <option value="CREDIT_FACILITY">Credit Facility</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      placeholder="Enter service description..."
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingService(null);
                      setFormData({ serviceType: '', description: '' });
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={`submit-btn ${!formData.serviceType ? 'disabled' : ''}`}
                    disabled={!formData.serviceType}
                  >
                    {editingService ? 'Update' : 'Create'}
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

export default FPOFarmServicesModal;
