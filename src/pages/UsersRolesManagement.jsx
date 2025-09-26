import React, { useState, useEffect } from 'react';
import { rbacAPI } from '../api/apiService';
import RoleManagement from '../components/rbac/RoleManagement';
import UserRoleAssignment from '../components/rbac/UserRoleAssignment';
import CreateRoleModal from '../components/rbac/CreateRoleModal';
import EditRoleModal from '../components/rbac/EditRoleModal';
import AssignRoleModal from '../components/rbac/AssignRoleModal';
import PermissionCheck from '../components/rbac/PermissionCheck';

const UsersRolesManagement = () => {
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardData, setDashboardData] = useState(null);

  // Available modules for role configuration
  const availableModules = [
    { name: 'EMPLOYEE', label: 'Employee Management' },
    { name: 'FARMER', label: 'Farmer Management' },
    { name: 'FPO', label: 'FPO Management' },
    { name: 'CONFIGURATION', label: 'System Configuration' },
    { name: 'ANALYTICS', label: 'Analytics & Reports' },
    { name: 'USER_MANAGEMENT', label: 'User Management' }
  ];

  const availablePermissions = ['ADD', 'VIEW', 'EDIT', 'DELETE'];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardData, rolesData, usersData] = await Promise.all([
        rbacAPI.getDashboardData(),
        rbacAPI.getAllRoles(),
        rbacAPI.getAllUsers()
      ]);
      setDashboardData(dashboardData);
      setRoles(rolesData || []);
      setUsers(usersData || []);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (roleData) => {
    try {
      await rbacAPI.createRole(roleData);
      await loadDashboardData();
      setShowCreateRoleModal(false);
    } catch (err) {
      setError('Failed to create role');
      console.error('Error creating role:', err);
    }
  };

  const handleUpdateRole = async (id, roleData) => {
    try {
      await rbacAPI.updateRole(id, roleData);
      await loadDashboardData();
      setShowEditRoleModal(false);
      setSelectedRole(null);
    } catch (err) {
      setError('Failed to update role');
      console.error('Error updating role:', err);
    }
  };

  const handleDeleteRole = async (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await rbacAPI.deleteRole(id);
        await loadDashboardData();
      } catch (err) {
        setError('Failed to delete role');
        console.error('Error deleting role:', err);
      }
    }
  };

  const handleActivateRole = async (id) => {
    try {
      await rbacAPI.activateRole(id);
      await loadDashboardData();
    } catch (err) {
      setError('Failed to activate role');
      console.error('Error activating role:', err);
    }
  };

  const handleDeactivateRole = async (id) => {
    try {
      await rbacAPI.deactivateRole(id);
      await loadDashboardData();
    } catch (err) {
      setError('Failed to deactivate role');
      console.error('Error deactivating role:', err);
    }
  };

  const handleAssignRole = async (assignmentData) => {
    try {
      const result = await rbacAPI.assignRoleToUser(assignmentData);
      console.log('Role assignment result:', result);
      await loadDashboardData();
      setShowAssignRoleModal(false);
      setError(null); // Clear any previous errors
    } catch (err) {
      setError('Failed to assign role to user: ' + (err.response?.data?.error || err.message));
      console.error('Error assigning role:', err);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Users & Roles Management
          </h1>
          <p className="text-gray-600">
            Manage user roles, permissions, and access control for your system
          </p>
        </div>

        {/* Dashboard Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Roles</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.totalRoles}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Roles</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {roles.filter(role => role.isActive).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Modules</p>
                  <p className="text-2xl font-bold text-gray-900">{availableModules.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right font-bold text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'roles', label: 'Role Management', icon: '👥' },
                { id: 'assignments', label: 'User Assignments', icon: '🔗' },
                { id: 'permissions', label: 'Permission Check', icon: '🔐' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Role Management Tab */}
            {activeTab === 'roles' && (
              <RoleManagement
                roles={filteredRoles}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onEditRole={(role) => {
                  setSelectedRole(role);
                  setShowEditRoleModal(true);
                }}
                onDeleteRole={handleDeleteRole}
                onActivateRole={handleActivateRole}
                onDeactivateRole={handleDeactivateRole}
                onCreateRole={() => setShowCreateRoleModal(true)}
              />
            )}

            {/* User Assignments Tab */}
            {activeTab === 'assignments' && (
              <UserRoleAssignment
                users={users}
                roles={roles.filter(role => role.isActive)}
                onAssignRole={() => setShowAssignRoleModal(true)}
              />
            )}

            {/* Permission Check Tab */}
            {activeTab === 'permissions' && (
              <PermissionCheck
                users={users}
                roles={roles}
              />
            )}
          </div>
        </div>

        {/* Modals */}
        {showCreateRoleModal && (
          <CreateRoleModal
            availableModules={availableModules}
            availablePermissions={availablePermissions}
            onCreateRole={handleCreateRole}
            onClose={() => setShowCreateRoleModal(false)}
          />
        )}

        {showEditRoleModal && selectedRole && (
          <EditRoleModal
            role={selectedRole}
            availableModules={availableModules}
            availablePermissions={availablePermissions}
            onUpdateRole={handleUpdateRole}
            onClose={() => {
              setShowEditRoleModal(false);
              setSelectedRole(null);
            }}
          />
        )}

        {showAssignRoleModal && (
          <AssignRoleModal
            users={users}
            roles={roles.filter(role => role.isActive)}
            onAssignRole={handleAssignRole}
            onClose={() => setShowAssignRoleModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default UsersRolesManagement;
