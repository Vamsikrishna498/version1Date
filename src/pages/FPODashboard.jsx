import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { fpoAPI } from '../api/apiService';
import '../styles/Dashboard.css';
import '../styles/FPODashboard.css';
import StatsCard from '../components/StatsCard';
import UserProfileDropdown from '../components/UserProfileDropdown';
import FPOList from '../components/FPOList';
import FPOCreationForm from '../components/FPOCreationForm';
import FPOBoardMembers from '../components/FPOBoardMembers';
import FPOFarmServicesModal from '../components/FPOFarmServicesModal';
import FPOServices from '../components/FPOServices';
import FPOCrops from '../components/FPOCrops';
import FPOTurnover from '../components/FPOTurnover';
import FPOProducts from '../components/FPOProducts';
import FPONotifications from '../components/FPONotifications';

const FPODashboard = ({ initialTab = 'overview', fpoId: propFpoId, embedded = false }) => {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const { fpoId: urlFpoId } = useParams();
  const fpoId = propFpoId || urlFpoId; // Use prop first, then URL param
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fpos, setFpos] = useState([]);
  const [selectedFPO, setSelectedFPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFPOCreationForm, setShowFPOCreationForm] = useState(false);
  const [showFarmServicesModal, setShowFarmServicesModal] = useState(false);
  const [stats, setStats] = useState({
    totalFPOs: 0,
    activeFPOs: 0,
    totalMembers: 0,
    totalServices: 0
  });

  useEffect(() => {
    loadFPOs();
    loadStats();
  }, []);

  // Keep tab in sync when parent requests a different target
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // If parent provides an fpoId (e.g., from Super Admin table action), load and pin that FPO
  useEffect(() => {
    const syncSelectedFromProp = async () => {
      if (!fpoId) return;
      try {
        const fpo = await fpoAPI.getFPOById(fpoId);
        if (fpo) {
          setSelectedFPO(fpo);
          setActiveTab(initialTab || 'overview');
        }
      } catch (err) {
        console.error('Failed to load FPO by id for dashboard:', err);
      }
    };
    syncSelectedFromProp();
  }, [fpoId]);

  const loadFPOs = async () => {
    try {
      setLoading(true);
      const response = await fpoAPI.getAllFPOs();
      const list = Array.isArray(response)
        ? response
        : (response?.content || response?.data || []);
      setFpos(list);
    } catch (err) {
      setError('Failed to load FPOs');
      console.error('Error loading FPOs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [totalResponse, activeResponse] = await Promise.all([
        fpoAPI.getTotalFPOsCount(),
        fpoAPI.getActiveFPOsCount()
      ]);
      
      setStats({
        totalFPOs: totalResponse.data,
        activeFPOs: activeResponse.data,
        totalMembers: 0, // Will be calculated from individual FPOs
        totalServices: 0 // Will be calculated from individual FPOs
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleFPOCreated = (newFPO) => {
    setFpos(prev => [...prev, newFPO]);
    setShowFPOCreationForm(false);
    loadStats();
  };

  const handleFPOUpdated = (updatedFPO) => {
    setFpos(prev => prev.map(fpo => fpo.id === updatedFPO.id ? updatedFPO : fpo));
  };

  const handleFPODeleted = (fpoId) => {
    setFpos(prev => prev.filter(fpo => fpo.id !== fpoId));
    if (selectedFPO && selectedFPO.id === fpoId) {
      setSelectedFPO(null);
    }
    loadStats();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        // If an FPO is selected, show detailed dashboard sections
        if (selectedFPO) {
          return (
            <div className="fpo-detail-overview">
              <h2 style={{ marginBottom: 16 }}>{selectedFPO.fpoName} ({selectedFPO.fpoId})</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
                <div className="card" style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
                  <h3 style={{ marginTop: 0 }}>{selectedFPO.fpoName} ({selectedFPO.fpoId})</h3>
                  <div style={{ lineHeight: '28px' }}>
                    <div><strong>Reg No:</strong> {selectedFPO.registrationNumber || '-'}</div>
                    <div><strong>Email:</strong> {selectedFPO.email || '-'}</div>
                    <div><strong>Phone:</strong> {selectedFPO.phoneNumber || '-'}</div>
                    <div><strong>CEO:</strong> {selectedFPO.ceoName || '-'}</div>
                    <div><strong>Address:</strong> {(selectedFPO.village || '') + (selectedFPO.village ? ', ' : '') + (selectedFPO.district || '') + (selectedFPO.district ? ', ' : '') + (selectedFPO.state || '') + (selectedFPO.pincode ? ' - ' + selectedFPO.pincode : '')}</div>
                  </div>
                </div>
                <div className="card" style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 700, textAlign: 'center' }}>Status:</div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                    <span style={{ background: '#fde68a', color: '#92400e', padding: '6px 10px', borderRadius: 10 }}>
                      {(selectedFPO.status || '').toString().replace('_', ' ') || 'PENDING'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, textAlign: 'center', marginTop: 20 }}>Joined:</div>
                  <div style={{ textAlign: 'center', marginTop: 8 }}>{selectedFPO.joinDate || '-'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
                <div>
                  <h3>Farm Services</h3>
                  <FPOServices fpoId={selectedFPO.id} />
                </div>
                <div>
                  <h3>Turnovers</h3>
                  <FPOTurnover fpoId={selectedFPO.id} />
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <h3>Board Members</h3>
                <FPOBoardMembers fpoId={selectedFPO.id} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
                <div>
                  <h3>Products Sold</h3>
                  <FPOProducts fpoId={selectedFPO.id} />
                </div>
                <div>
                  <h3>Crop Entries</h3>
                  <FPOCrops fpoId={selectedFPO.id} />
                </div>
              </div>
            </div>
          );
        }

        // Default overview list when no FPO selected
        return (
          <div className="fpo-overview">
            <div className="stats-grid">
              <StatsCard title="Total FPOs" value={stats.totalFPOs} icon="🏢" color="blue" />
              <StatsCard title="Active FPOs" value={stats.activeFPOs} icon="✅" color="green" />
              <StatsCard title="Total Members" value={stats.totalMembers} icon="👥" color="purple" />
              <StatsCard title="Total Services" value={stats.totalServices} icon="🔧" color="orange" />
            </div>
            <div className="fpo-list-section">
              <div className="section-header">
                <h3>FPO Management</h3>
                <button className="btn btn-primary" onClick={() => setShowFPOCreationForm(true)}>Create New FPO</button>
              </div>
              <FPOList fpos={fpos} onFPOSelect={setSelectedFPO} onFPOUpdate={handleFPOUpdated} onFPODelete={handleFPODeleted} loading={loading} error={error} />
            </div>
          </div>
        );

      case 'board-members':
        return selectedFPO ? (
          <FPOBoardMembers fpoId={selectedFPO.id} />
        ) : (
          <div className="no-selection">
            <p>Please select an FPO to manage board members</p>
          </div>
        );

      case 'services':
        return selectedFPO ? (
          <div className="services-section">
            <div className="section-header">
              <h3>Farm Services</h3>
              <button 
                className="btn btn-primary"
                onClick={() => setShowFarmServicesModal(true)}
              >
                + Create Farm Service
              </button>
            </div>
            <FPOServices fpoId={selectedFPO.id} showDebugButton={true} />
          </div>
        ) : (
          <div className="no-selection">
            <p>Please select an FPO to manage services</p>
          </div>
        );

      case 'crops':
        return selectedFPO ? (
          <FPOCrops fpoId={selectedFPO.id} />
        ) : (
          <div className="no-selection">
            <p>Please select an FPO to manage crops</p>
          </div>
        );

      case 'turnover':
        return selectedFPO ? (
          <FPOTurnover fpoId={selectedFPO.id} />
        ) : (
          <div className="no-selection">
            <p>Please select an FPO to manage turnover</p>
          </div>
        );

      case 'products':
        return selectedFPO ? (
          <FPOProducts fpoId={selectedFPO.id} />
        ) : (
          <div className="no-selection">
            <p>Please select an FPO to manage products</p>
          </div>
        );

      case 'notifications':
        return selectedFPO ? (
          <FPONotifications fpoId={selectedFPO.id} />
        ) : (
          <div className="no-selection">
            <p>Please select an FPO to manage notifications</p>
          </div>
        );

      default:
        return null;
    }
  };

  // Embedded (compact) view: no header/sidebar, just content
  if (embedded) {
    return (
      <div className="fpo-embedded" style={{ background: 'transparent', padding: 0 }}>
        <div style={{ marginBottom: 8 }}>
          {renderTabContent()}
        </div>
      </div>
    );
  }

  // Full dashboard view
  return (
    <div className="dashboard fpo-dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            {branding?.logoLight ? (
              <img 
                src={branding.logoLight} 
                alt={branding.name || 'Company Logo'} 
                className="company-logo"
                style={{ 
                  height: '40px', 
                  maxWidth: '200px', 
                  objectFit: 'contain',
                  marginRight: '12px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <div style={{ display: branding?.logoLight ? 'none' : 'block' }}>
              <h1 className="logo-title">{branding?.name || 'DATE'}</h1>
              <p className="logo-subtitle">{branding?.shortName || 'Digital Agristack'}</p>
            </div>
          </div>
          <p className="greeting">
            {getGreeting()}, {user?.name || 'User'}!
          </p>
        </div>
        <div className="header-right">
          <UserProfileDropdown user={user} onLogout={logout} />
        </div>
      </header>

      <div className="dashboard-content">
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

          <nav className="sidebar-nav">
            <div
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              title="Overview"
            >
              <i className="fas fa-th-large"></i>
              <span className="nav-text">Overview</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'board-members' ? 'active' : ''} ${!selectedFPO ? 'disabled' : ''}`}
              onClick={() => selectedFPO && setActiveTab('board-members')}
              title="Board Members"
            >
              <i className="fas fa-users"></i>
              <span className="nav-text">Board Members</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'services' ? 'active' : ''} ${!selectedFPO ? 'disabled' : ''}`}
              onClick={() => selectedFPO && setActiveTab('services')}
              title="Services"
            >
              <i className="fas fa-tools"></i>
              <span className="nav-text">Services</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'crops' ? 'active' : ''} ${!selectedFPO ? 'disabled' : ''}`}
              onClick={() => selectedFPO && setActiveTab('crops')}
              title="Crops"
            >
              <i className="fas fa-seedling"></i>
              <span className="nav-text">Crops</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'turnover' ? 'active' : ''} ${!selectedFPO ? 'disabled' : ''}`}
              onClick={() => selectedFPO && setActiveTab('turnover')}
              title="Turnover"
            >
              <i className="fas fa-rupee-sign"></i>
              <span className="nav-text">Turnover</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'products' ? 'active' : ''} ${!selectedFPO ? 'disabled' : ''}`}
              onClick={() => selectedFPO && setActiveTab('products')}
              title="Products"
            >
              <i className="fas fa-box"></i>
              <span className="nav-text">Products</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'notifications' ? 'active' : ''} ${!selectedFPO ? 'disabled' : ''}`}
              onClick={() => selectedFPO && setActiveTab('notifications')}
              title="Notifications"
            >
              <i className="fas fa-bell"></i>
              <span className="nav-text">Notifications</span>
            </div>
          </nav>
        </div>

        <div className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {selectedFPO && (
            <div className="selected-fpo-info">
              <h3>Selected FPO: {selectedFPO.fpoName}</h3>
              <p>FPO ID: {selectedFPO.fpoId} | CEO: {selectedFPO.ceoName}</p>
            </div>
          )}
          
          <div className="tab-content">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {showFPOCreationForm && (
        <FPOCreationForm
          onClose={() => setShowFPOCreationForm(false)}
          onFPOCreated={handleFPOCreated}
        />
      )}

      {showFarmServicesModal && selectedFPO && (
        <FPOFarmServicesModal
          isOpen={showFarmServicesModal}
          onClose={() => setShowFarmServicesModal(false)}
          fpoId={selectedFPO.id}
          fpoName={selectedFPO.fpoName}
        />
      )}
    </div>
  );
};

export default FPODashboard;
