import React, { createContext, useContext, useState, useEffect } from 'react';
import { rbacAPI } from '../api/apiService';

const RBACContext = createContext();

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

export const RBACProvider = ({ children }) => {
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current user from localStorage or auth context
  const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  };

  // Load user permissions
  const loadUserPermissions = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const permissions = await rbacAPI.getUserPermissions(currentUser.id);
      setUserPermissions(permissions);
    } catch (err) {
      console.error('Error loading user permissions:', err);
      setError('Failed to load user permissions');
    } finally {
      setLoading(false);
    }
  };

  // Check if user has specific permission
  const hasPermission = (moduleName, permission) => {
    if (!userPermissions || !userPermissions.permissions) {
      return false;
    }

    const modulePermission = userPermissions.permissions.find(
      perm => perm.moduleName === moduleName
    );

    if (!modulePermission) {
      return false;
    }

    switch (permission.toLowerCase()) {
      case 'add':
      case 'create':
        return modulePermission.canAdd;
      case 'view':
      case 'read':
        return modulePermission.canView;
      case 'edit':
      case 'update':
        return modulePermission.canEdit;
      case 'delete':
      case 'remove':
        return modulePermission.canDelete;
      default:
        return false;
    }
  };

  // Check if user has any permission on a module
  const hasAnyPermission = (moduleName) => {
    if (!userPermissions || !userPermissions.permissions) {
      return false;
    }

    const modulePermission = userPermissions.permissions.find(
      perm => perm.moduleName === moduleName
    );

    return modulePermission && (
      modulePermission.canAdd ||
      modulePermission.canView ||
      modulePermission.canEdit ||
      modulePermission.canDelete
    );
  };

  // Check if user is a specific role
  const hasRole = (roleName) => {
    if (!userPermissions) {
      return false;
    }
    return userPermissions.roleName === roleName;
  };

  // Check if user is admin or super admin
  const isAdmin = () => {
    return hasRole('ADMIN') || hasRole('SUPER_ADMIN');
  };

  // Check if user is super admin
  const isSuperAdmin = () => {
    return hasRole('SUPER_ADMIN');
  };

  // Get accessible modules
  const getAccessibleModules = () => {
    if (!userPermissions || !userPermissions.permissions) {
      return [];
    }
    return userPermissions.permissions
      .filter(perm => hasAnyPermission(perm.moduleName))
      .map(perm => perm.moduleName);
  };

  // Refresh permissions
  const refreshPermissions = () => {
    loadUserPermissions();
  };

  useEffect(() => {
    loadUserPermissions();
  }, []);

  const value = {
    userPermissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasRole,
    isAdmin,
    isSuperAdmin,
    getAccessibleModules,
    refreshPermissions
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};

export default RBACContext;
