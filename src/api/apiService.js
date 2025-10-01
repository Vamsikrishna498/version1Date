import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  timeout: 30000, // Increased from 10000 to 30000 (30 seconds)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const hasToken = !!localStorage.getItem('token');
    const onLoginPage = typeof window !== 'undefined' && window.location?.pathname === '/login';

    // Avoid full-page reload for intentional 401s on login endpoints
    const isAuthAttempt = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/fpo-login');

    if (status === 401 && hasToken && !isAuthAttempt && !onLoginPage) {
      // Session expired while authenticated → clean up and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return; // stop further propagation
    }

    // Handle 403 errors for configuration endpoints gracefully
    if (status === 403 && requestUrl.includes('/config/')) {
      console.warn(`Access denied to configuration endpoint: ${requestUrl}. Using fallback data.`);
      // Don't log as error for config endpoints as they're expected to be restricted for employees
    }

    // For login failures and requests without a token, let callers handle the error (no reload)
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // Login
  login: async (credentials) => {
    // Backend expects payload: { userName, password }
    const payload = {
      userName: credentials.userName || credentials.username || credentials.email,
      password: credentials.password,
    };
    const response = await api.post('/auth/login', payload);
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    // Preferred profile endpoint, then fallbacks
    try {
      const res = await api.get('/user/profile');
      return res.data;
    } catch (e0) {
      try {
        const res = await api.get('/auth/me');
        return res.data;
      } catch (e1) {
        try {
          const res = await api.get('/auth/profile');
          return res.data;
        } catch (e2) {
          const res = await api.get('/auth/users/profile');
          return res.data;
        }
      }
    }
  },

  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Send OTP
  sendOTP: async (email) => {
    try {
      const response = await api.post('/auth/send-otp', { emailOrPhone: email }, {
        timeout: 45000 // 45 seconds for OTP operations
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('OTP request timed out. Please check your internet connection and try again.');
      }
      throw error;
    }
  },

  // Verify OTP
  verifyOTP: async (otpData) => {
    try {
      const response = await api.post('/auth/verify-otp', { 
        emailOrPhone: otpData.email, 
        otp: otpData.otp 
      }, {
        timeout: 30000 // 30 seconds for OTP verification
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('OTP verification timed out. Please try again.');
      }
      throw error;
    }
  },

  // Resend OTP
  resendOTP: async (email) => {
    try {
      const response = await api.post('/auth/resend-otp', { emailOrPhone: email }, {
        timeout: 45000 // 45 seconds for OTP operations
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('OTP resend timed out. Please check your internet connection and try again.');
      }
      throw error;
    }
  },

  // Forgot password
  forgotPassword: async (emailOrPhone) => {
    const response = await api.post('/auth/forgot-password', { emailOrPhone });
    return response.data;
  },

  // Forgot user ID
  forgotUserId: async (emailOrPhone) => {
    const response = await api.post('/auth/forgot-user-id', { emailOrPhone });
    return response.data;
  },

  // Reset password
  resetPassword: async (resetData) => {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  },

  // Change user ID
  changeUserId: async (userIdData) => {
    const response = await api.post('/auth/change-user-id', userIdData);
    return response.data;
  },
  fpoLogin: async (email, password) => {
    const response = await api.post('/auth/fpo-login', { email, password });
    return response.data;
  },

  // Get countries
  getCountries: async () => {
    const response = await api.get('/auth/countries');
    return response.data;
  },

  // Get states
  getStates: async (countryId) => {
    const response = await api.post('/auth/states', { countryId });
    return response.data;
  },

  // Get address by pincode
  getAddressByPincode: async (pincode) => {
    const response = await api.get(`/auth/pincode/${pincode}`);
    return response.data;
  },

  // Check email availability
  checkEmailAvailability: async (email) => {
    try {
      const response = await api.post('/auth/check-email', { email });
      return response.data;
    } catch (error) {
      // If email exists, backend might return 409 or 400
      if (error.response?.status === 409 || error.response?.status === 400) {
        return { available: false, message: 'Email is already registered' };
      }
      throw error;
    }
  }
};

// Admin API calls
export const adminAPI = {
  // Get pending user registrations
  getPendingRegistrations: async () => {
    const response = await api.get('/admin/pending-registrations');
    return response.data;
  },
  
  // Get approved users
  getApprovedUsers: async () => {
    const response = await api.get('/admin/approved-users');
    return response.data;
  },

  // Get all registrations (Admin equivalent to SuperAdmin registration-list)
  getRegistrationList: async (filters = {}) => {
    const response = await api.get('/admin/registration-list', { params: filters });
    return response.data;
  },

  // Get registration list by status
  getRegistrationListByStatus: async (status) => {
    const response = await api.get('/admin/registration-list/filter', { params: { status } });
    return response.data;
  },

  // Search registrations
  searchRegistrations: async (query) => {
    const response = await api.get('/admin/registration-list/search', { params: { query } });
    return response.data;
  },
  
  // Approve user registration
  approveUser: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/approve`, { role });
    return response.data;
  },
  
  // Reject user registration
  rejectUser: async (userId, reason) => {
    const response = await api.put(`/admin/users/${userId}/reject`, { reason });
    return response.data;
  },
  
  // Get all farmers
  getAllFarmers: async () => {
    const response = await api.get('/admin/farmers');
    return response.data;
  },
  
  // Get all employees
  getAllEmployees: async () => {
    const response = await api.get('/admin/employees');
    return response.data;
  },
  
  // Get farmers with KYC status
  getFarmersWithKycStatus: async () => {
    const response = await api.get('/admin/farmers-with-kyc');
    return response.data;
  },
  
  // Get farmers with KYC (alias for compatibility)
  getFarmersWithKyc: async () => {
    const response = await api.get('/admin/farmers-with-kyc');
    return response.data;
  },
  
  // Get employees with stats
  getEmployeesWithStats: async () => {
    const response = await api.get('/admin/employees-with-stats');
    return response.data;
  },
  
  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
  },
  
  // Get todo list
  getTodoList: async () => {
    const response = await api.get('/admin/todo-list');
    return response.data;
  },
  
  // Get enhanced todo list
  getEnhancedTodoList: async () => {
    const response = await api.get('/admin/enhanced-todo-list');
    return response.data;
  },
  
  // Assign farmer to employee
  assignFarmerToEmployee: async (farmerId, employeeId) => {
    const response = await api.post('/admin/assign-farmer', null, { 
      params: { farmerId, employeeId } 
    });
    return response.data;
  },
  
  // Bulk assign farmers to employee
  bulkAssignFarmers: async (farmerIds, employeeId) => {
    const response = await api.post('/admin/bulk-assign-farmers', { 
      farmerIds, employeeId 
    });
    return response.data;
  },
  
  // Get assignment history
  getAssignmentHistory: async (filters = {}) => {
    const response = await api.get('/admin/assignment-history', { params: filters });
    return response.data;
  },
  
  // Get farmers by assignment status
  getFarmersByAssignmentStatus: async (assignmentStatus) => {
    const response = await api.get('/admin/farmers/by-assignment-status', { 
      params: { assignmentStatus } 
    });
    return response.data;
  },
  
  // Filter farmers
  filterFarmers: async (filters = {}) => {
    const response = await api.get('/admin/farmers/filter', { params: filters });
    return response.data;
  },
  
  // Get locations (states and districts)
  getLocations: async () => {
    const response = await api.get('/admin/locations');
    return response.data;
  },

  // Get farmers by employee
  getFarmersByEmployee: async (employeeId) => {
    const response = await api.get(`/admin/employees/${employeeId}/assigned-farmers`);
    return response.data;
  },

  // Get all registrations for admin
  getAllRegistrations: async (filters = {}) => {
    const response = await api.get('/admin/registration-list', { params: filters });
    return response.data;
  },

  // Get registration list by status for admin
  getRegistrationListByStatus: async (status) => {
    const response = await api.get('/admin/registration-list/filter', { params: { status } });
    return response.data;
  },

  // Search registrations
  searchRegistrations: async (query) => {
    const response = await api.get('/admin/registration-list/search', { params: { query } });
    return response.data;
  },

  // Get employee by ID
  getEmployeeById: async (employeeId) => {
    const response = await api.get(`/admin/employees/${employeeId}`);
    return response.data;
  },

  // Update employee
  updateEmployee: async (employeeId, employeeData) => {
    const response = await api.put(`/admin/employees/${employeeId}`, employeeData);
    return response.data;
  },

  // Approve registration for admin (alternative method)
  approveRegistration: async (registrationId, approvalData) => {
    const response = await api.post(`/admin/registrations/${registrationId}/approve`, approvalData);
    return response.data;
  },

  // Reject registration for admin (alternative method)
  rejectRegistration: async (registrationId, rejectionData) => {
    const response = await api.post(`/admin/registrations/${registrationId}/reject`, rejectionData);
    return response.data;
  }
};

// Super Admin API calls
export const superAdminAPI = {
  // Get all users (registrations)
  getAllUsers: async () => {
    const response = await api.get('/super-admin/registration-list');
    return response.data;
  },

  // Get registration list with filters
  getRegistrationList: async (filters = {}) => {
    const response = await api.get('/super-admin/registration-list', { params: filters });
    return response.data;
  },

  // Get registration list by status
  getRegistrationListByStatus: async (status) => {
    const response = await api.get('/super-admin/registration-list/filter', { params: { status } });
    return response.data;
  },

  // Search registrations
  searchRegistrations: async (query) => {
    const response = await api.get('/super-admin/registration-list/search', { params: { query } });
    return response.data;
  },

  // Get pending registrations
  getPendingRegistrations: async () => {
    const response = await api.get('/super-admin/pending-registrations');
    return response.data;
  },

  // Get approved users
  getApprovedUsers: async () => {
    const response = await api.get('/super-admin/approved-users');
    return response.data;
  },

  // Get users by role
  getUsersByRole: async (role) => {
    const response = await api.get(`/super-admin/users/by-role/${role}`);
    return response.data;
  },

  // Get pending users by role
  getPendingUsersByRole: async (role) => {
    const response = await api.get(`/super-admin/pending-users/by-role/${role}`);
    return response.data;
  },

  // Approve user
  approveUser: async (userId, role) => {
    try {
      // Try multiple endpoint variations for compatibility
      let response;
      let lastError;
      
      // Strategy 1: Try auth endpoint with PUT method
      try {
        console.log('🔄 Trying PUT /auth/users/' + userId + '/approve');
        response = await api.put(`/auth/users/${userId}/approve`, { role });
        console.log('✅ Success with PUT /auth/users/' + userId + '/approve');
        return response.data;
      } catch (error) {
        lastError = error;
        console.log('❌ Failed with PUT /auth/users/' + userId + '/approve:', error.response?.status);
      }
      
      // Strategy 2: Try auth endpoint with POST method
      try {
        console.log('🔄 Trying POST /auth/users/' + userId + '/approve');
        response = await api.post(`/auth/users/${userId}/approve`, { role });
        console.log('✅ Success with POST /auth/users/' + userId + '/approve');
        return response.data;
      } catch (error) {
        lastError = error;
        console.log('❌ Failed with POST /auth/users/' + userId + '/approve:', error.response?.status);
      }
      
      // Strategy 3: Try super-admin endpoint
      try {
        console.log('🔄 Trying PUT /super-admin/users/' + userId + '/approve');
        response = await api.put(`/super-admin/users/${userId}/approve`, { role });
        console.log('✅ Success with PUT /super-admin/users/' + userId + '/approve');
        return response.data;
      } catch (error) {
        lastError = error;
        console.log('❌ Failed with PUT /super-admin/users/' + userId + '/approve:', error.response?.status);
      }
      
      // Strategy 4: Try registrations endpoint
      try {
        console.log('🔄 Trying POST /registrations/' + userId + '/approve');
        response = await api.post(`/registrations/${userId}/approve`, { 
          approvedBy: 'Super Admin',
          approvalNotes: `User approved with role: ${role}`,
          role: role
        });
        console.log('✅ Success with POST /registrations/' + userId + '/approve');
        return response.data;
      } catch (error) {
        lastError = error;
        console.log('❌ Failed with POST /registrations/' + userId + '/approve:', error.response?.status);
      }
      
      // Strategy 5: Try employee-specific endpoints (based on Hibernate logs)
      try {
        console.log('🔄 Trying PUT /employees/' + userId + '/approve');
        response = await api.put(`/employees/${userId}/approve`, { role });
        console.log('✅ Success with PUT /employees/' + userId + '/approve');
        return response.data;
      } catch (error) {
        lastError = error;
        console.log('❌ Failed with PUT /employees/' + userId + '/approve:', error.response?.status);
      }
      
      // Strategy 6: Try employee status update
      try {
        console.log('🔄 Trying PUT /employees/' + userId + '/status');
        response = await api.put(`/employees/${userId}/status`, { status: 'APPROVED', role });
        console.log('✅ Success with PUT /employees/' + userId + '/status');
        return response.data;
      } catch (error) {
        lastError = error;
        console.log('❌ Failed with PUT /employees/' + userId + '/status:', error.response?.status);
      }
      
      // Strategy 7: Try user status update
      try {
        console.log('🔄 Trying PUT /users/' + userId + '/status');
        response = await api.put(`/users/${userId}/status`, { status: 'APPROVED', role });
        console.log('✅ Success with PUT /users/' + userId + '/status');
        return response.data;
      } catch (error) {
        lastError = error;
        console.log('❌ Failed with PUT /users/' + userId + '/status:', error.response?.status);
      }
      
      // If all strategies fail, throw the last error
      throw lastError;
    } catch (error) {
      console.error('❌ All approval strategies failed:', error);
      console.error('❌ Error response:', error.response?.data);
      throw error;
    }
  },

  // Reject user (update status to REJECTED)
  rejectUser: async (userId, reason) => {
    try {
      // Try multiple endpoint variations for compatibility
      let response;
      let lastError;
      
      // Strategy 1: Try auth endpoint with PUT method
      try {
        console.log('🔄 Trying PUT /auth/users/' + userId + '/reject');
        response = await api.put(`/auth/users/${userId}/reject`, { reason });
        console.log('✅ Success with PUT /auth/users/' + userId + '/reject');
        return response.data;
      } catch (error) {
        lastError = error;
        console.log('❌ Failed with PUT /auth/users/' + userId + '/reject:', error.response?.status);
      }
      
      // Strategy 2: Try auth endpoint with POST method
      try {
        console.log('🔄 Trying POST /auth/users/' + userId + '/reject');
        response = await api.post(`/auth/users/${userId}/reject`, { reason });
        console.log('✅ Success with POST /auth/users/' + userId + '/reject');
        return response.data;
      } catch (error) {
        lastError = error;
        console.log('❌ Failed with POST /auth/users/' + userId + '/reject:', error.response?.status);
      }
      
      // Strategy 3: Try super-admin endpoint
      try {
        console.log('🔄 Trying PUT /super-admin/users/' + userId + '/reject');
        response = await api.put(`/super-admin/users/${userId}/reject`, { reason });
        console.log('✅ Success with PUT /super-admin/users/' + userId + '/reject');
        return response.data;
      } catch (error) {
        lastError = error;
        console.log('❌ Failed with PUT /super-admin/users/' + userId + '/reject:', error.response?.status);
      }
      
      // Strategy 4: Try registrations endpoint
      try {
        console.log('🔄 Trying POST /registrations/' + userId + '/reject');
        response = await api.post(`/registrations/${userId}/reject`, { 
          rejectedBy: 'Super Admin',
          rejectionReason: reason || 'Registration rejected by Super Admin'
        });
        console.log('✅ Success with POST /registrations/' + userId + '/reject');
        return response.data;
      } catch (error) {
        lastError = error;
        console.log('❌ Failed with POST /registrations/' + userId + '/reject:', error.response?.status);
      }
      
      // Strategy 5: Try employee-specific endpoints (based on Hibernate logs)
      try {
        console.log('🔄 Trying PUT /employees/' + userId + '/reject');
        response = await api.put(`/employees/${userId}/reject`, { reason });
        console.log('✅ Success with PUT /employees/' + userId + '/reject');
        return response.data;
      } catch (error) {
        lastError = error;
        console.log('❌ Failed with PUT /employees/' + userId + '/reject:', error.response?.status);
      }
      
      // Strategy 6: Try employee status update
      try {
        console.log('🔄 Trying PUT /employees/' + userId + '/status');
        response = await api.put(`/employees/${userId}/status`, { status: 'REJECTED', reason });
        console.log('✅ Success with PUT /employees/' + userId + '/status');
        return response.data;
      } catch (error) {
        lastError = error;
        console.log('❌ Failed with PUT /employees/' + userId + '/status:', error.response?.status);
      }
      
      // Strategy 7: Try user status update
      try {
        console.log('🔄 Trying PUT /users/' + userId + '/status');
        response = await api.put(`/users/${userId}/status`, { status: 'REJECTED', reason });
        console.log('✅ Success with PUT /users/' + userId + '/status');
        return response.data;
      } catch (error) {
        lastError = error;
        console.log('❌ Failed with PUT /users/' + userId + '/status:', error.response?.status);
      }
      
      // If all strategies fail, throw the last error
      throw lastError;
    } catch (error) {
      console.error('❌ All rejection strategies failed:', error);
      console.error('❌ Error response:', error.response?.data);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/super-admin/users/${userId}`);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await api.put(`/super-admin/users/${userId}`, userData);
    return response.data;
  },

  // Update user status
  updateUserStatus: async (userId, status) => {
    const response = await api.put(`/auth/users/${userId}/status`, { status });
    return response.data;
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/public/dashboard/stats');
    return response.data;
  },

  // Bulk assign farmers to employee
  bulkAssignFarmers: async (farmerIds, employeeId) => {
    const response = await api.post('/super-admin/bulk-assign-farmers', { farmerIds, employeeId });
    return response.data;
  },

  // Single assign farmer to employee (fallback)
  assignFarmer: async (farmerId, employeeId) => {
    const response = await api.post('/super-admin/assign-farmer', null, { 
      params: { farmerId, employeeId } 
    });
    return response.data;
  },

  // Get employee by ID
  getEmployeeById: async (employeeId) => {
    const response = await api.get(`/super-admin/employees/${employeeId}`);
    return response.data;
  },

  // Update employee
  updateEmployee: async (employeeId, employeeData) => {
    const response = await api.put(`/super-admin/employees/${employeeId}`, employeeData);
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/super-admin/users/${userId}`);
    return response.data;
  },

  // Force password change
  forcePasswordChange: async (userId) => {
    const response = await api.put(`/super-admin/users/${userId}/force-password-change`);
    return response.data;
  }
};

// Farmers API calls
export const farmersAPI = {
  // Get all farmers
  getAllFarmers: async (filters = {}) => {
    const response = await api.get('/super-admin/farmers', { params: filters });
    return response.data;
  },

  // Get farmer by ID
  getFarmerById: async (id) => {
    const response = await api.get(`/super-admin/farmers/${id}`);
    return response.data;
  },

  // Get farmer dashboard data (includes KYC status)
  getFarmerDashboard: async (id) => {
    const response = await api.get(`/farmers/dashboard/${id}`);
    return response.data;
  },

  // Create farmer (supports files)
  createFarmer: async (farmerData) => {
    // Use the /api/farmers endpoint which supports multipart/form-data
    const formData = new FormData();
    
    // Extract file fields - check all possible file field names
    const photo = farmerData.photo;
    const passbookPhoto = farmerData.passbookFile || farmerData.passbookPhoto;
    const aadhaar = farmerData.documentFileName; // Map documentFileName to aadhaar
    const soilTestCertificate = farmerData.soilTestCertificate || farmerData.currentSoilTestCertificateFileName;
    
    console.log('🔍 File fields found:');
    console.log('  - photo:', photo);
    console.log('  - passbookPhoto:', passbookPhoto);
    console.log('  - aadhaar:', aadhaar);
    console.log('  - soilTestCertificate:', soilTestCertificate);
    
    // Create farmerDto object without file fields and fix field mappings
    const farmerDto = { ...farmerData };
    
    // Remove file fields and any other non-serializable objects
    delete farmerDto.photo;
    delete farmerDto.passbookPhoto;
    delete farmerDto.passbookFile; // Also remove passbookFile
    delete farmerDto.documentFileName;
    delete farmerDto.soilTestCertificate;
    delete farmerDto.currentSoilTestCertificateFileName;
    
    // Remove any other potential File objects or complex objects
    Object.keys(farmerDto).forEach(key => {
      if (farmerDto[key] instanceof File || farmerDto[key] instanceof Blob) {
        delete farmerDto[key];
      }
    });
    
    // Fix field name mappings
    if (farmerDto.alternativeNumber) {
      farmerDto.alternativeContactNumber = farmerDto.alternativeNumber;
      delete farmerDto.alternativeNumber;
    }
    
    // Map zipcode to pincode if zipcode exists
    if (farmerDto.zipcode && !farmerDto.pincode) {
      farmerDto.pincode = farmerDto.zipcode;
      delete farmerDto.zipcode;
    }
    
    // Map dob to dateOfBirth if dob exists
    if (farmerDto.dob && !farmerDto.dateOfBirth) {
      farmerDto.dateOfBirth = farmerDto.dob;
      delete farmerDto.dob;
    }
    
    // Map alternativeType to alternativeNumberType if alternativeType exists
    if (farmerDto.alternativeType && !farmerDto.alternativeNumberType) {
      farmerDto.alternativeNumberType = farmerDto.alternativeType;
      delete farmerDto.alternativeType;
    }
    
    // Ensure required fields have default values if missing
    if (!farmerDto.salutation) farmerDto.salutation = 'Mr';
    if (!farmerDto.firstName) farmerDto.firstName = 'Unknown';
    if (!farmerDto.lastName) farmerDto.lastName = farmerDto.firstName || 'Unknown';
    if (!farmerDto.dateOfBirth) farmerDto.dateOfBirth = '1990-01-01';
    if (!farmerDto.gender) farmerDto.gender = 'Male';
    if (!farmerDto.nationality) farmerDto.nationality = 'Indian';
    if (!farmerDto.country) farmerDto.country = 'India';
    if (!farmerDto.contactNumber) farmerDto.contactNumber = '9999999999';
    
    // Log the final farmerDto object for debugging
    console.log('🔍 Final farmerDto object (after cleanup):', farmerDto);
    console.log('🔍 Required fields check:');
    console.log('  - salutation:', farmerDto.salutation);
    console.log('  - firstName:', farmerDto.firstName);
    console.log('  - lastName:', farmerDto.lastName);
    console.log('  - dateOfBirth:', farmerDto.dateOfBirth);
    console.log('  - gender:', farmerDto.gender);
    console.log('  - nationality:', farmerDto.nationality);
    console.log('  - country:', farmerDto.country);
    
    // Ensure contact numbers match pattern (10 digits) - fix if needed
    if (farmerDto.contactNumber) {
      // Remove any non-digit characters
      farmerDto.contactNumber = farmerDto.contactNumber.toString().replace(/\D/g, '');
      // Pad or truncate to 10 digits if needed
      if (farmerDto.contactNumber.length !== 10) {
        console.warn('⚠️ Contact number adjusted to 10 digits:', farmerDto.contactNumber);
        if (farmerDto.contactNumber.length < 10) {
          farmerDto.contactNumber = farmerDto.contactNumber.padEnd(10, '0');
        } else {
          farmerDto.contactNumber = farmerDto.contactNumber.substring(0, 10);
        }
      }
    }
    
    if (farmerDto.alternativeContactNumber) {
      // Remove any non-digit characters
      farmerDto.alternativeContactNumber = farmerDto.alternativeContactNumber.toString().replace(/\D/g, '');
      // Pad or truncate to 10 digits if needed
      if (farmerDto.alternativeContactNumber.length !== 10) {
        console.warn('⚠️ Alternative contact number adjusted to 10 digits:', farmerDto.alternativeContactNumber);
        if (farmerDto.alternativeContactNumber.length < 10) {
          farmerDto.alternativeContactNumber = farmerDto.alternativeContactNumber.padEnd(10, '0');
        } else {
          farmerDto.alternativeContactNumber = farmerDto.alternativeContactNumber.substring(0, 10);
        }
      }
    }
    
    // Ensure pincode is 6 digits - fix if needed
    if (farmerDto.pincode) {
      // Remove any non-digit characters
      farmerDto.pincode = farmerDto.pincode.toString().replace(/\D/g, '');
      // Pad or truncate to 6 digits if needed
      if (farmerDto.pincode.length !== 6) {
        console.warn('⚠️ Pincode adjusted to 6 digits:', farmerDto.pincode);
        if (farmerDto.pincode.length < 6) {
          farmerDto.pincode = farmerDto.pincode.padEnd(6, '0');
        } else {
          farmerDto.pincode = farmerDto.pincode.substring(0, 6);
        }
      }
    }
    
    // Add farmerDto as JSON string
    const farmerDtoJson = JSON.stringify(farmerDto);
    console.log('🔍 farmerDto JSON being sent:', farmerDtoJson);
    console.log('🔍 farmerDto object before JSON.stringify:', farmerDto);
    formData.append('farmerDto', farmerDtoJson);
    
    // Add files if they exist
    if (photo instanceof File) {
      formData.append('photo', photo);
    }
    if (passbookPhoto instanceof File) {
      formData.append('passbookPhoto', passbookPhoto);
    }
    if (aadhaar instanceof File) {
      formData.append('aadhaar', aadhaar);
    }
    if (soilTestCertificate instanceof File) {
      formData.append('soilTestCertificate', soilTestCertificate);
    }
    
    console.log('🔍 Sending to /api/farmers with multipart data');
    try {
      const response = await api.post('/farmers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Server error details:', error.response?.data);
      console.error('❌ Full error:', error);
      
      // Extract detailed error message from backend
      let errorMessage = 'Failed to save farmer';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check for validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = 'Validation errors:\n' + errorData.errors.map(e => `- ${e.field}: ${e.message}`).join('\n');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      if (error.response?.status === 500) {
        throw new Error(`Server error: ${errorMessage}`);
      } else if (error.response?.status === 400) {
        throw new Error(`Validation error: ${errorMessage}`);
      }
      
      throw new Error(errorMessage);
    }
  },

  // Update farmer
  updateFarmer: async (id, farmerData) => {
    const response = await api.put(`/super-admin/farmers/${id}`, farmerData);
    return response.data;
  },

  // Delete farmer
  deleteFarmer: async (id) => {
    const response = await api.delete(`/super-admin/farmers/${id}`);
    return response.data;
  },

  // Assign farmer to employee
  assignFarmer: async (farmerId, employeeId) => {
    const response = await api.post(`/super-admin/farmers/${farmerId}/assign`, { employeeId });
    return response.data;
  },

  // Get farmer statistics
  getFarmerStats: async () => {
    const response = await api.get('/super-admin/farmers/stats');
    return response.data;
  },

  // Upload/Change farmer photo
  uploadPhoto: async (farmerId, file) => {
    const form = new FormData();
    form.append('photo', file);
    const response = await api.patch(`/farmers/${farmerId}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};



// Employees API calls (for Super Admin and Admin)
export const employeesAPI = {
  // Get all employees
  getAllEmployees: async (filters = {}) => {
    const response = await api.get('/super-admin/employees', { params: filters });
    return response.data;
  },

  // Get employee by ID
  getEmployeeById: async (id) => {
    const response = await api.get(`/super-admin/employees/${id}`);
    return response.data;
  },

  // Create employee
  createEmployee: async (employeeData) => {
    const response = await api.post('/super-admin/employees', employeeData);
    return response.data;
  },

  // Update employee
  updateEmployee: async (id, employeeData) => {
    const response = await api.put(`/super-admin/employees/${id}`, employeeData);
    return response.data;
  },

  // Delete employee
  deleteEmployee: async (id) => {
    const response = await api.delete(`/super-admin/employees/${id}`);
    return response.data;
  },

  // Get assigned farmers for employee
  getAssignedFarmers: async (employeeId) => {
    const response = await api.get(`/super-admin/employees/${employeeId}/assigned-farmers`);
    return response.data;
  },

  // Get employee statistics
  getEmployeeStats: async () => {
    const response = await api.get('/super-admin/employees/stats');
    return response.data;
  }
};

// Direct employee API for self-service actions
export const employeeSelfAPI = {
  // Upload/Change current employee photo
  uploadPhoto: async (employeeId, file) => {
    const form = new FormData();
    form.append('photo', file);
    const response = await api.patch(`/employees/${employeeId}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

// Employee-specific API calls (for Employee role)
export const employeeAPI = {
  // Get assigned farmers for current employee
  getAssignedFarmers: async (employeeId) => {
    try {
      console.log('🔄 Fetching assigned farmers from dashboard endpoint');
      const response = await api.get('/employees/dashboard/assigned-farmers');
      console.log('✅ Success with dashboard endpoint');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch assigned farmers:', error);
      throw error;
    }
  },

  // Get employee profile
  getProfile: async () => {
    // Use the dashboard-scoped profile endpoint
    const response = await api.get('/employees/dashboard/profile');
    return response.data;
  },

  // Update employee profile
  updateProfile: async (profileData) => {
    const response = await api.put('/employees/profile', profileData);
    return response.data;
  },

  // Get employee statistics
  getStats: async () => {
    const response = await api.get('/employees/stats');
    return response.data;
  }
};

// Registrations API calls
export const registrationsAPI = {
  // Get all registrations
  getAllRegistrations: async (filters = {}) => {
    const response = await api.get('/registrations', { params: filters });
    return response.data;
  },

  // Get registration by ID
  getRegistrationById: async (id) => {
    const response = await api.get(`/registrations/${id}`);
    return response.data;
  },

  // Approve registration
  approveRegistration: async (id, approvalData) => {
    const response = await api.post(`/registrations/${id}/approve`, approvalData);
    return response.data;
  },

  // Reject registration
  rejectRegistration: async (id, rejectionData) => {
    const response = await api.post(`/registrations/${id}/reject`, rejectionData);
    return response.data;
  },

  // Get registration statistics
  getRegistrationStats: async () => {
    const response = await api.get('/registrations/stats');
    return response.data;
  }
};

// KYC API calls
export const kycAPI = {
  // Upload KYC documents
  uploadDocuments: async (farmerId, documents) => {
    const formData = new FormData();
    Object.keys(documents).forEach(key => {
      if (documents[key]) {
        formData.append(key, documents[key]);
      }
    });
    
    const response = await api.post(`/employees/kyc/${farmerId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Approve KYC (no body required in your backend)
  approveKYC: async (farmerId) => {
    const response = await api.put(`/employees/kyc/approve/${farmerId}`);
    return response.data;
  },

  // Reject KYC
  rejectKYC: async (farmerId, rejectionData) => {
    const response = await api.put(`/employees/kyc/reject/${farmerId}`, {
      reason: rejectionData.reason || 'KYC rejected'
    });
    return response.data;
  },

  // Refer back KYC
  referBackKYC: async (farmerId, referBackData) => {
    const response = await api.put(`/employees/kyc/refer-back/${farmerId}`, {
      reason: referBackData.reason || 'KYC referred back'
    });
    return response.data;
  },

  // Get KYC status
  getKYCStatus: async (farmerId) => {
    const response = await api.get(`/employees/kyc/${farmerId}/status`);
    return response.data;
  },

  // Get KYC documents
  getKYCDocuments: async (farmerId) => {
    const response = await api.get(`/employees/kyc/${farmerId}/documents`);
    return response.data;
  },

  // Additional KYC functions for FPO Employee Dashboard
  approveFarmerKyc: async (farmerId) => {
    const response = await api.put(`/employees/kyc/approve/${farmerId}`);
    return response.data;
  },

  rejectFarmerKyc: async (farmerId, reason) => {
    const response = await api.put(`/employees/kyc/reject/${farmerId}`, {
      reason: reason || 'KYC rejected by employee'
    });
    return response.data;
  },

  referBackFarmerKyc: async (farmerId, reason) => {
    const response = await api.put(`/employees/kyc/refer-back/${farmerId}`, {
      reason: reason || 'KYC referred back by employee'
    });
    return response.data;
  }
};

// Dashboard API calls
export const dashboardAPI = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Get admin dashboard data
  getAdminDashboardData: async () => {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },

  // Get super admin dashboard data
  getSuperAdminDashboardData: async () => {
    const response = await api.get('/dashboard/super-admin');
    return response.data;
  },

  // Get employee dashboard data
  getEmployeeDashboardData: async (employeeId) => {
    const response = await api.get(`/dashboard/employee/${employeeId}`);
    return response.data;
  },

  // Get recent activity
  getRecentActivity: async () => {
    const response = await api.get('/dashboard/recent-activity');
    return response.data;
  }
};

// Main API service object (for backward compatibility)
export const apiService = {
  // Authentication
  login: authAPI.login,
  getProfile: authAPI.getProfile,
  register: authAPI.register,
  sendOTP: authAPI.sendOTP,
  verifyOTP: authAPI.verifyOTP,
  resendOTP: authAPI.resendOTP,
  forgotPassword: authAPI.forgotPassword,
  forgotUserId: authAPI.forgotUserId,
  resetPassword: authAPI.resetPassword,
  changePassword: authAPI.changePassword,
  changeUserId: authAPI.changeUserId,
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // User management
  getAllUsers: superAdminAPI.getAllUsers,
  getUserById: superAdminAPI.getUserById,
  updateUser: superAdminAPI.updateUser,
  deleteUser: superAdminAPI.deleteUser,
  forcePasswordChange: superAdminAPI.forcePasswordChange,

  // Farmer management
  createFarmer: farmersAPI.createFarmer,
  getFarmerById: farmersAPI.getFarmerById,
  getAllFarmers: farmersAPI.getAllFarmers,
  updateFarmer: farmersAPI.updateFarmer,
  deleteFarmer: farmersAPI.deleteFarmer,
  getAddressByPincode: authAPI.getAddressByPincode,
  getFarmerDashboardData: async (email) => {
    try {
      const response = await api.get(`/farmers/dashboard/by-email?email=${email}`);
      return response.data;
    } catch (error) {
      console.warn('Farmer dashboard endpoint not available, trying alternative:', error);
      // Try alternative endpoint
      try {
        const response = await api.get(`/farmers/by-email?email=${email}`);
        return response.data;
      } catch (altError) {
        console.warn('Alternative farmer endpoint also failed:', altError);
        throw error; // Re-throw original error
      }
    }
  },

  // Employee management
  createEmployee: employeesAPI.createEmployee,
  getEmployeeById: employeesAPI.getEmployeeById,
  getAllEmployees: employeesAPI.getAllEmployees,
  updateEmployee: employeesAPI.updateEmployee,
  deleteEmployee: employeesAPI.deleteEmployee,
  assignFarmerToEmployee: adminAPI.assignFarmer,
  getFarmersByEmployee: adminAPI.getFarmersByEmployee,
  approveKyc: kycAPI.approveKYC,
  referBackKyc: kycAPI.referBackKYC,
  rejectKyc: kycAPI.rejectKYC,

  // Dashboard
  getDashboardStats: dashboardAPI.getDashboardStats,
  getRecentActivity: dashboardAPI.getRecentActivity,
  getFarmerStats: farmersAPI.getFarmerStats,
  getEmployeeStats: employeesAPI.getEmployeeStats,
  getKycStats: kycAPI.getKYCStatus,

  // Bulk Operations
  bulkImport: async (type, formData) => {
    const response = await api.post(`/bulk/import/${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  bulkExport: async (type, filters) => {
    const response = await api.post(`/bulk/export/${type}`, filters, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadTemplate: async (type) => {
    const response = await api.get(`/bulk/template/${type}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getImportStatus: async (importId) => {
    const response = await api.get(`/bulk/import/status/${importId}`);
    return response.data;
  },

  getImportHistory: async (userEmail) => {
    const response = await api.get(`/bulk/import/history?userEmail=${userEmail}`);
    return response.data;
  },

  // New: assign by farmer names and employee email
  bulkAssignFarmersByNames: async (farmerNames, employeeEmail) => {
    const response = await api.post('/bulk/assign/farmers-by-names', {
      farmerNames,
      employeeEmail,
    });
    return response.data;
  },

  bulkAssignFarmersByLocation: async (location, employee) => {
    const params = { location };
    if (typeof employee === 'string') params.employeeEmail = employee;
    else if (employee != null) params.employeeId = employee;
    const response = await api.post('/bulk/assign/farmers-by-location', null, { params });
    return response.data;
  },

  // ID Card API calls
  getIdCardPdf: async (userId) => {
    const response = await api.get(`/users/${userId}/idcard?t=${Date.now()}`, {
      timeout: 60000, // 60 seconds for ID card generation
      responseType: 'blob'
    });
    return response.data;
  },

  uploadIdPhoto: async (userId, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await api.put(`/users/${userId}/upload-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000 // 60 seconds for photo upload
    });
    return response.data;
  },
};

// FPO API calls
export const fpoAPI = {
  // FPO CRUD Operations
  createFPO: async (fpoData) => {
    const response = await api.post('/fpo', fpoData);
    return response.data;
  },

  updateFPO: async (id, fpoData) => {
    const response = await api.put(`/fpo/${id}`, fpoData);
    return response.data;
  },

  // Employee-specific FPO update endpoint
  updateFPOEmployee: async (id, fpoData) => {
    try {
      // Try employee-specific endpoint first
      const response = await api.put(`/employees/fpo/${id}`, fpoData);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // Fallback to regular endpoint if employee endpoint doesn't exist
        const response = await api.put(`/fpo/${id}`, fpoData);
        return response.data;
      }
      throw error;
    }
  },

  updateFPOStatus: async (id, status) => {
    const response = await api.put(`/fpo/${id}/status?status=${status}`);
    return response.data;
  },

  getFPOById: async (id) => {
    const response = await api.get(`/fpo/${id}`);
    return response.data;
  },

  getFPOByFpoId: async (fpoId) => {
    const response = await api.get(`/fpo/fpo-id/${fpoId}`);
    return response.data;
  },

  deleteFPO: async (id) => {
    const response = await api.delete(`/fpo/${id}`);
    return response.data;
  },

  deactivateFPO: async (id) => {
    const response = await api.put(`/fpo/${id}/deactivate`);
    return response.data;
  },

  activateFPO: async (id) => {
    const response = await api.put(`/fpo/${id}/activate`);
    return response.data;
  },

  // FPO List and Search
  getAllFPOs: async (params = {}) => {
    const response = await api.get('/fpo/list', { params });
    return response.data;
  },

  searchFPOs: async (searchParams) => {
    const response = await api.post('/fpo/search', searchParams);
    return response.data;
  },

  getFPOsByState: async (state) => {
    const response = await api.get(`/fpo/state/${state}`);
    return response.data;
  },

  getFPOsByDistrict: async (district) => {
    const response = await api.get(`/fpo/district/${district}`);
    return response.data;
  },

  getDistinctStates: async () => {
    const response = await api.get('/fpo/states');
    return response.data;
  },

  getDistinctDistrictsByState: async (state) => {
    const response = await api.get(`/fpo/districts/${state}`);
    return response.data;
  },

  // FPO Dashboard
  getFPODashboard: async (id) => {
    const response = await api.get(`/fpo/${id}/dashboard`);
    return response.data;
  },

  getFPODashboardByFpoId: async (fpoId) => {
    const response = await api.get(`/fpo/fpo-id/${fpoId}/dashboard`);
    return response.data;
  },

  // FPO Statistics
  getTotalFPOsCount: async () => {
    const response = await api.get('/fpo/stats/total');
    return response.data;
  },

  getActiveFPOsCount: async () => {
    const response = await api.get('/fpo/stats/active');
    return response.data;
  },

  getFPOsCountByStatus: async (status) => {
    const response = await api.get(`/fpo/stats/status/${status}`);
    return response.data;
  },

  // FPO Members
  getFPOMembers: async (fpoId) => {
    const response = await api.get(`/fpo/${fpoId}/members`);
    return response.data;
  },

  addMemberToFPO: async (fpoId, memberData) => {
    const response = await api.post(`/fpo/${fpoId}/members`, memberData);
    return response.data;
  },

  removeMemberFromFPO: async (fpoId, memberId) => {
    const response = await api.delete(`/fpo/${fpoId}/members/${memberId}`);
    return response.data;
  },

  updateMemberStatus: async (fpoId, memberId, status) => {
    const response = await api.put(`/fpo/${fpoId}/members/${memberId}/status?status=${status}`);
    return response.data;
  },

  // FPO Board Members
  getFPOBoardMembers: async (fpoId) => {
    const response = await api.get(`/fpo/${fpoId}/board-members`);
    return response.data;
  },

  addBoardMember: async (fpoId, boardMemberData) => {
    const response = await api.post(`/fpo/${fpoId}/board-members`, boardMemberData);
    return response.data;
  },

  updateBoardMember: async (fpoId, boardMemberId, boardMemberData) => {
    const response = await api.put(`/fpo/${fpoId}/board-members/${boardMemberId}`, boardMemberData);
    return response.data;
  },

  removeBoardMember: async (fpoId, boardMemberId) => {
    const response = await api.delete(`/fpo/${fpoId}/board-members/${boardMemberId}`);
    return response.data;
  },

  // FPO Services
  getFPOServices: async (fpoId) => {
    const response = await api.get(`/fpo/${fpoId}/services`);
    return response.data;
  },

  createService: async (fpoId, serviceData) => {
    const response = await api.post(`/fpo/${fpoId}/services`, serviceData);
    return response.data;
  },

  updateService: async (fpoId, serviceId, serviceData) => {
    const response = await api.put(`/fpo/${fpoId}/services/${serviceId}`, serviceData);
    return response.data;
  },

  updateServiceStatus: async (fpoId, serviceId, status) => {
    const response = await api.put(`/fpo/${fpoId}/services/${serviceId}/status?status=${status}`);
    return response.data;
  },

  removeService: async (fpoId, serviceId) => {
    const response = await api.delete(`/fpo/${fpoId}/services/${serviceId}`);
    return response.data;
  },

  // FPO Crops
  getFPOCrops: async (fpoId) => {
    const response = await api.get(`/fpo/${fpoId}/crops`);
    return response.data;
  },

  createCrop: async (fpoId, cropData) => {
    const response = await api.post(`/fpo/${fpoId}/crops`, cropData);
    return response.data;
  },

  updateCrop: async (fpoId, cropId, cropData) => {
    const response = await api.put(`/fpo/${fpoId}/crops/${cropId}`, cropData);
    return response.data;
  },

  updateCropStatus: async (fpoId, cropId, status) => {
    const response = await api.put(`/fpo/${fpoId}/crops/${cropId}/status?status=${status}`);
    return response.data;
  },

  deleteCrop: async (fpoId, cropId) => {
    const response = await api.delete(`/fpo/${fpoId}/crops/${cropId}`);
    return response.data;
  },

  // FPO Input Shop
  getFPOInputShops: async (fpoId) => {
    const response = await api.get(`/fpo/${fpoId}/input-shops`);
    return response.data;
  },
  createInputShop: async (fpoId, shopData) => {
    const response = await api.post(`/fpo/${fpoId}/input-shops`, shopData);
    return response.data;
  },
  updateInputShop: async (fpoId, shopId, shopData) => {
    const response = await api.put(`/fpo/${fpoId}/input-shops/${shopId}`, shopData);
    return response.data;
  },
  deleteInputShop: async (fpoId, shopId) => {
    const response = await api.delete(`/fpo/${fpoId}/input-shops/${shopId}`);
    return response.data;
  },

  // FPO Turnover
  getFPOTurnovers: async (fpoId) => {
    const response = await api.get(`/fpo/${fpoId}/turnovers`);
    return response.data;
  },

  createTurnover: async (fpoId, turnoverData) => {
    const response = await api.post(`/fpo/${fpoId}/turnovers`, turnoverData);
    return response.data;
  },

  updateTurnover: async (fpoId, turnoverId, turnoverData) => {
    const response = await api.put(`/fpo/${fpoId}/turnovers/${turnoverId}`, turnoverData);
    return response.data;
  },

  deleteTurnover: async (fpoId, turnoverId) => {
    const response = await api.delete(`/fpo/${fpoId}/turnovers/${turnoverId}`);
    return response.data;
  },

  // FPO Products
  getFPOProducts: async (fpoId) => {
    const response = await api.get(`/fpo/${fpoId}/products`);
    return response.data;
  },

  createProduct: async (fpoId, productData) => {
    const response = await api.post(`/fpo/${fpoId}/products`, productData);
    return response.data;
  },

  updateProduct: async (fpoId, productId, productData) => {
    const response = await api.put(`/fpo/${fpoId}/products/${productId}`, productData);
    return response.data;
  },

  updateProductStock: async (fpoId, productId, newStock) => {
    const response = await api.put(`/fpo/${fpoId}/products/${productId}/stock?newStock=${newStock}`);
    return response.data;
  },

  deleteProduct: async (fpoId, productId) => {
    const response = await api.delete(`/fpo/${fpoId}/products/${productId}`);
    return response.data;
  },

  // FPO Product Categories
  getFPOProductCategories: async (fpoId) => {
    const response = await api.get(`/fpo/${fpoId}/products/categories`);
    return response.data;
  },

  createProductCategory: async (fpoId, categoryData) => {
    const response = await api.post(`/fpo/${fpoId}/products/categories`, categoryData);
    return response.data;
  },

  updateProductCategory: async (fpoId, categoryId, categoryData) => {
    const response = await api.put(`/fpo/${fpoId}/products/categories/${categoryId}`, categoryData);
    return response.data;
  },

  deleteProductCategory: async (fpoId, categoryId) => {
    const response = await api.delete(`/fpo/${fpoId}/products/categories/${categoryId}`);
    return response.data;
  },

  // FPO Notifications
  getFPONotifications: async (fpoId) => {
    const response = await api.get(`/fpo/${fpoId}/notifications`);
    return response.data;
  },

  createNotification: async (fpoId, notificationData) => {
    const response = await api.post(`/fpo/${fpoId}/notifications`, notificationData);
    return response.data;
  },

  markNotificationAsRead: async (fpoId, notificationId) => {
    const response = await api.put(`/fpo/${fpoId}/notifications/${notificationId}/read`);
    return response.data;
  },

  deleteNotification: async (fpoId, notificationId) => {
    const response = await api.delete(`/fpo/${fpoId}/notifications/${notificationId}`);
    return response.data;
  },

  // FPO KYC Management
  approveKyc: async (farmerId) => {
    const response = await api.put(`/fpo/kyc/approve/${farmerId}`);
    return response.data;
  },

  rejectKyc: async (farmerId, rejectionData) => {
    const response = await api.put(`/fpo/kyc/reject/${farmerId}`, {
      reason: rejectionData.reason || 'KYC rejected by FPO'
    });
    return response.data;
  },

  referBackKyc: async (farmerId, referBackData) => {
    const response = await api.put(`/fpo/kyc/refer-back/${farmerId}`, {
      reason: referBackData.reason || 'KYC referred back by FPO'
    });
    return response.data;
  },

  // FPO-specific Farmer Management
  createFPOFarmer: async (fpoId, farmerData) => {
    const response = await api.post(`/fpo/${fpoId}/farmers`, farmerData);
    return response.data;
  },

  // FPO-specific Employee Management  
  createFPOEmployee: async (fpoId, employeeData) => {
    const response = await api.post(`/fpo/${fpoId}/employees`, employeeData);
    return response.data;
  }
};

// FPO Users
export const fpoUsersAPI = {
  list: async (fpoId) => {
    const response = await api.get(`/fpo/${fpoId}/users`);
    return response.data;
  },
  create: async (fpoId, user) => {
    // payload includes email, phone, firstName, lastName, role and password
    const payload = {
      email: user.email,
      phoneNumber: user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role, // admin | employee | farmer | fpo
      password: user.password,
    };
    const response = await api.post(`/fpo/${fpoId}/users`, payload);
    return response.data;
  },
  toggleActive: async (fpoId, userId, active) => {
    const response = await api.put(`/fpo/${fpoId}/users/${userId}/status`, { active });
    return response.data;
  },
  updatePassword: async (fpoId, userId, password) => {
    const response = await api.put(`/fpo/${fpoId}/users/${userId}/password`, { password });
    return response.data;
  },
  // Employee-specific FPO user creation endpoint
  createEmployee: async (fpoId, user) => {
    try {
      // Try employee-specific endpoint first
      const response = await api.post(`/employees/fpo/${fpoId}/users`, {
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        password: user.password,
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // Fallback to regular endpoint if employee endpoint doesn't exist
        const response = await api.post(`/fpo/${fpoId}/users`, {
          email: user.email,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          password: user.password,
        });
    return response.data;
      }
      throw error;
    }
  }
};

// ID Card API calls
export const idCardAPI = {
  // Employee-friendly: get current user's ID cards with multiple fallbacks
  getMyIdCards: async (holderId) => {
    // Prefer holder endpoint first (avoids 404s on dashboards without the self endpoint)
    try {
      const res = await api.get(`/id-cards/holder/${holderId}`);
      return res.data;
    } catch (e1) {
      // Optional: attempt dashboard self endpoint only if older route failed
      try {
        const res = await api.get('/employees/dashboard/my/id-card', {
          // avoid throwing to console by accepting non-2xx as handled
          validateStatus: () => true
        });
        if (res && res.status >= 200 && res.status < 300) return res.data;
      } catch (e0) {
        // ignore
      }
      // Try employee-scoped endpoints that some backends expose
      try {
        const res = await api.get('/employees/id-cards');
        return res.data;
      } catch (e2) {
        try {
          const res = await api.get(`/users/${holderId}/id-cards`);
          return res.data;
        } catch (e3) {
          throw e1; // surface original
        }
      }
    }
  },

  // Employee-friendly: generate card with multiple fallbacks
  generateMyEmployeeIdCard: async (employeeId) => {
    // Preferred: employee dashboard self endpoint
    try {
      const res = await api.post('/employees/dashboard/my/id-card');
      return res.data;
    } catch (e0) {
      // continue to fallbacks
    }
    try {
      const res = await api.post(`/id-cards/generate/employee/${employeeId}`);
      return res.data;
    } catch (e1) {
      try {
        const res = await api.post('/employees/id-cards/generate', { employeeId });
        return res.data;
      } catch (e2) {
        throw e1;
      }
    }
  },
  // Generate ID card for farmer
  generateFarmerIdCard: async (farmerId) => {
    const response = await api.post(`/id-cards/generate/farmer/${farmerId}`);
    return response.data;
  },

  // Generate ID card for employee
  generateEmployeeIdCard: async (employeeId) => {
    const response = await api.post(`/id-cards/generate/employee/${employeeId}`);
    return response.data;
  },

  // Get ID card by card ID
  getIdCard: async (cardId) => {
    const response = await api.get(`/id-cards/${cardId}`);
    return response.data;
  },

  // Get ID cards by holder ID
  getIdCardsByHolder: async (holderId) => {
    const response = await api.get(`/id-cards/holder/${holderId}`);
    return response.data;
  },

  // Get all ID cards with pagination
  getAllIdCards: async (page = 0, size = 10) => {
    const response = await api.get(`/id-cards?page=${page}&size=${size}`);
    return response.data;
  },

  // Get ID cards by type
  getIdCardsByType: async (cardType, page = 0, size = 10) => {
    const response = await api.get(`/id-cards/type/${cardType}?page=${page}&size=${size}`);
    return response.data;
  },

  // Search ID cards
  searchIdCards: async (params) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    const response = await api.get(`/id-cards/search?${queryParams.toString()}`);
    return response.data;
  },

  // Get ID cards by state
  getIdCardsByState: async (state, cardType, page = 0, size = 10) => {
    const response = await api.get(`/id-cards/state/${state}?cardType=${cardType}&page=${page}&size=${size}`);
    return response.data;
  },

  // Get ID cards by district
  getIdCardsByDistrict: async (district, cardType, page = 0, size = 10) => {
    const response = await api.get(`/id-cards/district/${district}?cardType=${cardType}&page=${page}&size=${size}`);
    return response.data;
  },

  // Download ID card PDF
  downloadIdCardPdf: async (cardId) => {
    const response = await api.get(`/id-cards/${cardId}/download/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Download ID card PNG
  downloadIdCardPng: async (cardId) => {
    const response = await api.get(`/id-cards/${cardId}/download/png?t=${Date.now()}` , {
      responseType: 'blob'
    });
    return response.data;
  },

  // Regenerate ID card
  regenerateIdCard: async (cardId) => {
    const response = await api.post(`/id-cards/${cardId}/regenerate`);
    return response.data;
  },

  // Revoke ID card
  revokeIdCard: async (cardId) => {
    const response = await api.post(`/id-cards/${cardId}/revoke`);
    return response.data;
  },

  // Get ID card statistics
  getIdCardStatistics: async () => {
    const response = await api.get('/id-cards/statistics');
    return response.data;
  }
};

// RBAC API calls
export const rbacAPI = {
  // Role Management
  getAllRoles: async () => {
    const response = await api.get('/users-roles-management/roles');
    return response.data;
  },

  getActiveRoles: async () => {
    const response = await api.get('/users-roles-management/roles/active');
    return response.data;
  },

  getRoleById: async (id) => {
    const response = await api.get(`/users-roles-management/roles/${id}`);
    return response.data;
  },

  createRole: async (roleData) => {
    const response = await api.post('/users-roles-management/roles', roleData);
    return response.data;
  },

  updateRole: async (id, roleData) => {
    const response = await api.put(`/users-roles-management/roles/${id}`, roleData);
    return response.data;
  },

  deleteRole: async (id) => {
    const response = await api.delete(`/users-roles-management/roles/${id}`);
    return response.data;
  },

  activateRole: async (id) => {
    const response = await api.post(`/users-roles-management/roles/${id}/activate`);
    return response.data;
  },

  deactivateRole: async (id) => {
    const response = await api.post(`/users-roles-management/roles/${id}/deactivate`);
    return response.data;
  },

  searchRoles: async (searchTerm) => {
    const response = await api.get(`/users-roles-management/roles/search?searchTerm=${searchTerm}`);
    return response.data;
  },
  
  // User Management
  getAllUsers: async () => {
    const response = await api.get('/admin/registration-list');
    return response.data;
  },
  
  // User Role Assignment
  assignRoleToUser: async (assignmentData) => {
    const response = await api.post('/users-roles-management/assign-role', assignmentData);
    return response.data;
  },
  
  // Dashboard Data
  getDashboardData: async () => {
    const response = await api.get('/users-roles-management/dashboard-data');
    return response.data;
  }
};

// Configuration API calls
export const configAPI = {
  // UserRole operations
  getAllUserRoles: async () => {
    const response = await api.get('/config/user-roles');
    return response.data;
  },
  
  getUserRoleById: async (id) => {
    const response = await api.get(`/config/user-roles/${id}`);
    return response.data;
  },
  
  createUserRole: async (roleData) => {
    const response = await api.post('/config/user-roles', roleData);
    return response.data;
  },
  
  updateUserRole: async (id, roleData) => {
    const response = await api.put(`/config/user-roles/${id}`, roleData);
    return response.data;
  },
  
  deleteUserRole: async (id) => {
    const response = await api.delete(`/config/user-roles/${id}`);
    return response.data;
  },
  
  // CodeFormat operations
  getAllCodeFormats: async () => {
    const response = await api.get('/config/code-formats');
    return response.data;
  },
  
  getCodeFormatByType: async (codeType) => {
    const response = await api.get(`/config/code-formats/${codeType}`);
    return response.data;
  },
  
  createCodeFormat: async (formatData) => {
    const response = await api.post('/config/code-formats', formatData);
    return response.data;
  },
  
  updateCodeFormat: async (id, formatData) => {
    const response = await api.put(`/config/code-formats/${id}`, formatData);
    return response.data;
  },
  
  generateNextCode: async (codeType) => {
    const response = await api.post(`/config/code-formats/generate/${codeType}`);
    return response.data;
  },
  
  // Template operations
  getAllTemplates: async () => {
    const response = await api.get('/config/templates');
    return response.data;
  },
  
  getTemplatesByTypeAndModule: async (templateType, moduleType) => {
    const response = await api.get(`/config/templates/${templateType}/${moduleType}`);
    return response.data;
  },
  
  createTemplate: async (templateData) => {
    const response = await api.post('/config/templates', templateData);
    return response.data;
  },
  
  updateTemplate: async (id, templateData) => {
    const response = await api.put(`/config/templates/${id}`, templateData);
    return response.data;
  },
  
  deleteTemplate: async (id) => {
    const response = await api.delete(`/config/templates/${id}`);
    return response.data;
  },
  
  // SystemSetting operations
  getAllSystemSettings: async () => {
    const response = await api.get('/config/settings');
    return response.data;
  },
  
  getSystemSettingsByCategory: async (category) => {
    const response = await api.get(`/config/settings/${category}`);
    return response.data;
  },
  
  getSystemSettingByKey: async (settingKey) => {
    const response = await api.get(`/config/settings/key/${settingKey}`);
    return response.data;
  },
  
  createSystemSetting: async (settingData) => {
    const response = await api.post('/config/settings', settingData);
    return response.data;
  },
  
  updateSystemSetting: async (id, settingData) => {
    const response = await api.put(`/config/settings/${id}`, settingData);
    return response.data;
  },
  
  deleteSystemSetting: async (id) => {
    const response = await api.delete(`/config/settings/${id}`);
    return response.data;
  },
  
  // SystemPreference operations
  getAllSystemPreferences: async () => {
    const response = await api.get('/config/preferences');
    return response.data;
  },
  
  getSystemPreferencesByType: async (preferenceType) => {
    const response = await api.get(`/config/preferences/${preferenceType}`);
    return response.data;
  },
  
  getSystemPreferenceByKey: async (preferenceKey) => {
    const response = await api.get(`/config/preferences/key/${preferenceKey}`);
    return response.data;
  },
  
  createSystemPreference: async (preferenceData) => {
    const response = await api.post('/config/preferences', preferenceData);
    return response.data;
  },
  
  updateSystemPreference: async (id, preferenceData) => {
    const response = await api.put(`/config/preferences/${id}`, preferenceData);
    return response.data;
  },
  
  deleteSystemPreference: async (id) => {
    const response = await api.delete(`/config/preferences/${id}`);
    return response.data;
  },

  // Country Settings operations
  getAllCountries: async () => {
    const response = await api.get('/country-settings/countries');
    return response.data;
  },

  getStatesByCountryId: async (countryId) => {
    const response = await api.get(`/country-settings/states/${countryId}`);
    return response.data;
  },

  getDistrictsByStateId: async (stateId) => {
    const response = await api.get(`/country-settings/districts/${stateId}`);
    return response.data;
  },

  getBlocksByDistrictId: async (districtId) => {
    const response = await api.get(`/country-settings/blocks/${districtId}`);
    return response.data;
  },

  getVillagesByBlockId: async (blockId) => {
    const response = await api.get(`/country-settings/villages/${blockId}`);
    return response.data;
  },

  getZipcodesByVillageId: async (villageId) => {
    const response = await api.get(`/country-settings/zipcodes/${villageId}`);
    return response.data;
  },

  searchZipcodeWithHierarchy: async (code) => {
    const response = await api.get(`/country-settings/zipcodes/search/${code}`);
    return response.data;
  },

  // CRUD operations for Country Settings
  createCountry: async (countryData) => {
    const response = await api.post('/country-settings/country', countryData);
    return response.data;
  },

  createState: async (stateData) => {
    const response = await api.post('/country-settings/state', stateData);
    return response.data;
  },

  createDistrict: async (districtData) => {
    const response = await api.post('/country-settings/district', districtData);
    return response.data;
  },

  createBlock: async (blockData) => {
    const response = await api.post('/country-settings/block', blockData);
    return response.data;
  },

  createVillage: async (villageData) => {
    const response = await api.post('/country-settings/village', villageData);
    return response.data;
  },

  createZipcode: async (zipcodeData) => {
    const response = await api.post('/country-settings/zipcode', zipcodeData);
    return response.data;
  },

  // Global Area Settings operations
  getAgeSettings: async () => {
    const response = await api.get('/config/global-area/age');
    return response.data;
  },
  
  createAgeSetting: async (ageSettingData) => {
    const response = await api.post('/config/global-area/age', ageSettingData);
    return response.data;
  },
  
  validateAge: async (age, userType) => {
    const response = await api.get(`/config/validate-age?age=${age}&userType=${userType}`);
    return response.data;
  },

  getEducationTypes: async () => {
    const response = await api.get('/config/global-area/education');
    return response.data;
  },

  getEducationCategories: async () => {
    const response = await api.get('/config/global-area/education-categories');
    return response.data;
  },

  createGlobalAreaSetting: async (settingData) => {
    const response = await api.post('/config/global-area', settingData);
    return response.data;
  },

  updateGlobalAreaSetting: async (id, settingData) => {
    const response = await api.put(`/config/global-area/${id}`, settingData);
    return response.data;
  },

  deleteGlobalAreaSetting: async (id) => {
    const response = await api.delete(`/config/global-area/${id}`);
    return response.data;
  },

  // Crop Settings operations
  getCropNames: async () => {
    const response = await api.get('/config/crop/names');
    return response.data;
  },

  getCropTypes: async () => {
    const response = await api.get('/config/crop/types');
    return response.data;
  },

  createCropSetting: async (cropData) => {
    const response = await api.post('/config/crop', cropData);
    return response.data;
  },

  updateCropSetting: async (id, cropData) => {
    const response = await api.put(`/config/crop/${id}`, cropData);
    return response.data;
  },

  deleteCropSetting: async (id) => {
    const response = await api.delete(`/config/crop/${id}`);
    return response.data;
  },

  // Pincode API for auto-fill functionality
  getAddressByPincode: async (pincode) => {
    const response = await api.get(`/config/address/pincode/${pincode}`);
    return response.data;
  },

  // Test endpoint to verify API integration
  testCountries: async () => {
    const response = await api.get('/config/test/countries');
    return response.data;
  },

  // Check email availability
  checkEmailAvailability: async (email) => {
    try {
      const response = await api.post('/auth/check-email', { email });
      return response.data;
    } catch (error) {
      // If email exists, backend might return 409 or 400
      if (error.response?.status === 409 || error.response?.status === 400) {
        return { available: false, message: 'Email is already registered' };
      }
      throw error;
    }
  }
};

export default api; 