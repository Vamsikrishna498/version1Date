import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RBACProvider } from './contexts/RBACContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import FPODashboard from './pages/FPODashboard';
import FPOAdminDashboard from './pages/FPOAdminDashboard';
import FPOEmployeeDashboard from './pages/FPOEmployeeDashboard';
import UsersRolesManagement from './pages/UsersRolesManagement';

import FarmerRegistration from './pages/FarmerRegistration';
import EmployeeRegistration from './pages/EmployeeRegistration';
import RegistrationForm from './pages/RegistrationForm';
import ForgotPassword from './pages/ForgotPassword';
import ForgotUserId from './pages/ForgotUserid';
import ChangePassword from './pages/ChangePassword';
import ChangeUserId from './pages/ChangeUserId';
import OtpVerification from './pages/OtpVerification';
import ProtectedRoute from './components/ProtectedRoute';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import MyIdCard from './pages/MyIdCard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <RBACProvider>
        <Router>
          <div className="App">
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/forgot-userid" element={<ForgotUserId />} />
            <Route path="/otp-verification" element={<OtpVerification />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/change-userid" element={<ChangeUserId />} />
            
            {/* Home Route - Redirect to Login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            
            {/* Registration Routes */}
            <Route path="/farmer/registration" element={<FarmerRegistration />} />
            <Route path="/employee/registration" element={<EmployeeRegistration />} />
            <Route path="/register-employee" element={<RegistrationForm />} />
            <Route path="/register-farmer" element={<RegistrationForm />} />
            <Route path="/register-fpo" element={<RegistrationForm />} />
            <Route path="/register-admin" element={<RegistrationForm />} />
            
            {/* Protected Dashboard Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/superadmin/dashboard" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/dashboard" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/employee/dashboard" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><EmployeeDashboard /></ProtectedRoute>} />
            <Route path="/fpo-employee/dashboard" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><FPOEmployeeDashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['FARMER']}><FarmerDashboard /></ProtectedRoute>} />
            <Route path="/fpo/dashboard/:fpoId" element={<ProtectedRoute allowedRoles={['FPO']}><FPODashboard /></ProtectedRoute>} />
            <Route path="/fpo/dashboard" element={<ProtectedRoute allowedRoles={['FPO']}><FPODashboard /></ProtectedRoute>} />
            <Route path="/fpo-admin/dashboard/:fpoId" element={<ProtectedRoute allowedRoles={['FPO']}><FPOAdminDashboard /></ProtectedRoute>} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            
            {/* ID Card Route */}
            <Route path="/my-id-card" element={<ProtectedRoute allowedRoles={['FARMER', 'EMPLOYEE', 'ADMIN', 'SUPER_ADMIN']}><MyIdCard /></ProtectedRoute>} />

            {/* Users & Roles Management Route */}
            <Route path="/users-roles-management" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><UsersRolesManagement /></ProtectedRoute>} />
            
            {/* Default Routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        </Router>
      </RBACProvider>
    </AuthProvider>
  );
}

export default App;
