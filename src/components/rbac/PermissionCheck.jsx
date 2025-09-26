import React, { useState, useEffect } from 'react';
import { rbacAPI } from '../../api/apiService';

const PermissionCheck = ({
  users,
  roles
}) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUserSelect = async (userId) => {
    if (!userId) {
      setSelectedUser(null);
      setUserPermissions(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const permissions = await rbacAPI.getUserPermissions(userId);
      setSelectedUser(users.find(u => u.id == userId));
      setUserPermissions(permissions);
    } catch (err) {
      setError('Failed to load user permissions');
      console.error('Error loading user permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getModuleLabel = (moduleName) => {
    const labels = {
      'EMPLOYEE': 'Employee Management',
      'FARMER': 'Farmer Management',
      'FPO': 'FPO Management',
      'CONFIGURATION': 'System Configuration',
      'ANALYTICS': 'Analytics & Reports',
      'USER_MANAGEMENT': 'User Management'
    };
    return labels[moduleName] || moduleName;
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'canAdd': return '➕';
      case 'canView': return '👁️';
      case 'canEdit': return '✏️';
      case 'canDelete': return '🗑️';
      default: return '❓';
    }
  };

  const getPermissionLabel = (permission) => {
    switch (permission) {
      case 'canAdd': return 'Create';
      case 'canView': return 'View';
      case 'canEdit': return 'Edit';
      case 'canDelete': return 'Delete';
      default: return permission;
    }
  };

  const getUserDisplayName = (user) => {
    return `${user.name || 'Unknown'} (${user.email})`;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Permission Check</h3>
        <p className="text-sm text-gray-600">Check user permissions and access levels</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Select User</h4>
            <select
              onChange={(e) => handleUserSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              defaultValue=""
            >
              <option value="">Choose a user to check permissions...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {getUserDisplayName(user)}
                </option>
              ))}
            </select>

            {selectedUser && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900">Selected User</h5>
                <p className="text-sm text-gray-600">{getUserDisplayName(selectedUser)}</p>
                <p className="text-sm text-gray-500">Status: {selectedUser.status}</p>
              </div>
            )}
          </div>
        </div>

        {/* Permission Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Permission Details</h4>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600">{error}</p>
              </div>
            ) : !selectedUser ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No user selected</h3>
                <p className="mt-1 text-sm text-gray-500">Select a user from the dropdown to view their permissions.</p>
              </div>
            ) : userPermissions ? (
              <div>
                {/* User Info */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-blue-900">Role: {userPermissions.roleName}</h5>
                      <p className="text-sm text-blue-700">
                        {userPermissions.email} • {userPermissions.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Active User
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permissions Grid */}
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-900">Module Permissions</h5>
                  {userPermissions.permissions && userPermissions.permissions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {userPermissions.permissions.map((permission, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h6 className="font-medium text-gray-900">
                              {getModuleLabel(permission.moduleName)}
                            </h6>
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                            {['canAdd', 'canView', 'canEdit', 'canDelete'].map((perm) => (
                              <div key={perm} className="flex items-center justify-center">
                                <div className={`flex items-center space-x-2 p-2 rounded ${
                                  permission[perm] 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                  <span className="text-lg">
                                    {getPermissionIcon(perm)}
                                  </span>
                                  <span className="text-sm font-medium">
                                    {getPermissionLabel(perm)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No permissions found</h3>
                      <p className="mt-1 text-sm text-gray-500">This user has no module permissions assigned.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading permissions...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionCheck;
