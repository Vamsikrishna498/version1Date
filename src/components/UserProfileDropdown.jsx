import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import '../styles/UserProfile.css';
 
const UserProfileDropdown = ({ variant = 'default', onShowChangePassword, onShowChangeUserId }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const dropdownRef = useRef(null);
  
  // Photo upload state
  const [userPhoto, setUserPhoto] = useState(null);
  const fileInputRef = useRef(null);
 
  // Handle change password navigation
  const handleChangePassword = () => {
    setIsOpen(false);
    // Use the universal route configured in App.js
    navigate('/change-password');
  };

  // Handle change user ID navigation
  const handleChangeUserId = () => {
    setIsOpen(false);
    // Use the universal route configured in App.js
    navigate('/change-userid');
  };

  // Notifications state
  const [notifications] = useState([
    { id: 1, type: 'info', message: 'New farmer registration pending approval', time: '2 minutes ago' },
    { id: 2, type: 'warning', message: 'KYC verification overdue for 3 farmers', time: '1 hour ago' },
    { id: 3, type: 'success', message: 'Employee assignment completed successfully', time: '3 hours ago' }
  ]);
  
  // Notification state for change password
  const [notification, setNotification] = useState(null);

  // Load saved photo on component mount per-role key
  useEffect(() => {
    const roleKey = (user?.role || '').toUpperCase() || 'GENERIC';
    const savedPhoto = localStorage.getItem(`userProfilePhoto:${roleKey}`);
    if (savedPhoto) setUserPhoto(savedPhoto);
  }, [user?.role]);

  // Photo upload handlers
  const handlePhotoUpload = (event) => {
    console.log('Photo upload triggered:', event);
    const file = event.target.files[0];
    console.log('Selected file:', file);
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB.');
        return;
      }

      console.log('File validation passed, reading file...');
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target.result;
        console.log('Photo data loaded:', photoData.substring(0, 50) + '...');
        setUserPhoto(photoData);
        try {
          const roleKey = (user?.role || '').toUpperCase() || 'GENERIC';
          localStorage.setItem(`userProfilePhoto:${roleKey}`, photoData);
        } catch {}
        console.log('Photo saved to localStorage and state');
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('Error reading the file. Please try again.');
      };
      reader.readAsDataURL(file);
    } else {
      console.log('No file selected');
    }
  };

  const handlePhotoClick = () => {
    console.log('Photo click triggered');
    console.log('fileInputRef.current:', fileInputRef.current);
    if (fileInputRef.current) {
      fileInputRef.current.click();
      console.log('File input clicked');
    } else {
      console.error('File input ref is null');
    }
  };

  const handleRemovePhoto = () => {
    setUserPhoto(null);
    try {
      const roleKey = (user?.role || '').toUpperCase() || 'GENERIC';
      localStorage.removeItem(`userProfilePhoto:${roleKey}`);
    } catch {}
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
 
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
 
  // Handle logout
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };
 
  
 
  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
 
  // Get display name based on user role and available data
  const getDisplayName = () => {
    if (user?.name) {
      return user.name;
    }
   
    if (user?.userName) {
      const role = user.role || 'USER';
      switch (role) {
        case 'ADMIN':
          return 'Admin User';
        case 'SUPER_ADMIN':
          return 'Super Admin User';
        case 'EMPLOYEE':
          return 'Employee User';
        case 'FARMER':
          return 'Farmer User';
        default:
          return user.userName;
      }
    }
   
    return 'User';
  };
 
  // Get display role
  const getDisplayRole = () => {
    if (user?.role) {
      return user.role.replace('_', ' ');
    }
    return 'USER';
  };
 
  // Get avatar initials
  const getAvatarInitials = () => {
    const displayName = getDisplayName();
    return getInitials(displayName);
  };

  // Render avatar with photo or initials
  const renderAvatar = (className, size = 'large') => {
    console.log('renderAvatar called with:', { className, size, userPhoto: !!userPhoto });
    
    if (userPhoto) {
      return (
        <div className={`${className} user-avatar-with-photo`} onClick={handlePhotoClick}>
          <img 
            src={userPhoto} 
            alt="Profile" 
            className="user-avatar-photo"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
          <div className="avatar-upload-overlay">
            <i className="fas fa-camera"></i>
          </div>
        </div>
      );
    } else {
      return (
        <div className={`${className} user-avatar-with-upload`} onClick={handlePhotoClick}>
          <div className="user-avatar-initials">{getAvatarInitials()}</div>
          <div className="avatar-upload-overlay">
            <i className="fas fa-camera"></i>
          </div>
        </div>
      );
    }
  };
 
  // Get user status (online/offline)
  const getUserStatus = () => {
    return 'online'; // You can implement real status logic here
  };
 
  // Get user email
  const getUserEmail = () => {
    return user?.email || `${user?.userName || 'user'}@date.com`;
  };
 
    // Render compact variant (for mobile or minimal header)
  if (variant === 'compact') {
    return (
      <div className="user-profile-dropdown-component compact" ref={dropdownRef}>
        <div
          className="user-profile-dropdown-trigger compact"
          onClick={() => setIsOpen(!isOpen)}
          title="User Menu"
        >
          {renderAvatar('user-profile-dropdown-avatar-compact')}
          <i className={`fas fa-chevron-down user-profile-dropdown-arrow ${isOpen ? 'rotated' : ''}`}></i>
        </div>

        {isOpen && (
          <div className="user-profile-dropdown-menu compact show">
            <div className="user-profile-dropdown-header">
              {renderAvatar('user-profile-dropdown-avatar-large')}
              <div className="user-profile-dropdown-details">
                <span className="user-profile-dropdown-name-large">{getDisplayName()}</span>
                <span className="user-profile-dropdown-role">{getDisplayRole()}</span>
                <span className="user-profile-dropdown-email">{getUserEmail()}</span>
              </div>
            </div>
           
            <div className="user-profile-dropdown-actions">
              <button
                className="user-profile-dropdown-action-btn"
                onClick={handleChangePassword}
              >
                <i className="fas fa-key"></i>
                Change Password
              </button>
             
              <button
                className="user-profile-dropdown-action-btn"
                onClick={handleChangeUserId}
              >
                <i className="fas fa-user-edit"></i>
                Change User ID
              </button>
             
              <button
                className="user-profile-dropdown-action-btn logout"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
 
  // Render enhanced variant (for desktop with full user info)
  if (variant === 'enhanced') {
    return (
      <div className="user-profile-dropdown enhanced" ref={dropdownRef}>
        <div className="enhanced-user-header">
          <div className="user-profile-section">
            <div className="user-profile-info">
              <div className="user-avatar-container">
                {renderAvatar('user-avatar-large')}
                <div className={`user-status-indicator ${getUserStatus()}`}></div>
              </div>
              <div className="user-details">
                <span className="user-name-display">{getDisplayName()}</span>
                <span className="user-role-display">{getDisplayRole()}</span>
                <span className="user-email-display">{getUserEmail()}</span>
              </div>
            </div>
            <div className="user-actions">
              <button
                className="header-action-btn"
                title="Notifications"
                onClick={() => setShowNotifications(true)}
              >
                <i className="fas fa-bell"></i>
                <span className="notification-badge">{notifications.length}</span>
              </button>
              <button
                className="header-action-btn"
                title="Settings"
                onClick={() => setShowSettings(true)}
              >
                <i className="fas fa-cog"></i>
              </button>
              <button
                className="header-action-btn"
                title="Help"
                onClick={() => setShowHelp(true)}
              >
                <i className="fas fa-question-circle"></i>
              </button>
            </div>
          </div>
         
          <div
            className="user-profile-trigger"
            onClick={() => setIsOpen(!isOpen)}
            title="User Menu"
          >
            <i className={`fas fa-chevron-down dropdown-arrow ${isOpen ? 'rotated' : ''}`}></i>
          </div>
        </div>
 
        {isOpen && (
          <div className="user-dropdown-menu enhanced show">
            <div className="dropdown-header">
              {renderAvatar('user-avatar-large')}
              <div className="user-details">
                <span className="user-name-large">{getDisplayName()}</span>
                <span className="user-role">{getDisplayRole()}</span>
                <span className="user-email">{getUserEmail()}</span>
              </div>
            </div>
           
            <div className="dropdown-actions">
              <button
                className="dropdown-action-btn"
                onClick={handleChangePassword}
              >
                <i className="fas fa-key"></i>
                Change Password
              </button>
             
              <button
                className="dropdown-action-btn"
                onClick={handleChangeUserId}
              >
                <i className="fas fa-user-edit"></i>
                Change User ID
              </button>
             
              <button
                className="dropdown-action-btn"
                onClick={() => setShowSettings(true)}
              >
                <i className="fas fa-cog"></i>
                Settings
              </button>
             
              <button
                className="dropdown-action-btn"
                onClick={() => setShowHelp(true)}
              >
                <i className="fas fa-question-circle"></i>
                Help & Support
              </button>
             
              <button
                className="dropdown-action-btn logout"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
 
 
  // Render default variant (standard dropdown)
  return (
    <div className="user-profile-dropdown" ref={dropdownRef}>
      
      <div
        className="user-profile-trigger"
        onClick={() => {
          console.log('UserProfileDropdown clicked, current isOpen:', isOpen);
          setIsOpen(!isOpen);
        }}
      >
        {renderAvatar('user-avatar')}
        <div className="user-info">
          <span className="user-name">{getDisplayName()}</span>
          <span className="user-role">{getDisplayRole()}</span>
        </div>
        <i className={`fas fa-chevron-down dropdown-arrow ${isOpen ? 'rotated' : ''}`}></i>
      </div>
 
      {isOpen && (
        <div className="user-dropdown-menu show">
          <div className="dropdown-header">
            {renderAvatar('user-avatar-large')}
            <div className="user-details">
              <span className="user-name-large">{getDisplayName()}</span>
              <span className="user-role">{getDisplayRole()}</span>
              <span className="user-email">{getUserEmail()}</span>
            </div>
          </div>
         
          <div className="dropdown-actions">
            <button
              className="dropdown-action-btn"
              onClick={() => {
                console.log('Upload photo button clicked');
                handlePhotoClick();
              }}
            >
              <i className="fas fa-camera"></i>
              {userPhoto ? 'Change Photo' : 'Upload Photo'}
            </button>
           
            {userPhoto && (
              <button
                className="dropdown-action-btn"
                onClick={handleRemovePhoto}
              >
                <i className="fas fa-trash"></i>
                Remove Photo
              </button>
            )}
           
            <button
              className="dropdown-action-btn"
              onClick={handleChangePassword}
            >
              <i className="fas fa-key"></i>
              Change Password
            </button>
           
            <button
              className="dropdown-action-btn"
              onClick={handleChangeUserId}
            >
              <i className="fas fa-user-edit"></i>
              Change User ID
            </button>
           
            <button
              className="dropdown-action-btn logout"
              onClick={handleLogout}
            >
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>
      )}
 
      {/* Notifications Modal */}
      {showNotifications && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Notifications</h3>
              <button
                className="modal-close"
                onClick={() => setShowNotifications(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
           
            <div className="notifications-list">
              {notifications.map(notification => (
                <div key={notification.id} className={`notification-item ${notification.type}`}>
                  <div className="notification-icon">
                    <i className={`fas fa-${notification.type === 'info' ? 'info-circle' : notification.type === 'warning' ? 'exclamation-triangle' : 'check-circle'}`}></i>
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">{notification.time}</span>
                  </div>
                </div>
              ))}
            </div>
           
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowNotifications(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Settings</h3>
              <button
                className="modal-close"
                onClick={() => setShowSettings(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
           
            <div className="settings-content">
              <p>Settings functionality coming soon!</p>
            </div>
           
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowSettings(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Help Modal */}
      {showHelp && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Help & Support</h3>
              <button
                className="modal-close"
                onClick={() => setShowHelp(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
           
            <div className="help-content">
              <p>Help and support functionality coming soon!</p>
            </div>
           
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowHelp(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Success Notification Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          <div className="notification-toast-content">
            <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : 'info-circle'}`}></i>
            <span>{notification.message}</span>
          </div>
          <button
            className="notification-toast-close"
            onClick={() => setNotification(null)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
};
 
export default UserProfileDropdown;
 