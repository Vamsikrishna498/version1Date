import React from 'react';
import { useRBAC } from '../../contexts/RBACContext';

const ProtectedComponent = ({ 
  children, 
  module, 
  permission, 
  role, 
  fallback = null,
  showAccessDenied = true 
}) => {
  const { hasPermission, hasAnyPermission, hasRole, loading } = useRBAC();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check role-based access
  if (role && !hasRole(role)) {
    return showAccessDenied ? (
      <div className="text-center p-4 text-gray-500">
        <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
        <p className="text-sm">Access denied: Insufficient role privileges</p>
      </div>
    ) : fallback;
  }

  // Check module-based access
  if (module) {
    // If permission is specified, check specific permission
    if (permission && !hasPermission(module, permission)) {
      return showAccessDenied ? (
        <div className="text-center p-4 text-gray-500">
          <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
          <p className="text-sm">Access denied: No {permission} permission for {module}</p>
        </div>
      ) : fallback;
    }

    // If no specific permission, check if user has any permission on the module
    if (!hasAnyPermission(module)) {
      return showAccessDenied ? (
        <div className="text-center p-4 text-gray-500">
          <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
          <p className="text-sm">Access denied: No access to {module}</p>
        </div>
      ) : fallback;
    }
  }

  // All checks passed, render children
  return children;
};

export default ProtectedComponent;
