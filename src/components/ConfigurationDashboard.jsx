import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { configAPI } from '../api/apiService';
import UserRolesTab from './config/UserRolesTab';
import TemplatesTab from './config/TemplatesTab';
import PreferencesTab from './config/PreferencesTab';
import '../styles/ConfigurationDashboard.css';

const ConfigurationDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('user-roles');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const tabs = [
    { id: 'user-roles', label: 'Users & Roles', icon: '👥', navigate: false },
    { id: 'templates', label: 'Mail Templates', icon: '📧', navigate: false },
    { id: 'preferences', label: 'Preferences', icon: '🔔', navigate: false }
  ];

  const handleTabClick = (tab) => {
    if (tab.navigate) {
      navigate(tab.navigate);
    } else {
      setActiveTab(tab.id);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'user-roles':
        return <UserRolesTab />;
      case 'templates':
        return <TemplatesTab isSuperAdmin={isSuperAdmin} />;
      case 'preferences':
        return <PreferencesTab isSuperAdmin={isSuperAdmin} />;
      default:
        return <UserRolesTab />;
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="configuration-dashboard">
        <div className="access-denied">
          <h2>🚫 Access Denied</h2>
          <p>You don't have permission to access configurations.</p>
          <p>Only Super Admin users can access this module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="configuration-dashboard">
      <div className="config-header">
        <h1>👥 Users & Roles Management</h1>
        <p>Manage user roles, assign roles to users, and configure system permissions</p>
      </div>

      <div className="config-tabs">
        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tab-content">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading configuration data...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">❌</span>
            <span>{error}</span>
            <button onClick={() => setError('')} className="close-error">×</button>
          </div>
        )}

        {renderTabContent()}
      </div>
    </div>
  );
};

export default ConfigurationDashboard;
