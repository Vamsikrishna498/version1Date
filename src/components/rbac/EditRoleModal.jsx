import React, { useState, useEffect } from 'react';

const EditRoleModal = ({
  role,
  availableModules,
  availablePermissions,
  onUpdateRole,
  onClose
}) => {
  const [formData, setFormData] = useState({
    roleName: '',
    description: '',
    isActive: true,
    selectedModules: [],
    selectedPermissions: []
  });

  useEffect(() => {
    if (role) {
      setFormData({
        roleName: role.roleName || '',
        description: role.description || '',
        isActive: role.isActive !== false,
        selectedModules: role.allowedModules ? Array.from(role.allowedModules) : [],
        selectedPermissions: role.permissions ? Array.from(role.permissions) : []
      });
    }
  }, [role]);

  const handleModuleToggle = (moduleName) => {
    setFormData(prev => ({
      ...prev,
      selectedModules: prev.selectedModules.includes(moduleName)
        ? prev.selectedModules.filter(m => m !== moduleName)
        : [...prev.selectedModules, moduleName]
    }));
  };

  const handlePermissionToggle = (permission) => {
    setFormData(prev => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permission)
        ? prev.selectedPermissions.filter(p => p !== permission)
        : [...prev.selectedPermissions, permission]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.selectedModules.length === 0) {
      alert('Please select at least one module');
      return;
    }

    if (formData.selectedPermissions.length === 0) {
      alert('Please select at least one permission');
      return;
    }

    onUpdateRole(role.id, {
      roleName: formData.roleName,
      description: formData.description,
      isActive: formData.isActive,
      allowedModules: formData.selectedModules,
      permissions: formData.selectedPermissions
    });
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

  const getPermissionLabel = (permission) => {
    const labels = {
      'ADD': 'Create',
      'VIEW': 'View',
      'EDIT': 'Edit',
      'DELETE': 'Delete'
    };
    return labels[permission] || permission;
  };

  if (!role) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Edit Role: {role.roleName}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Role Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Name *
              </label>
              <input
                type="text"
                required
                value={formData.roleName}
                onChange={(e) => setFormData(prev => ({ ...prev, roleName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Manager / Employee"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Brief description of the role"
              />
            </div>

            {/* Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={true}>Active</option>
                <option value={false}>Inactive</option>
              </select>
            </div>

            {/* Select Modules */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Modules *
              </label>
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.selectedModules.includes('EMPLOYEE')}
                      onChange={() => handleModuleToggle('EMPLOYEE')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />
                    <span className="text-sm font-medium text-gray-900">Employee</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.selectedModules.includes('FARMER')}
                      onChange={() => handleModuleToggle('FARMER')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />
                    <span className="text-sm font-medium text-gray-900">Farmer</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Define Access */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Define Access *
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Define Access to selected modules for "Select Modules" option
              </p>
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.selectedPermissions.includes('ADD')}
                      onChange={() => handlePermissionToggle('ADD')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />
                    <span className="text-sm font-medium text-gray-900">Add</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.selectedPermissions.includes('VIEW')}
                      onChange={() => handlePermissionToggle('VIEW')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />
                    <span className="text-sm font-medium text-gray-900">View</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.selectedPermissions.includes('EDIT')}
                      onChange={() => handlePermissionToggle('EDIT')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />
                    <span className="text-sm font-medium text-gray-900">Edit</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.selectedPermissions.includes('DELETE')}
                      onChange={() => handlePermissionToggle('DELETE')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />
                    <span className="text-sm font-medium text-gray-900">Delete</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Update Role
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditRoleModal;
