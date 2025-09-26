import React from 'react';

const RoleCard = ({
  role,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate
}) => {
  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'ADD': return '➕';
      case 'VIEW': return '👁️';
      case 'EDIT': return '✏️';
      case 'DELETE': return '🗑️';
      default: return '❓';
    }
  };

  const getModuleColor = (moduleName) => {
    const colors = {
      'EMPLOYEE': 'bg-blue-100 text-blue-800',
      'FARMER': 'bg-green-100 text-green-800',
      'FPO': 'bg-purple-100 text-purple-800',
      'CONFIGURATION': 'bg-gray-100 text-gray-800',
      'ANALYTICS': 'bg-yellow-100 text-yellow-800',
      'USER_MANAGEMENT': 'bg-red-100 text-red-800'
    };
    return colors[moduleName] || 'bg-gray-100 text-gray-800';
  };

  const getModuleLabel = (moduleName) => {
    const labels = {
      'EMPLOYEE': 'Employee',
      'FARMER': 'Farmer',
      'FPO': 'FPO',
      'CONFIGURATION': 'Config',
      'ANALYTICS': 'Analytics',
      'USER_MANAGEMENT': 'Users'
    };
    return labels[moduleName] || moduleName;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
      role.isActive ? 'border-green-500' : 'border-red-500'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{role.roleName}</h3>
          {role.description && (
            <p className="text-sm text-gray-600 mt-1">{role.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            role.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {role.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Modules and Permissions */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Modules & Permissions</h4>
        <div className="space-y-3">
          {/* Allowed Modules */}
          <div>
            <h5 className="text-xs font-medium text-gray-600 mb-1">Modules:</h5>
            <div className="flex flex-wrap gap-1">
              {role.allowedModules && role.allowedModules.length > 0 ? (
                role.allowedModules.map((moduleName) => (
                  <span key={moduleName} className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getModuleColor(moduleName)}`}>
                    {getModuleLabel(moduleName)}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500 italic">No modules assigned</span>
              )}
            </div>
          </div>
          
          {/* Permissions */}
          <div>
            <h5 className="text-xs font-medium text-gray-600 mb-1">Permissions:</h5>
            <div className="flex flex-wrap gap-1">
              {role.permissions && role.permissions.length > 0 ? (
                role.permissions.map((permission) => (
                  <span key={permission} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {getPermissionIcon(permission)} {permission}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500 italic">No permissions assigned</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-500 mb-4">
        <p>Created: {new Date(role.createdAt).toLocaleDateString()}</p>
        {role.updatedAt && role.createdAt !== role.updatedAt && (
          <p>Updated: {new Date(role.updatedAt).toLocaleDateString()}</p>
        )}
        {role.createdBy && <p>Created by: {role.createdBy}</p>}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={onEdit}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Edit
        </button>
        
        {role.isActive ? (
          <button
            onClick={onDeactivate}
            className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
          >
            Deactivate
          </button>
        ) : (
          <button
            onClick={onActivate}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            Activate
          </button>
        )}
        
        <button
          onClick={onDelete}
          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default RoleCard;
