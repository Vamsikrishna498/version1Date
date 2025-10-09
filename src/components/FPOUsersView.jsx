import React, { useState, useEffect } from 'react';
import { fpoUsersAPI } from '../api/apiService';
import PasswordInput from './PasswordInput';
import '../styles/FPOUsersView.css';

const FPOUsersView = ({ fpo, onClose, onToast, userRole = 'EMPLOYEE' }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // User types available for selection based on user role
  const getUserTypes = () => {
    const allUserTypes = [
      { value: 'ADMIN', label: 'Admin', icon: 'fas fa-user-shield', color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fecaca' },
      { value: 'EMPLOYEE', label: 'Employee', icon: 'fas fa-user-tie', color: '#2563eb', bgColor: '#eff6ff', borderColor: '#bfdbfe' },
      { value: 'FARMER', label: 'Farmer', icon: 'fas fa-seedling', color: '#059669', bgColor: '#ecfdf5', borderColor: '#a7f3d0' },
      { value: 'FPO', label: 'FPO', icon: 'fas fa-building', color: '#7c3aed', bgColor: '#faf5ff', borderColor: '#c4b5fd' }
    ];
    
    // For employees, only allow FPO-scoped roles
    if (userRole === 'EMPLOYEE') {
      return allUserTypes.filter(type => ['EMPLOYEE', 'FARMER', 'FPO'].includes(type.value));
    }
    
    // For admins and super admins, allow all roles
    return allUserTypes;
  };
  
  const USER_TYPES = getUserTypes();

  // Form state for creating/editing users
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    role: '',
    password: ''
  });

  useEffect(() => {
    console.log('🔄 FPOUsersView useEffect triggered');
    console.log('📋 FPO object:', fpo);
    console.log('📋 FPO ID:', fpo?.id);
    console.log('📋 FPO Name:', fpo?.fpoName);
    
    if (fpo?.id) {
      console.log('✅ FPO ID found, calling loadUsers()');
      loadUsers();
    } else {
      console.warn('⚠️ No FPO ID found, skipping loadUsers()');
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

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading users for FPO ID:', fpo.id);
      const response = await fpoUsersAPI.list(fpo.id);
      console.log('📋 Users response:', response);
      
      // Handle different response formats
      let userData = [];
      
      if (Array.isArray(response)) {
        // Response is already an array
        userData = response;
        console.log('📋 Response is array with', userData.length, 'items');
      } else if (response && Array.isArray(response.data)) {
        // Response has a data property that is an array
        userData = response.data;
        console.log('📋 Response.data is array with', userData.length, 'items');
      } else if (response && typeof response === 'object') {
        // Response is an object, try to extract array from common properties
        userData = response.content || response.users || response.result || [];
        console.log('📋 Extracted array from response object with', userData.length, 'items');
      } else {
        console.warn('⚠️ Unexpected response format:', typeof response, response);
        userData = [];
      }
      
      console.log('📋 Final users data:', userData);
      console.log('📋 Users data type:', typeof userData);
      console.log('📋 Is array:', Array.isArray(userData));
      
      if (Array.isArray(userData)) {
        console.log('✅ Setting users array with', userData.length, 'users');
        setUsers(userData);
      } else {
        console.warn('⚠️ Expected array but got:', typeof userData, userData);
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error headers:', error.response?.headers);
      
      // Show user-friendly error message
      if (error.response?.status === 403) {
        console.error('❌ Authentication/Authorization error - user may not have permission');
      } else if (error.response?.status === 404) {
        console.error('❌ FPO not found - check FPO ID');
      } else if (error.response?.status === 500) {
        console.error('❌ Server error - check backend logs');
      }
      
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // First Name validation - only alphabets, 2-50 characters
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (!/^[A-Za-z]{2,50}$/.test(formData.firstName.trim())) {
      errors.firstName = 'First name must contain only alphabets (2-50 characters)';
    }
    
    // Last Name validation - only alphabets, 2-50 characters
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (!/^[A-Za-z]{2,50}$/.test(formData.lastName.trim())) {
      errors.lastName = 'Last name must contain only alphabets (2-50 characters)';
    }
    
    // Email validation - proper email format
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Phone number validation - exactly 10 digits
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phoneNumber.trim())) {
      errors.phoneNumber = 'Phone number must be exactly 10 digits';
    }
    
    if (!formData.role) {
      errors.role = 'User type is required';
    }
    
    // When opened from Employee Dashboard, restrict disallowed roles explicitly
    if (userRole === 'EMPLOYEE') {
      const allowedRolesForEmployee = ['EMPLOYEE', 'FARMER', 'FPO'];
      if (formData.role && !allowedRolesForEmployee.includes(formData.role)) {
        // Surface a clear toast and block submit
        onToast && onToast('error', 'Only FPO, EMPLOYEE or FARMER user types can be created from this screen');
        errors.role = errors.role || 'Invalid user type for this screen';
      }
    }
    
    // Password validation - minimum 8 characters with complexity
    // For editing users, password is optional (only validate if provided)
    if (formData.password.trim()) {
      if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(formData.password)) {
        errors.password = 'Password must contain uppercase, lowercase, and number';
      }
    } else if (!editingUser) {
      // Password is required only when creating new users
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      console.log('🔄 Creating user with data:', formData);
      
      // Use appropriate API method based on user role
      if (userRole === 'EMPLOYEE') {
        console.log('📝 Using employee-specific endpoint');
        await fpoUsersAPI.createEmployee(fpo.id, formData);
      } else {
        console.log('📝 Using regular admin endpoint');
        // For admins and super admins, use the regular create method
        await fpoUsersAPI.create(fpo.id, formData);
      }
      
      console.log('✅ User created successfully');
      
      setShowCreateForm(false);
      setFormData({
        email: '',
        phoneNumber: '',
        firstName: '',
        lastName: '',
        role: '',
        password: ''
      });
      setFormErrors({});
      
      // Add a small delay to ensure backend processing
      setTimeout(() => {
        console.log('🔄 Reloading users after creation...');
        loadUsers();
      }, 500);
      
      onToast && onToast('success', 'User created successfully!');
    } catch (error) {
      console.error('❌ Error creating user:', error);
      console.error('❌ Error response:', error.response?.data);
      let errorMessage = 'Failed to create user. Please try again.';
      
      if (error.response?.data?.message) {
        // Use the backend message if available
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      onToast && onToast('error', errorMessage);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || '',
      password: ''
    });
    setFormErrors({});
    setShowCreateForm(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      console.log('🔄 Updating user:', editingUser.id, 'with data:', formData);
      const result = await fpoUsersAPI.update(fpo.id, editingUser.id, formData);
      console.log('✅ User update result:', result);
      
      setShowCreateForm(false);
      setEditingUser(null);
      setFormData({
        email: '',
        phoneNumber: '',
        firstName: '',
        lastName: '',
        role: '',
        password: ''
      });
      setFormErrors({});
      
      onToast && onToast('success', 'User updated successfully!');
      await loadUsers(); // Reload users after update
    } catch (error) {
      console.error('❌ Error updating user:', error);
      console.error('❌ Error response:', error.response?.data);
      onToast && onToast('error', 'Error updating user: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleActive = async (user) => {
    try {
      console.log('🔄 Toggling user status for:', user.id, 'from', user.status);
      
      // Optimistic update
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: (u.status === 'APPROVED' ? 'REJECTED' : 'APPROVED') } : u
      ));
      
      await fpoUsersAPI.toggleActive(fpo.id, user.id, !(user.status === 'APPROVED'));
      console.log('✅ User status toggled successfully');
    } catch (error) {
      console.error('❌ Error toggling user status:', error);
      console.error('❌ Error response:', error.response?.data);
      onToast && onToast('error', 'Error updating status: ' + (error.response?.data?.message || error.message));
      // Revert optimistic update
      await loadUsers();
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword.trim()) {
      onToast && onToast('warning', 'Password is required');
      return;
    }
    
    try {
      await fpoUsersAPI.updatePassword(fpo.id, passwordUser.id, newPassword);
      setShowPasswordModal(false);
      setNewPassword('');
      onToast && onToast('success', 'Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      onToast && onToast('error', 'Error updating password: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const filteredUsers = users.filter(user =>
    ((user.firstName || '') + ' ' + (user.lastName || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.phoneNumber || '').includes(searchTerm) ||
    (user.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserIcon = (role) => {
    const userType = USER_TYPES.find(type => type.value === role);
    return userType ? userType.icon : 'fas fa-user';
  };

  const getUserColor = (role) => {
    const userType = USER_TYPES.find(type => type.value === role);
    return userType ? userType.color : '#6b7280';
  };

  const getUserBgColor = (role) => {
    const userType = USER_TYPES.find(type => type.value === role);
    return userType ? userType.bgColor : '#f3f4f6';
  };

  const getUserBorderColor = (role) => {
    const userType = USER_TYPES.find(type => type.value === role);
    return userType ? userType.borderColor : '#d1d5db';
  };

  const getTotalUsers = () => {
    return users.length;
  };

  const getActiveUsers = () => {
    return users.filter(user => user.status === 'APPROVED').length;
  };

  const getInactiveUsers = () => {
    return users.filter(user => user.status === 'REJECTED').length;
  };

  const getUserStats = () => {
    const stats = {
      byRole: {},
      byStatus: { active: 0, inactive: 0 }
    };

    users.forEach(user => {
      const role = user.role || 'Unknown';
      const status = user.status === 'APPROVED' ? 'active' : 'inactive';
      
      stats.byRole[role] = (stats.byRole[role] || 0) + 1;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });

    return stats;
  };

  const getRecentUsers = () => {
    return [...users]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };

  // Full-page form view (like Turnover form) when creating/editing or updating password
  if (showCreateForm || showPasswordModal) {
    return (
      <div className="fpo-user-form">
        <div className="form-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="form-title">
                {showPasswordModal ? 'Update Password' : (editingUser ? 'Edit User' : 'Add New User')}
              </h1>
              <p className="form-subtitle">
                {showPasswordModal 
                  ? `Update password for ${passwordUser?.firstName || ''} ${passwordUser?.lastName || ''}`.trim()
                  : (editingUser ? 'Update user details' : 'Add a new user for ' + (fpo?.fpoName || 'FPO'))
                }
              </p>
            </div>
            <div className="header-right">
              <button
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setShowPasswordModal(false);
                  setEditingUser(null);
                  setPasswordUser(null);
                  setNewPassword('');
                  setFormErrors({});
                }}
                title="Close"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="form-content">
          {showPasswordModal ? (
            // Password Update Form
            <form onSubmit={handleUpdatePassword} className="user-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">User Name</label>
                  <input
                    type="text"
                    value={`${passwordUser?.firstName || ''} ${passwordUser?.lastName || ''}`.trim()}
                    className="form-input"
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={passwordUser?.email || ''}
                    className="form-input"
                    disabled
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">New Password <span className="required">*</span></label>
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    placeholder="Enter new password (min 8 chars with uppercase, lowercase, number)"
                    maxLength={50}
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordUser(null);
                    setNewPassword('');
                  }}
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-key"></i>
                  Update Password
                </button>
              </div>
            </form>
          ) : (
            // User Create/Edit Form
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="user-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">First Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z]/g, '');
                    if (value.length <= 50) {
                      updateField('firstName', value);
                    }
                  }}
                  className={`form-input ${formErrors.firstName ? 'error' : ''}`}
                  placeholder="Enter first name (alphabets only)"
                  maxLength={50}
                  onFocus={() => setFocusedField('firstName')}
                  onBlur={() => setFocusedField('')}
                />
                {focusedField === 'firstName' && !formData.firstName && (
                  <div className="field-hint">
                    <i className="fas fa-info-circle"></i>
                    Enter first name using only alphabets (2-50 characters)
                  </div>
                )}
                {formErrors.firstName && <span className="error-message">{formErrors.firstName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Last Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z]/g, '');
                    if (value.length <= 50) {
                      updateField('lastName', value);
                    }
                  }}
                  className={`form-input ${formErrors.lastName ? 'error' : ''}`}
                  placeholder="Enter last name (alphabets only)"
                  maxLength={50}
                  onFocus={() => setFocusedField('lastName')}
                  onBlur={() => setFocusedField('')}
                />
                {focusedField === 'lastName' && !formData.lastName && (
                  <div className="field-hint">
                    <i className="fas fa-info-circle"></i>
                    Enter last name using only alphabets (2-50 characters)
                  </div>
                )}
                {formErrors.lastName && <span className="error-message">{formErrors.lastName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Email <span className="required">*</span></label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z0-9@._-]/g, '');
                    updateField('email', value);
                  }}
                  className={`form-input ${formErrors.email ? 'error' : ''}`}
                  placeholder="Enter email address"
                  maxLength={100}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                />
                {focusedField === 'email' && !formData.email && (
                  <div className="field-hint">
                    <i className="fas fa-info-circle"></i>
                    Enter a valid email address (example: user@domain.com)
                  </div>
                )}
                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number <span className="required">*</span></label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 10) {
                      updateField('phoneNumber', value);
                    }
                  }}
                  className={`form-input ${formErrors.phoneNumber ? 'error' : ''}`}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  onFocus={() => setFocusedField('phoneNumber')}
                  onBlur={() => setFocusedField('')}
                />
                {focusedField === 'phoneNumber' && !formData.phoneNumber && (
                  <div className="field-hint">
                    <i className="fas fa-info-circle"></i>
                    Enter exactly 10 digits (numbers only, no spaces or special characters)
                  </div>
                )}
                {formErrors.phoneNumber && <span className="error-message">{formErrors.phoneNumber}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">User Type <span className="required">*</span></label>
                <select
                  value={formData.role}
                  onChange={(e) => updateField('role', e.target.value)}
                  className={`form-select ${formErrors.role ? 'error' : ''}`}
                >
                  <option value="">Select User Type</option>
                  {USER_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {formErrors.role && <span className="error-message">{formErrors.role}</span>}
              </div>
              {!editingUser && (
                <div className="form-group full-width">
                  <label className="form-label">Password <span className="required">*</span></label>
                  <PasswordInput
                    value={formData.password}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z0-9@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/g, '');
                      updateField('password', value);
                    }}
                    className={`form-input ${formErrors.password ? 'error' : ''}`}
                    placeholder="Enter password (min 8 chars with uppercase, lowercase, number)"
                    maxLength={50}
                    error={!!formErrors.password}
                  />
                  {formErrors.password && <span className="error-message">{formErrors.password}</span>}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingUser(null);
                  setFormErrors({});
                }}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-user-plus"></i>
                {editingUser ? 'Update User' : 'Add User'}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    );
  }


  const stats = getUserStats();
  const recentUsers = getRecentUsers();

  return (
    <div className="fpo-users-view">
      {/* Header Section */}
      <div className="users-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="users-title">FPO Users Management</h1>
            <p className="users-subtitle">Manage users and access control for {fpo?.fpoName || 'FPO'}</p>
          </div>
          <div className="header-right">
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="users-content">
        {/* Action Bar */}
        <div className="action-bar">
          <div className="action-buttons">
            <button 
              className="create-user-btn"
              onClick={() => {
                setShowCreateForm(true);
                setEditingUser(null);
                setFormData({
                  email: '',
                  phoneNumber: '',
                  firstName: '',
                  lastName: '',
                  role: '',
                  password: ''
                });
                setFormErrors({});
              }}
            >
              <i className="fas fa-user-plus"></i>
              Add User
            </button>
          </div>
          
          <div className="refresh-container">
            <button 
              className="refresh-btn"
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                loadUsers();
              }}
              title="Refresh users list"
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
                placeholder="Search users..."
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

        {/* Users Table */}
        <div className="users-table-container">
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>User Type</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="loading-cell">
                      <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data-cell">
                      <div className="no-data-message">
                        <i className="fas fa-users"></i>
                        <p>No users found</p>
                        <span>Try adjusting your search criteria or add a new user</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => {
                    const userColor = getUserColor(user.role);
                    const userBgColor = getUserBgColor(user.role);
                    const userBorderColor = getUserBorderColor(user.role);
                    const userIcon = getUserIcon(user.role);
                    
                    
                    return (
                      <tr key={user.id || index} className="user-row">
                        <td className="user-id">{user.id || `U${index + 1}`}</td>
                        <td className="user-name">
                          <div className="name-display">
                            <i className="fas fa-user-circle"></i>
                            <span className="name-text">{`${user.firstName || ''} ${user.lastName || ''}`}</span>
                          </div>
                        </td>
                        <td className="user-type">
                          <span 
                            className="type-badge"
                            style={{ 
                              backgroundColor: 'transparent',
                              color: userColor,
                              border: `1px solid ${userColor}`,
                              boxShadow: 'none',
                              fontSize: '12px',
                              fontWeight: '600',
                              padding: '6px 12px'
                            }}
                          >
                            <i className={userIcon}></i>
                            {user.role || '-'}
                          </span>
                        </td>
                        <td className="user-email">
                          <div className="email-display">
                            <i className="fas fa-envelope"></i>
                            <span className="email-text">{user.email || '-'}</span>
                          </div>
                        </td>
                        <td className="user-phone">
                          <div className="phone-display">
                            <i className="fas fa-phone"></i>
                            <span className="phone-text">{user.phoneNumber || '-'}</span>
                          </div>
                        </td>
                        <td className="join-date">
                          <div className="date-display">
                            <i className="fas fa-calendar"></i>
                            <span className="date-text">{formatDate(user.createdAt)}</span>
                          </div>
                        </td>
                        <td className="user-status">
                          <label className="status-toggle">
                            <input 
                              type="checkbox" 
                              checked={user.status === 'APPROVED'} 
                              onChange={() => handleToggleActive(user)}
                            />
                            <span className="status-slider"></span>
                            <span className="status-text">
                              {user.status === 'APPROVED' ? 'Active' : 'Inactive'}
                            </span>
                          </label>
                        </td>
                        <td className="user-actions">
                          <div className="action-dropdown">
                            <button 
                              className="dropdown-toggle"
                              onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                            >
                              <i className="fas fa-ellipsis-v"></i>
                            </button>
                            {activeDropdown === user.id && (
                              <div className={`dropdown-menu ${index >= 2 ? 'dropdown-menu-bottom' : 'dropdown-menu-top'}`}>
                                <button 
                                  className="dropdown-item-enhanced edit-item"
                                  style={{
                                    background: 'white',
                                    color: '#3b82f6',
                                    fontWeight: '500',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    margin: '2px 8px',
                                    padding: '10px 16px',
                                    width: 'calc(100% - 16px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '14px',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = '#f8fafc';
                                    e.target.style.borderColor = '#3b82f6';
                                    e.target.style.color = '#1d4ed8';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = 'white';
                                    e.target.style.borderColor = '#e5e7eb';
                                    e.target.style.color = '#3b82f6';
                                  }}
                                  onClick={() => {
                                    handleEditUser(user);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  <i className="fas fa-edit" style={{ fontSize: '12px' }}></i>
                                  Edit
                                </button>
                                <button 
                                  className="dropdown-item-enhanced password-item"
                                  style={{
                                    background: 'white',
                                    color: '#059669',
                                    fontWeight: '500',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    margin: '2px 8px',
                                    padding: '10px 16px',
                                    width: 'calc(100% - 16px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '14px',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = '#f0fdf4';
                                    e.target.style.borderColor = '#059669';
                                    e.target.style.color = '#047857';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = 'white';
                                    e.target.style.borderColor = '#e5e7eb';
                                    e.target.style.color = '#059669';
                                  }}
                                  onClick={() => {
                                    setPasswordUser(user);
                                    setNewPassword('');
                                    setShowPasswordModal(true);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  <i className="fas fa-key" style={{ fontSize: '12px' }}></i>
                                  Change Password
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
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{getTotalUsers()}</span>
              <span className="stat-label">Total Users</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-user-check"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{getActiveUsers()}</span>
              <span className="stat-label">Active Users</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-user-times"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{getInactiveUsers()}</span>
              <span className="stat-label">Inactive Users</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-user-shield"></i>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.byRole.ADMIN || 0}</span>
              <span className="stat-label">Admins</span>
            </div>
          </div>
        </div>

        {/* Users Overview */}
        {users.length > 0 && (
          <div className="users-overview">
            <div className="overview-header">
              <h3>Users Analytics</h3>
              <p>Overview of user distribution and activity</p>
            </div>
            <div className="overview-content">
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-chart-pie"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">User Distribution</span>
                  <span className="overview-value">
                    {Object.keys(stats.byRole).length} Types
                  </span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-user-plus"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Recent Users</span>
                  <span className="overview-value">
                    {recentUsers.length} Added
                  </span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-icon">
                  <i className="fas fa-percentage"></i>
                </div>
                <div className="overview-info">
                  <span className="overview-title">Active Rate</span>
                  <span className="overview-value">
                    {getTotalUsers() > 0 ? Math.round((getActiveUsers() / getTotalUsers()) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal - DISABLED: Now using full-width form */}
      {false && showCreateForm && (
        <div className="form-modal-overlay">
          <div className="form-modal-content">
            <div className="form-modal-header">
              <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingUser(null);
                  setFormErrors({});
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="user-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">
                    First Name <span className="required">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z]/g, '');
                      if (value.length <= 50) {
                        updateField('firstName', value);
                      }
                    }}
                    className={`form-input ${formErrors.firstName ? 'error' : ''}`}
                    placeholder="Enter first name (alphabets only)"
                    maxLength={50}
                  />
                  {formErrors.firstName && <span className="error-message">{formErrors.firstName}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">
                    Last Name <span className="required">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z]/g, '');
                      if (value.length <= 50) {
                        updateField('lastName', value);
                      }
                    }}
                    className={`form-input ${formErrors.lastName ? 'error' : ''}`}
                    placeholder="Enter last name (alphabets only)"
                    maxLength={50}
                  />
                  {formErrors.lastName && <span className="error-message">{formErrors.lastName}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email <span className="required">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z0-9@._-]/g, '');
                      updateField('email', value);
                    }}
                    className={`form-input ${formErrors.email ? 'error' : ''}`}
                    placeholder="Enter email address"
                    maxLength={100}
                  />
                  {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="phoneNumber" className="form-label">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value.length <= 10) {
                        updateField('phoneNumber', value);
                      }
                    }}
                    className={`form-input ${formErrors.phoneNumber ? 'error' : ''}`}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                  />
                  {formErrors.phoneNumber && <span className="error-message">{formErrors.phoneNumber}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="role" className="form-label">
                    User Type <span className="required">*</span>
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => updateField('role', e.target.value)}
                    className={`form-select ${formErrors.role ? 'error' : ''}`}
                  >
                    <option value="">Select User Type</option>
                    {USER_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.role && <span className="error-message">{formErrors.role}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password {!editingUser && <span className="required">*</span>}
                  </label>
                  <PasswordInput
                    id="password"
                    value={formData.password}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^A-Za-z0-9@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/g, '');
                      updateField('password', value);
                    }}
                    className={`form-input ${formErrors.password ? 'error' : ''}`}
                    placeholder={editingUser ? "Enter new password (optional, min 8 chars with uppercase, lowercase, number)" : "Enter password (min 8 chars with uppercase, lowercase, number)"}
                    maxLength={50}
                    error={!!formErrors.password}
                  />
                  {formErrors.password && <span className="error-message">{formErrors.password}</span>}
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingUser(null);
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
                  <i className="fas fa-user-plus"></i>
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Update Modal - DISABLED: Now using full-width form */}
      {false && showPasswordModal && (
        <div className="form-modal-overlay">
          <div className="form-modal-content">
            <div className="form-modal-header">
              <h3>Update Password</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordUser(null);
                  setNewPassword('');
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleUpdatePassword} className="password-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">User Name</label>
                  <input 
                    value={`${passwordUser?.firstName || ''} ${passwordUser?.lastName || ''}`} 
                    disabled 
                    className="form-input disabled"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    value={passwordUser?.email || ''} 
                    disabled 
                    className="form-input disabled"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label htmlFor="newPassword" className="form-label">
                    New Password <span className="required">*</span>
                  </label>
                  <PasswordInput
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    placeholder="Enter new password"
                    required
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordUser(null);
                    setNewPassword('');
                  }}
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  <i className="fas fa-key"></i>
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FPOUsersView;
