import React, { useState, useEffect } from 'react';
import { configAPI, rbacAPI, superAdminAPI } from '../../api/apiService';
import { useNavigate } from 'react-router-dom';
import EmployeeRegistrationForm from '../EmployeeRegistrationForm';
import './config.css';

const UserRolesTab = () => {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState('roles');
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const [formData, setFormData] = useState({
    roleName: '',
    description: '',
    allowedModules: [],
    permissions: [],
    isActive: true
  });

  // Limit to modules shown in the screenshot
  const availableModules = ['EMPLOYEE', 'FARMER'];
  const availablePermissions = ['ADD', 'VIEW', 'EDIT', 'DELETE'];

  useEffect(() => {
    loadRoles();
    loadUsers();
  }, []);

  useEffect(() => {
    if (roles && Array.isArray(roles)) {
      const filtered = roles.filter(role =>
        role.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRoles(filtered);
    } else {
      setFilteredRoles([]);
    }
  }, [roles, searchTerm]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Loading roles...');
      const response = await rbacAPI.getAllRoles();
      console.log('📋 Roles response:', response);
      const rolesData = response?.data || response || [];
      console.log('📋 Roles data:', rolesData);
      setRoles(rolesData);
    } catch (error) {
      console.error('❌ Failed to load roles:', error);
      setError('Failed to load user roles: ' + error.message);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Use super admin API to get all users
      const response = await superAdminAPI.getAllUsers();
      setUsers(response || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingRole) {
        await rbacAPI.updateRole(editingRole.id, formData);
      } else {
        await rbacAPI.createRole(formData);
      }
      
      setShowModal(false);
      setEditingRole(null);
      resetForm();
      loadRoles();
    } catch (error) {
      setError('Failed to save user role: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      roleName: role.roleName,
      description: role.description,
      allowedModules: role.allowedModules || [],
      permissions: role.permissions || [],
      isActive: role.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        setLoading(true);
        await rbacAPI.deleteRole(roleId);
        loadRoles();
      } catch (error) {
        setError('Failed to delete user role: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      roleName: '',
      description: '',
      allowedModules: [],
      permissions: [],
      isActive: true
    });
  };

  const handleModuleChange = (module) => {
    const updatedModules = formData.allowedModules.includes(module)
      ? formData.allowedModules.filter(m => m !== module)
      : [...formData.allowedModules, module];
    setFormData({ ...formData, allowedModules: updatedModules });
  };

  const handlePermissionChange = (permission) => {
    const updatedPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission];
    setFormData({ ...formData, permissions: updatedPermissions });
  };

  const handleModuleSelectChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
    setFormData({ ...formData, allowedModules: selected });
  };

  const handlePermissionSelectChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
    setFormData({ ...formData, permissions: selected });
  };

  const handleRoleRadioChange = (value) => {
    setFormData({ ...formData, roleName: value });
  };

  const handleAssignRole = async (assignmentData) => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      setSuccessMessage(''); // Clear any previous success messages
      
      const result = await rbacAPI.assignRoleToUser(assignmentData);
      
      // Find the user and role names for the success message
      const user = users.find(u => u.id.toString() === assignmentData.userId);
      const role = roles.find(r => r.id.toString() === assignmentData.roleId);
      
      const userDisplayName = user ? (user.name || user.email || 'User') : 'User';
      const roleDisplayName = role ? role.roleName : 'Role';
      
      setSuccessMessage(`✅ Role "${roleDisplayName}" has been successfully assigned to "${userDisplayName}"!`);
      
      setShowAssignModal(false);
      await loadUsers(); // Refresh users to show updated roles
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (error) {
      setError('Failed to assign role: ' + error.message);
      setSuccessMessage(''); // Clear success message on error
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (roleName) => {
    const colors = {
      'SUPER_ADMIN': 'bg-red-100 text-red-800',
      'ADMIN': 'bg-purple-100 text-purple-800',
      'MANAGER': 'bg-blue-100 text-blue-800',
      'EMPLOYEE': 'bg-green-100 text-green-800',
      'FARMER': 'bg-yellow-100 text-yellow-800'
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800';
  };

  const getUserStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="config-tab">
      <div className="tab-header">
        <h2>👥 Users & Roles Management</h2>
        <div className="sub-tabs">
          <button
            className={`sub-tab-button ${activeSubTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('roles')}
          >
            🛡️ Role
          </button>
          <button
            className={`sub-tab-button ${activeSubTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('assignments')}
          >
            👤 User
          </button>
        </div>
      </div>

      {/* Success and Error Messages */}
      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="close-success">×</button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      {activeSubTab === 'roles' && (
        <>
          <div className="header-actions">
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setEditingRole(null);
                setShowModal(true);
              }}
            >
              ➕ Add New Role
            </button>
          </div>

      <div className="roles-grid">
        {filteredRoles.map((role) => (
          <div key={role.id} className="role-card">
            <div className="role-header">
              <h3>{role.roleName}</h3>
              <div className="role-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleEdit(role)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(role.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
            
            <p className="role-description">{role.description}</p>
            
            <div className="role-modules">
              <strong>Allowed Modules:</strong>
              <div className="module-tags">
                {role.allowedModules?.map(module => (
                  <span key={module} className="module-tag">{module}</span>
                ))}
              </div>
            </div>
            
            <div className="role-permissions">
              <strong>Permissions:</strong>
              <div className="permission-tags">
                {role.permissions?.map(permission => (
                  <span key={permission} className="permission-tag">{permission}</span>
                ))}
              </div>
            </div>
            
            <div className="role-status">
              <span className={`status-badge ${role.isActive ? 'active' : 'inactive'}`}>
                {role.isActive ? '✅ Active' : '❌ Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
        </>
      )}

      {activeSubTab === 'assignments' && (
        <>
          {/* User Assignment Form */}
          <div className="assignment-form">
            <h4 className="form-title">User</h4>
            <div className="form-row">
              <div className="form-group">
                <label>User Details *</label>
                <div className="radio-group">
                  <label className="checkbox-label">
                    <input
                      type="radio"
                      name="userSelectMode"
                      checked={!showEmployeeForm}
                      onChange={() => { setShowEmployeeForm(false); }}
                    />
                    Select from list
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="radio"
                      name="userSelectMode"
                      checked={showEmployeeForm}
                      onChange={() => { setShowEmployeeForm(true); setSelectedUser(''); }}
                    />
                    Add new
                  </label>
                </div>
                {!showEmployeeForm && (
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="form-control"
                    required
                  >
                    <option value="">Select from list</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || 'Unknown'} ({user.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="">Map Role</option>
                  {roles.length > 0 ? (
                    roles.filter(role => role.isActive).map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.roleName} - {role.description}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No roles available</option>
                  )}
                </select>
                {roles.length === 0 && (
                  <small className="text-muted">No roles found. Create roles in the Role Management tab first.</small>
                )}
              </div>
            </div>
            
            {/* Current Role Display */}
            {selectedUser && (
              <div className="current-role-display">
                <div className="form-group">
                  <label>Current Role</label>
                  <div className="current-role-info">
                    {(() => {
                      const selectedUserData = users.find(user => user.id.toString() === selectedUser);
                      return selectedUserData ? (
                        <div className="role-info">
                          <span className={`current-role-badge ${getRoleColor(selectedUserData.role)}`}>
                            {selectedUserData.role || 'No Role Assigned'}
                          </span>
                          <span className="role-info-text">
                            {selectedUserData.role ? 'Currently assigned' : 'No role assigned yet'}
                          </span>
                        </div>
                      ) : (
                        <span className="no-user-selected">No user selected</span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
            
            <div className="form-actions">
              <button
                onClick={async () => {
                  if (!showEmployeeForm && (!selectedUser || !selectedRole)) {
                    setError('Please select both a user and a role');
                    return;
                  }
                  if (!showEmployeeForm) {
                    await handleAssignRole({ userId: selectedUser, roleId: selectedRole });
                    setSelectedUser('');
                    setSelectedRole('');
                  }
                }}
                disabled={!showEmployeeForm && (!selectedUser || !selectedRole)}
                className="btn btn-primary"
              >
                Submit
              </button>
            </div>
          </div>

          {/* Employee Registration Form */}
          {showEmployeeForm && (
            <div className="employee-registration-section">
              <div className="form-header">
                <h4 className="form-title">Add New Employee</h4>
                <button
                  type="button"
                  onClick={() => setShowEmployeeForm(false)}
                  className="btn btn-secondary"
                >
                  ✕ Close
                </button>
              </div>
              <EmployeeRegistrationForm 
                isInDashboard={true}
                onClose={() => {
                  setShowEmployeeForm(false);
                  loadUsers(); // Refresh users list after registration
                }}
                onSubmit={async (data) => {
                  try {
                    console.log('Employee registration submitted:', data);
                    setShowEmployeeForm(false);
                    await loadUsers(); // Refresh users list
                    alert('Employee registration completed successfully!');
                  } catch (error) {
                    console.error('Error submitting employee registration:', error);
                    setError('Failed to register employee: ' + error.message);
                  }
                }}
              />
            </div>
          )}

        </>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingRole ? 'Edit Role' : 'Add New Role'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="role-form">
              <div className="form-group">
                <label>Role Name *</label>
                <div className="radio-group">
                  <label className="checkbox-label">
                    <input
                      type="radio"
                      name="roleName"
                      checked={formData.roleName === 'MANAGER'}
                      onChange={() => handleRoleRadioChange('MANAGER')}
                      required
                    />
                    Manager
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="radio"
                      name="roleName"
                      checked={formData.roleName === 'EMPLOYEE'}
                      onChange={() => handleRoleRadioChange('EMPLOYEE')}
                      required
                    />
                    Employee
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-control"
                  rows="3"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Select Modules *</label>
                <select multiple className="form-control" value={formData.allowedModules} onChange={handleModuleSelectChange} size="3" required>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="FARMER">Farmer</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Define Access *</label>
                <select multiple className="form-control" value={formData.permissions} onChange={handlePermissionSelectChange} size="4" required>
                  <option value="ADD">Add</option>
                  <option value="VIEW">View</option>
                  <option value="EDIT">Edit</option>
                  <option value="DELETE">Delete</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingRole ? 'Update Role' : 'Create Role')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Assign Role to User</h3>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const userId = formData.get('userId');
              const roleId = formData.get('roleId');
              
              if (userId && roleId) {
                handleAssignRole({ userId, roleId });
              }
            }} className="role-form">
              <div className="form-group">
                <label>Select User *</label>
                <select name="userId" required className="form-control">
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || 'Unknown'} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Select Role *</label>
                <select name="roleId" required className="form-control">
                  <option value="">Choose a role...</option>
                  {roles.filter(role => role.isActive).map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.roleName} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Assigning...' : 'Assign Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserRolesTab;
