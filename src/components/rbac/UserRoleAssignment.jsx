import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeRegistrationForm from '../EmployeeRegistrationForm';

const UserRoleAssignment = ({
  users,
  roles,
  onAssignRole
}) => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const getRoleColor = (roleName) => {
    const colors = {
      'SUPER_ADMIN': 'bg-red-100 text-red-800',
      'ADMIN': 'bg-purple-100 text-purple-800',
      'MANAGER': 'bg-blue-100 text-blue-800',
      'EMPLOYEE': 'bg-green-100 text-green-800',
      'FARMER': 'bg-yellow-100 text-yellow-800',
      'FPO_ADMIN': 'bg-indigo-100 text-indigo-800',
      'FPO_EMPLOYEE': 'bg-pink-100 text-pink-800'
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

  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      alert('Please select both a user and a role');
      return;
    }

    if (window.confirm('Are you sure you want to assign this role to the user?')) {
      try {
        await onAssignRole({ 
          userId: selectedUser, 
          roleId: selectedRole 
        });
        
        // Find the user and role names for the success message
        const user = users.find(u => u.id.toString() === selectedUser);
        const role = roles.find(r => r.id.toString() === selectedRole);
        
        const userDisplayName = user ? (user.name || user.email || 'User') : 'User';
        const roleDisplayName = role ? role.roleName : 'Role';
        
        setSuccessMessage(`✅ Role "${roleDisplayName}" has been successfully assigned to "${userDisplayName}"!`);
        
        // Reset form after successful assignment
        setSelectedUser('');
        setSelectedRole('');
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
        
      } catch (error) {
        console.error('Error assigning role:', error);
        // Error will be handled by the parent component
      }
    }
  };

  const handleQuickAssign = async (userId, roleId) => {
    if (window.confirm('Are you sure you want to assign this role to the user?')) {
      await onAssignRole({ userId: userId.toString(), roleId: roleId.toString() });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">User Role Assignments</h3>
          <p className="text-sm text-gray-600">Manage role assignments for system users</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <span className="mr-2">✅</span>
          <span className="flex-1">{successMessage}</span>
          <button 
            onClick={() => setSuccessMessage('')} 
            className="text-green-700 hover:text-green-900 font-bold text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* User Assignment Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Assign Role to User</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Details *
            </label>
            <div className="flex gap-2">
              <select
                value={selectedUser}
                onChange={handleUserChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select from list</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || 'Unknown'} ({user.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowEmployeeForm(true)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium whitespace-nowrap"
              >
                ➕ Add User
              </button>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Map Role</option>
              {roles.filter(role => role.isActive).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.roleName} - {role.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assignment Button */}
        <div className="mt-4">
          <button
            onClick={handleAssignRole}
            disabled={!selectedUser || !selectedRole}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Assign Role
          </button>
        </div>
      </div>

      {/* Employee Registration Form */}
      {showEmployeeForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6 border-2 border-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-blue-600">Add New Employee</h4>
            <button
              type="button"
              onClick={() => setShowEmployeeForm(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium"
            >
              ✕ Close
            </button>
          </div>
          <EmployeeRegistrationForm 
            isInDashboard={true}
            onClose={() => {
              setShowEmployeeForm(false);
              // Refresh users list after registration
              window.location.reload(); // Simple refresh for now
            }}
            onSubmit={async (data) => {
              try {
                console.log('Employee registration submitted:', data);
                setShowEmployeeForm(false);
                alert('Employee registration completed successfully!');
                window.location.reload(); // Refresh to show new user
              } catch (error) {
                console.error('Error submitting employee registration:', error);
                alert('Failed to register employee: ' + error.message);
              }
            }}
          />
        </div>
      )}

      {/* Current User Assignments */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Current User Assignments</h4>
        {users.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">No users are available for role assignment.</p>
          </div>
        ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Map Role
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserStatusColor(user.status)}`}>
                        {user.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role || 'No Role'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleQuickAssign(user.id, e.target.value);
                          }
                        }}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                        defaultValue=""
                      >
                        <option value="">Map Role</option>
                        {roles.filter(role => role.isActive).map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.roleName}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default UserRoleAssignment;
