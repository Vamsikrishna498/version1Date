import React, { useState } from 'react';

const AssignRoleModal = ({
  users,
  roles,
  onAssignRole,
  onClose
}) => {
  const [formData, setFormData] = useState({
    userId: '',
    roleId: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.roleId) {
      alert('Please select both a user and a role');
      return;
    }

    onAssignRole(formData);
  };

  const getUserDisplayName = (user) => {
    return `${user.name || 'Unknown'} (${user.email})`;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Assign Role to User</h3>
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
            {/* User Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User *
              </label>
              <select
                required
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {getUserDisplayName(user)}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Role *
              </label>
              <select
                required
                value={formData.roleId}
                onChange={(e) => setFormData(prev => ({ ...prev, roleId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a role...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.roleName} {role.description && `- ${role.description}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected User and Role Preview */}
            {formData.userId && formData.roleId && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Assignment Preview</h4>
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>User:</strong> {getUserDisplayName(users.find(u => u.id == formData.userId))}
                  </p>
                  <p>
                    <strong>Role:</strong> {roles.find(r => r.id == formData.roleId)?.roleName}
                  </p>
                </div>
              </div>
            )}

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
                Assign Role
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignRoleModal;
