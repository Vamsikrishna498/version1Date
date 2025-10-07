import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import UserProfileDropdown from '../components/UserProfileDropdown';
import MyIdCard from '../components/MyIdCard';
import { apiService } from '../api/apiService';
import '../styles/Dashboard.css';

const FarmerDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [farmerData, setFarmerData] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const toggleUserDropdown = () => {
    setShowUserDropdown(prev => !prev);
  };

  const handleChangePassword = () => {
    navigate('/change-password-dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    // Check if user needs to change password
    if (user?.forcePasswordChange) {
      navigate('/change-password');
      return;
    }

    // Load farmer data
    loadFarmerData();
  }, [user, navigate]);

  const loadFarmerData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to load farmer data from API
      try {
        const response = await apiService.getFarmerDashboardData(user?.email);
        setFarmerData(response);
        return;
      } catch (apiError) {
        console.warn('API call failed, using fallback data:', apiError);
      }
      
      // Fallback: Try to get farmer data by email from a different endpoint
      try {
        const farmers = await apiService.getAllFarmers({ email: user?.email });
        if (farmers && farmers.length > 0) {
          const farmer = farmers[0];
          setFarmerData({
            name: farmer.name || user?.name || 'Farmer Name',
            email: farmer.email || user?.email || user?.userName || 'farmer@example.com',
            phoneNumber: farmer.phoneNumber || user?.phoneNumber || 'Not provided',
            kycStatus: farmer.kycStatus || 'PENDING',
            registrationDate: farmer.createdAt ? new Date(farmer.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
            totalCrops: farmer.totalCrops || 0,
            pendingDocuments: farmer.pendingDocuments || 0,
            district: farmer.district || 'Not specified',
            state: farmer.state || 'Not specified',
            region: farmer.region || 'Not specified'
          });
          return;
        }
      } catch (fallbackError) {
        console.warn('Fallback API call also failed:', fallbackError);
      }
      
      // Final fallback: Use user data from context
      setFarmerData({
        name: user?.name || 'Farmer Name',
        email: user?.email || user?.userName || 'farmer@example.com',
        phoneNumber: user?.phoneNumber || 'Not provided',
        kycStatus: user?.kycStatus || 'PENDING',
        registrationDate: new Date().toLocaleDateString(),
        totalCrops: 0,
        pendingDocuments: 0,
        district: user?.district || 'Not specified',
        state: user?.state || 'Not specified',
        region: user?.region || 'Not specified'
      });
      
    } catch (error) {
      console.error('Error loading farmer data:', error);
      setError('Failed to load farmer data');
      
      // Even if everything fails, show basic user data
      setFarmerData({
        name: user?.name || 'Farmer Name',
        email: user?.email || user?.userName || 'farmer@example.com',
        phoneNumber: user?.phoneNumber || 'Not provided',
        kycStatus: 'PENDING',
        registrationDate: new Date().toLocaleDateString(),
        totalCrops: 0,
        pendingDocuments: 0,
        district: 'Not specified',
        state: 'Not specified',
        region: 'Not specified'
      });
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading farmer dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !farmerData) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <h1 className="logo-title">DATE</h1>
            <p className="logo-subtitle">Digital Agristack</p>
          </div>
        </div>
        <div className="header-right">
          <div className="user-profile-dropdown">
            <div className="user-profile-trigger" onClick={toggleUserDropdown}>
              <div className="user-avatar">
                {(() => {
                  const resolvedPhoto = farmerData?.photoFileName || (typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('farmerProfile') || '{}').photoFileName || localStorage.getItem('farmerPhotoFileName') || user?.photoFileName) : null);
                  return resolvedPhoto ? (
                    <img 
                      src={`http://localhost:8080/uploads/photos/${resolvedPhoto}`}
                      alt="avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    (user?.name || 'F')?.charAt(0)
                  );
                })()}
              </div>
              <span className="user-email">{user?.email || 'farmer@example.com'}</span>
              <i className={`fas fa-chevron-down dropdown-arrow ${showUserDropdown ? 'rotated' : ''}`}></i>
            </div>
            <div className={`user-dropdown-menu ${showUserDropdown ? 'show' : ''}`}>
              <div className="dropdown-header">
                <div className="user-avatar-large">
                  {(() => {
                    const resolvedPhoto = farmerData?.photoFileName || (typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('farmerProfile') || '{}').photoFileName || localStorage.getItem('farmerPhotoFileName') || user?.photoFileName) : null);
                    return resolvedPhoto ? (
                      <img 
                        src={`http://localhost:8080/uploads/photos/${resolvedPhoto}`}
                        alt="avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      (user?.name || 'F')?.charAt(0)
                    );
                  })()}
                </div>
                <div className="user-details">
                  <div className="user-name-large">{user?.name || 'Farmer'}</div>
                  <div className="user-email">{user?.email || 'farmer@example.com'}</div>
                  {(() => {
                    try {
                      const cache = localStorage.getItem('farmerUniqueIds');
                      const map = cache ? JSON.parse(cache) : {};
                      const idToShow = map ? map[String(farmerData?.id)] : null;
                      return idToShow ? (
                        <div className="user-email" style={{ fontWeight: 700 }}>ID: {idToShow}</div>
                      ) : null;
                    } catch (_) {
                      return null;
                    }
                  })()}
                </div>
              </div>
              <div className="dropdown-actions">
                <button className="dropdown-action-btn" onClick={handleChangePassword}>
                  <i className="fas fa-key"></i>
                  Change Password
                </button>
                <button className="dropdown-action-btn logout" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Toggle Button */}
        <button 
          className="sidebar-toggle-btn" 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <span className="material-symbols-outlined">
            {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>

        <div className="sidebar-header">
          <h2 className="sidebar-welcome">Welcome!!!</h2>
          <p className="sidebar-role">FARMER</p>
        </div>
        
        <div className="sidebar-nav">
          <div 
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
            title="Dashboard Overview"
          >
            <i className="fas fa-tachometer-alt"></i>
            <span className="nav-text">Dashboard Overview</span>
          </div>
          
          <div 
            className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
            title="My Profile"
          >
            <i className="fas fa-user"></i>
            <span className="nav-text">My Profile</span>
          </div>
          
          <div 
            className={`nav-item ${activeSection === 'crops' ? 'active' : ''}`}
            onClick={() => setActiveSection('crops')}
            title="My Crops"
          >
            <i className="fas fa-seedling"></i>
            <span className="nav-text">My Crops</span>
          </div>
          
          <div 
            className={`nav-item ${activeSection === 'kyc' ? 'active' : ''}`}
            onClick={() => setActiveSection('kyc')}
            title="KYC Status"
          >
            <i className="fas fa-clipboard-check"></i>
            <span className="nav-text">KYC Status</span>
          </div>
          
          <div 
            className={`nav-item ${activeSection === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveSection('documents')}
            title="Documents"
          >
            <i className="fas fa-file-alt"></i>
            <span className="nav-text">Documents</span>
          </div>
          
          <div 
            className={`nav-item ${activeSection === 'benefits' ? 'active' : ''}`}
            onClick={() => setActiveSection('benefits')}
            title="Benefits"
          >
            <i className="fas fa-gift"></i>
            <span className="nav-text">Benefits</span>
          </div>
          
          <div 
            className={`nav-item ${activeSection === 'id-card' ? 'active' : ''}`}
            onClick={() => setActiveSection('id-card')}
            title="My ID Card"
          >
            <i className="fas fa-id-card"></i>
            <span className="nav-text">My ID Card</span>
          </div>
          
          <div 
            className={`nav-item ${activeSection === 'support' ? 'active' : ''}`}
            onClick={() => setActiveSection('support')}
            title="Support"
          >
            <i className="fas fa-headset"></i>
            <span className="nav-text">Support</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Dashboard Content */}
        <div className="dashboard-content">
          {activeSection === 'overview' && (
            <>
              {/* Greeting Banner */}
              <div className="greeting-banner">
                <div className="greeting-left">
                  <div className="greeting-title">{getGreeting()}, {user?.name || 'Farmer'}! 👋</div>
                  <div className="greeting-subtitle">Welcome to your agricultural dashboard. Manage your profile, crops, and track your KYC status.</div>
                </div>
                <div className="greeting-right">
                  <span className="greeting-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
              
              {/* Welcome Section */}
              <div className="welcome-section">
                <h1 className="welcome-title">Farmer Dashboard</h1>
                <p className="welcome-subtitle">
                  Manage your agricultural profile, track KYC status, and access benefits. 
                  Your digital farming journey starts here.
                </p>
                {error && (
                  <div className="error-notice">
                    <p className="error-text">⚠️ Some data may not be up to date</p>
                    <button className="retry-btn" onClick={loadFarmerData}>🔄 Refresh Data</button>
                  </div>
                )}
              </div>
              
              {/* Overview Section */}
              <div className="farmer-overview-section">
                <div className="farmer-section-header">
                  <h3 className="farmer-section-title">Dashboard Overview</h3>
                  <p className="section-description">
                    Overview of your agricultural profile and current status.
                  </p>
                </div>
                
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">🌾</div>
                    <div className="stat-content">
                      <h3>Total Crops</h3>
                      <p className="stat-number">{farmerData?.totalCrops || 0}</p>
                      <p className="stat-label">Registered crops</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                      <h3>KYC Status</h3>
                      <p className={`stat-number status-${farmerData?.kycStatus?.toLowerCase()}`}>
                        {farmerData?.kycStatus || 'PENDING'}
                      </p>
                      <p className="stat-label">Verification status</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">📄</div>
                    <div className="stat-content">
                      <h3>Pending Documents</h3>
                      <p className="stat-number">{farmerData?.pendingDocuments || 0}</p>
                      <p className="stat-label">Documents to upload</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                      <h3>Benefits Received</h3>
                      <p className="stat-number">₹{farmerData?.totalBenefitsReceived || 0}</p>
                      <p className="stat-label">This month</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Section */}
              <div className="farmer-overview-section">
                <div className="farmer-section-header">
                  <h3 className="farmer-section-title">Quick Actions</h3>
                  <p className="section-description">
                    Access frequently used functions to manage your profile and documents.
                  </p>
                </div>
                
                <div className="actions-grid">
                  <button className="action-btn" onClick={() => setActiveSection('profile')}>
                    <span className="action-icon">📝</span>
                    <span>Update Profile</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveSection('crops')}>
                    <span className="action-icon">🌾</span>
                    <span>Add New Crop</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveSection('documents')}>
                    <span className="action-icon">📄</span>
                    <span>Upload Documents</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveSection('support')}>
                    <span className="action-icon">📞</span>
                    <span>Contact Support</span>
                  </button>
                </div>
              </div>

              {/* Recent Activity Section */}
              <div className="farmer-overview-section">
                <div className="farmer-section-header">
                  <h3 className="farmer-section-title">Recent Activity</h3>
                  <p className="section-description">
                    Track your recent activities and updates.
                  </p>
                </div>
                
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon">✅</div>
                    <div className="activity-content">
                      <h4>Profile Updated</h4>
                      <p>Your profile information was updated successfully</p>
                      <span className="activity-time">2 hours ago</span>
                    </div>
                  </div>
                  
                  <div className="activity-item">
                    <div className="activity-icon">📋</div>
                    <div className="activity-content">
                      <h4>KYC Verification</h4>
                      <p>Your KYC documents are under review</p>
                      <span className="activity-time">1 day ago</span>
                    </div>
                  </div>
                  
                  <div className="activity-item">
                    <div className="activity-icon">🌾</div>
                    <div className="activity-content">
                      <h4>Crop Registration</h4>
                      <p>Wheat crop registered successfully</p>
                      <span className="activity-time">3 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'profile' && (
            <div className="farmer-overview-section">
              <div className="farmer-section-header">
                <h3 className="farmer-section-title">My Profile</h3>
                <p className="section-description">
                  View and manage your personal information and details.
                </p>
              </div>
              <div className="profile-grid">
                <div className="profile-card">
                  <h3>Personal Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Full Name:</label>
                      <span>{farmerData?.fullName || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Date of Birth:</label>
                      <span>{farmerData?.dateOfBirth || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Gender:</label>
                      <span>{farmerData?.gender || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Father's Name:</label>
                      <span>{farmerData?.fatherName || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Contact Number:</label>
                      <span>{farmerData?.contactNumber || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Alternative Contact:</label>
                      <span>{farmerData?.alternativeContactNumber || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Nationality:</label>
                      <span>{farmerData?.nationality || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-card">
                  <h3>Address Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Country:</label>
                      <span>{farmerData?.country || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>State:</label>
                      <span>{farmerData?.state || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>District:</label>
                      <span>{farmerData?.district || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Block:</label>
                      <span>{farmerData?.block || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Village:</label>
                      <span>{farmerData?.village || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Pincode:</label>
                      <span>{farmerData?.pincode || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-card">
                  <h3>Professional Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Education:</label>
                      <span>{farmerData?.education || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Experience:</label>
                      <span>{farmerData?.experience || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-card">
                  <h3>Bank Details</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Bank Name:</label>
                      <span>{farmerData?.bankName || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Account Number:</label>
                      <span>{farmerData?.accountNumber || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Branch Name:</label>
                      <span>{farmerData?.branchName || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>IFSC Code:</label>
                      <span>{farmerData?.ifscCode || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* ID Card Section */}
              <div className="profile-card" style={{ marginTop: '20px' }}>
                <h3>🆔 My ID Card</h3>
                <MyIdCard userId={farmerData?.id} userType="FARMER" />
              </div>
            </div>
          )}

          {activeSection === 'kyc' && (
            <div className="farmer-overview-section">
              <div className="farmer-section-header">
                <h3 className="farmer-section-title">KYC Status & Assignment</h3>
                <p className="section-description">
                  Track your KYC verification status and assigned employee details.
                </p>
              </div>
              <div className="kyc-grid">
                <div className="kyc-card">
                  <h3>KYC Status</h3>
                  <div className={`kyc-status ${farmerData?.kycStatus?.toLowerCase()}`}>
                    <span className="status-badge">{farmerData?.kycStatus || 'PENDING'}</span>
                  </div>
                  <div className="kyc-details">
                    <div className="detail-item">
                      <label>Submitted Date:</label>
                      <span>{farmerData?.kycSubmittedDate || 'Not submitted'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Reviewed Date:</label>
                      <span>{farmerData?.kycReviewedDate || 'Not reviewed'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Reviewed By:</label>
                      <span>{farmerData?.kycReviewedBy || 'Not assigned'}</span>
                    </div>
                    {farmerData?.kycRejectionReason && (
                      <div className="detail-item">
                        <label>Rejection Reason:</label>
                        <span className="error-text">{farmerData.kycRejectionReason}</span>
                      </div>
                    )}
                    {farmerData?.kycReferBackReason && (
                      <div className="detail-item">
                        <label>Refer Back Reason:</label>
                        <span className="warning-text">{farmerData.kycReferBackReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="kyc-card">
                  <h3>Assigned Employee</h3>
                  {farmerData?.assignedEmployee ? (
                    <div className="employee-info">
                      <div className="employee-avatar">
                        <span>👤</span>
                      </div>
                      <div className="employee-details">
                        <h4>{farmerData.assignedEmployee.employeeName}</h4>
                        <p><strong>Email:</strong> {farmerData.assignedEmployee.employeeEmail}</p>
                        <p><strong>Contact:</strong> {farmerData.assignedEmployee.employeeContactNumber}</p>
                        <p><strong>Designation:</strong> {farmerData.assignedEmployee.employeeDesignation}</p>
                        <p><strong>Assignment Status:</strong> 
                          <span className={`status-badge ${farmerData.assignedEmployee.assignmentStatus.toLowerCase()}`}>
                            {farmerData.assignedEmployee.assignmentStatus}
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="no-assignment">
                      <p>No employee assigned yet</p>
                      <p className="small-text">An employee will be assigned for your KYC verification process</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'crops' && (
            <div className="farmer-overview-section">
              <div className="farmer-section-header">
                <h3 className="farmer-section-title">My Crops</h3>
                <p className="section-description">
                  View your current and proposed crop information.
                </p>
              </div>
              <div className="crops-grid">
                <div className="crop-card">
                  <h3>Current Crop</h3>
                  <div className="crop-info">
                    <div className="info-item">
                      <label>Crop:</label>
                      <span>{farmerData?.currentCrop || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Survey Number:</label>
                      <span>{farmerData?.currentSurveyNumber || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Land Holding:</label>
                      <span>{farmerData?.currentLandHolding ? `${farmerData.currentLandHolding} acres` : 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Net Income:</label>
                      <span>{farmerData?.currentNetIncome ? `₹${farmerData.currentNetIncome}` : 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Soil Test:</label>
                      <span>{farmerData?.currentSoilTest ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="info-item">
                      <label>Water Source:</label>
                      <span>{farmerData?.currentWaterSource || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                <div className="crop-card">
                  <h3>Proposed Crop</h3>
                  <div className="crop-info">
                    <div className="info-item">
                      <label>Crop:</label>
                      <span>{farmerData?.proposedCrop || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Survey Number:</label>
                      <span>{farmerData?.proposedSurveyNumber || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Land Holding:</label>
                      <span>{farmerData?.proposedLandHolding ? `${farmerData.proposedLandHolding} acres` : 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Expected Income:</label>
                      <span>{farmerData?.proposedNetIncome ? `₹${farmerData.proposedNetIncome}` : 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <label>Soil Test:</label>
                      <span>{farmerData?.proposedSoilTest ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="info-item">
                      <label>Water Source:</label>
                      <span>{farmerData?.proposedWaterSource || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'documents' && (
            <div className="farmer-overview-section">
              <div className="farmer-section-header">
                <h3 className="farmer-section-title">My Documents</h3>
                <p className="section-description">
                  View and manage your uploaded documents and certificates.
                </p>
              </div>
              <div className="documents-grid">
                <div className="document-card">
                  <h3>Uploaded Documents</h3>
                  <div className="document-list">
                    <div className="document-item">
                      <span className="doc-icon">📷</span>
                      <div className="doc-info">
                        <h4>Profile Photo</h4>
                        <p>{farmerData?.photoFileName || 'Not uploaded'}</p>
                      </div>
                    </div>
                    <div className="document-item">
                      <span className="doc-icon">🏦</span>
                      <div className="doc-info">
                        <h4>Bank Passbook</h4>
                        <p>{farmerData?.passbookFileName || 'Not uploaded'}</p>
                      </div>
                    </div>
                    <div className="document-item">
                      <span className="doc-icon">🆔</span>
                      <div className="doc-info">
                        <h4>Identity Document</h4>
                        <p>{farmerData?.documentFileName || 'Not uploaded'}</p>
                      </div>
                    </div>
                    <div className="document-item">
                      <span className="doc-icon">🧪</span>
                      <div className="doc-info">
                        <h4>Soil Test Certificate</h4>
                        <p>{farmerData?.soilTestCertificateFileName || 'Not uploaded'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'benefits' && (
            <div className="farmer-overview-section">
              <div className="farmer-section-header">
                <h3 className="farmer-section-title">Benefits & Support</h3>
                <p className="section-description">
                  View your received benefits and available support options.
                </p>
              </div>
              <div className="benefits-grid">
                <div className="benefit-card">
                  <h3>Benefits Received</h3>
                  <div className="benefit-summary">
                    <div className="benefit-item">
                      <span className="benefit-amount">₹{farmerData?.totalBenefitsReceived || 0}</span>
                      <span className="benefit-label">Total Benefits</span>
                    </div>
                  </div>
                  <p className="benefit-note">Benefits are calculated based on your crop registrations and government schemes</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'id-card' && (
            <div className="farmer-overview-section">
              <div className="farmer-section-header">
                <h3 className="farmer-section-title">My ID Card</h3>
                <p className="section-description">
                  View and download your farmer ID card.
                </p>
              </div>
              <div className="profile-card">
                <MyIdCard userId={farmerData?.id} userType="FARMER" />
              </div>
            </div>
          )}

          {activeSection === 'support' && (
            <div className="farmer-overview-section">
              <div className="farmer-section-header">
                <h3 className="farmer-section-title">Support & Contact</h3>
                <p className="section-description">
                  Get help and contact information for support.
                </p>
              </div>
              <div className="support-grid">
                <div className="support-card">
                  <h3>Contact Information</h3>
                  <div className="contact-info">
                    <div className="contact-item">
                      <span className="contact-icon">📞</span>
                      <div className="contact-details">
                        <h4>Helpline</h4>
                        <p>1800-XXX-XXXX</p>
                      </div>
                    </div>
                    <div className="contact-item">
                      <span className="contact-icon">📧</span>
                      <div className="contact-details">
                        <h4>Email Support</h4>
                        <p>support@farmerportal.com</p>
                      </div>
                    </div>
                    <div className="contact-item">
                      <span className="contact-icon">💬</span>
                      <div className="contact-details">
                        <h4>Live Chat</h4>
                        <p>Available 24/7</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard; 