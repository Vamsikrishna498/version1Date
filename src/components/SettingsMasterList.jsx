import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { configAPI } from '../api/apiService';
import CountrySettings from './settings/CountrySettings';
import GlobalAreaSettings from './settings/GlobalAreaSettings';
import CropSettings from './settings/CropSettings';
import '../styles/SettingsMasterList.css';

const SettingsMasterList = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('country-settings');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const settingsTabs = [
    { 
      id: 'country-settings', 
      label: 'Country Settings', 
      icon: '🌍',
      description: 'Manage country, state, district, block, village, and zipcode mappings',
      accessLevel: 'Administrator'
    },
    { 
      id: 'global-area', 
      label: 'Global Area', 
      icon: '🌐',
      description: 'Configure age limits, education types, and global settings',
      accessLevel: 'Administrator'
    },
    { 
      id: 'crop-settings', 
      label: 'Crop Settings', 
      icon: '🌾',
      description: 'Manage crop names, varieties, and crop-related configurations',
      accessLevel: 'Administrator'
    }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'country-settings':
        return <CountrySettings isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} />;
      case 'global-area':
        return <GlobalAreaSettings isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} />;
      case 'crop-settings':
        return <CropSettings isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} />;
      default:
        return <CountrySettings isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} />;
    }
  };

  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="settings-master-list">
        <div className="access-denied">
          <h2>🚫 Access Denied</h2>
          <p>You don't have permission to access settings.</p>
          <p>Only Administrator and Super Admin users can access this module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-master-list">
      <div className="settings-header">
        <h1>⚙️ Settings Master List</h1>
        <p>Configure system-wide settings and master data for the DATE Digital Agristack platform</p>
      </div>

      <div className="settings-cards">
        {settingsTabs.map((tab) => (
          <div
            key={tab.id}
            className={`settings-card ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <div className="card-icon">{tab.icon}</div>
            <div className="card-content">
              <h3 className="card-title">{tab.label}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="tab-content">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading settings data...</p>
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

export default SettingsMasterList;
