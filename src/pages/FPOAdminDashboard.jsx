import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fpoAPI, fpoUsersAPI, farmersAPI, employeesAPI } from '../api/apiService';
import ActionDropdown from '../components/ActionDropdown';
import '../styles/Dashboard.css';
import '../styles/FPOManagement.css';
import UserProfileDropdown from '../components/UserProfileDropdown';
import FPOList from '../components/FPOList';
import FPOEditForm from '../components/FPOEditForm';
import FPODetailModal from '../components/FPODetailModal';
import FPOCreationForm from '../components/FPOCreationForm';
import FPOBoardMembersView from '../components/FPOBoardMembersView';
import FPOFarmServicesView from '../components/FPOFarmServicesView';
import FPOTurnoverView from '../components/FPOTurnoverView';
import FPOCropEntriesView from '../components/FPOCropEntriesView';
import FPOInputShopView from '../components/FPOInputShopView';
import FPOProductCategoriesView from '../components/FPOProductCategoriesView';
import FPOProductsView from '../components/FPOProductsView';
import FPOUsersView from '../components/FPOUsersView';
import FPODashboard from './FPODashboard';
import FarmerRegistrationForm from '../components/FarmerRegistrationForm';
import EmployeeRegistrationForm from '../components/EmployeeRegistrationForm';

const FPOAdminDashboard = () => {
  const { fpoId: urlFpoId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Use URL FPO ID if available, otherwise fall back to user's FPO ID for consistency
  const fpoId = urlFpoId || user?.fpoId || user?.assignedFpoId || user?.fpo?.id || user?.fpo?.fpoId;
  
  // Debug logging to ensure FPO ID consistency
  console.log('FPOAdminDashboard - URL FPO ID:', urlFpoId);
  console.log('FPOAdminDashboard - User FPO ID:', user?.fpoId);
  console.log('FPOAdminDashboard - Resolved FPO ID:', fpoId);
  const [fpo, setFpo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('overview'); // overview | farmers | employees
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [farmers, setFarmers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // FPO Management States
  const [fpos, setFpos] = useState([]);
  const [showFPOCreationForm, setShowFPOCreationForm] = useState(false);
  const [showInlineFarmerCreate, setShowInlineFarmerCreate] = useState(false);
  const [showInlineEmployeeCreate, setShowInlineEmployeeCreate] = useState(false);
  const [viewingFPO, setViewingFPO] = useState(false);
  const [selectedFPO, setSelectedFPO] = useState(null);
  const [fpoFilters, setFpoFilters] = useState({
    state: '',
    district: '',
    status: ''
  });
  const [fpoSearch, setFpoSearch] = useState('');
  const [showFPOEditForm, setShowFPOEditForm] = useState(false);
  const [showFPODetailModal, setShowFPODetailModal] = useState(false);
  const [showFPOBoardMembers, setShowFPOBoardMembers] = useState(false);
  const [showFPOFarmServices, setShowFPOFarmServices] = useState(false);
  const [showFPOTurnover, setShowFPOTurnover] = useState(false);
  const [showFPOCropEntries, setShowFPOCropEntries] = useState(false);
  const [showFPOInputShop, setShowFPOInputShop] = useState(false);
  const [showFPOProductCategories, setShowFPOProductCategories] = useState(false);
  const [showFPOProducts, setShowFPOProducts] = useState(false);
  const [showFPOUsers, setShowFPOUsers] = useState(false);
  const [selectedFPOForBoardMembers, setSelectedFPOForBoardMembers] = useState(null);
  const [selectedFPOForFarmServices, setSelectedFPOForFarmServices] = useState(null);
  const [selectedFPOForTurnover, setSelectedFPOForTurnover] = useState(null);
  const [selectedFPOForCropEntries, setSelectedFPOForCropEntries] = useState(null);
  const [selectedFPOForInputShop, setSelectedFPOForInputShop] = useState(null);
  const [selectedFPOForProductCategories, setSelectedFPOForProductCategories] = useState(null);
  const [selectedFPOForProducts, setSelectedFPOForProducts] = useState(null);
  const [selectedFPOForUsers, setSelectedFPOForUsers] = useState(null);
  const [fpoEmbeddedTab, setFpoEmbeddedTab] = useState(null); // for embedded FPODashboard tab control
  const scrollToModule = () => {
    setTimeout(() => {
      const el = document.getElementById('fpo-module-anchor');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };
  const [showFarmerView, setShowFarmerView] = useState(false);
  const [farmerViewData, setFarmerViewData] = useState(null);
  const [showEditFarmer, setShowEditFarmer] = useState(false);
  const [editFarmerData, setEditFarmerData] = useState(null);

  // Greeting function based on time of day
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

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const handleChangePassword = () => {
    navigate('/change-password-dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // FPO Management Functions
  const loadFPOs = async () => {
    try {
      const data = await fpoAPI.getAllFPOs();
      setFpos(data || []);
    } catch (error) {
      console.error('Error loading FPOs:', error);
      setFpos([]);
    }
  };

  const handleAddFPO = () => {
    setShowFPOCreationForm(true);
  };

  const handleEditFPO = (fpo) => {
    setSelectedFPO(fpo);
    setShowFPOEditForm(true);
  };

  const handleViewFPO = (fpo, viewType = 'overview') => {
    setSelectedFPO(fpo);
    setViewingFPO(true);
    if (viewType === 'board-members') {
      setSelectedFPOForBoardMembers(fpo);
      setShowFPOBoardMembers(true);
    } else if (viewType === 'services') {
      setSelectedFPOForFarmServices(fpo);
      setShowFPOFarmServices(true);
    } else if (viewType === 'turnover') {
      setSelectedFPOForTurnover(fpo);
      setShowFPOTurnover(true);
    } else if (viewType === 'crops') {
      setSelectedFPOForCropEntries(fpo);
      setShowFPOCropEntries(true);
    } else if (viewType === 'input-shop') {
      setSelectedFPOForInputShop(fpo);
      setShowFPOInputShop(true);
    } else if (viewType === 'product-categories') {
      setSelectedFPOForProductCategories(fpo);
      setShowFPOProductCategories(true);
    } else if (viewType === 'products') {
      setSelectedFPOForProducts(fpo);
      setShowFPOProducts(true);
    } else if (viewType === 'users') {
      setSelectedFPOForUsers(fpo);
      setShowFPOUsers(true);
    } else {
      setShowFPODetailModal(true);
    }
  };

  const handleDeleteFPO = async (fpo) => {
    if (window.confirm(`Are you sure you want to delete FPO "${fpo.fpoName || fpo.name}"?`)) {
      try {
        await fpoAPI.deleteFPO(fpo.id);
        await loadFPOs();
      } catch (error) {
        console.error('Error deleting FPO:', error);
        alert('Failed to delete FPO');
      }
    }
  };

  const handleFPOCreated = () => {
    setShowFPOCreationForm(false);
    loadFPOs();
  };

  const handleFPOUpdated = () => {
    setShowFPOEditForm(false);
    setSelectedFPO(null);
    loadFPOs();
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fpoAPI.getFPOById(fpoId);
        setFpo(data);
      } catch (e) {
        setError('Failed to load FPO details');
      } finally {
        setLoading(false);
      }
    };
    if (fpoId) load();
  }, [fpoId]);

  // Reusable loaders
  const loadFarmers = async () => {
    try {
      // Load FPO members and enrich with farmer details (same logic as FPOEmployeeDashboard)
      const members = await fpoAPI.getFPOMembers(fpoId);
      const base = (members || []).map((m, idx) => ({
        id: m.id || idx + 1,
        memberId: m.id,
        farmerId: m.farmerId,
        name: m.farmerName || m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim(),
        phoneNumber: '-',
        email: '-',
        status: (m.status || 'PENDING').toUpperCase(),
        raw: m
      }));
      const enriched = await Promise.all(base.map(async (row) => {
        if (!row.farmerId) return row;
        try {
          const dto = await farmersAPI.getFarmerById(row.farmerId);
          return {
            ...row,
            name: dto?.firstName ? `${dto.firstName} ${dto.lastName || ''}`.trim() : (row.name || '-'),
            phoneNumber: dto?.contactNumber || row.phoneNumber,
            email: dto?.email || row.email,
            status: (dto?.status || row.status || 'PENDING').toUpperCase(),
          };
        } catch {
          return row;
        }
      }));
      setFarmers(enriched);
    } catch (e) {
      console.error(e);
      setFarmers([]);
    }
  };

  const loadEmployees = async () => {
    try {
      const all = await fpoUsersAPI.list(fpoId);
      const emps = (all || []).filter(u => (u.role || '').toUpperCase() === 'EMPLOYEE');
      setEmployees(emps);
    } catch (e) {
      console.error(e);
      setEmployees([]);
    }
  };

  // Lazy-load section data when switching views
  useEffect(() => {
    if (view === 'farmers') loadFarmers();
    if (view === 'employees') loadEmployees();
    if (view === 'fpo') { loadFarmers(); loadEmployees(); }
    if (view === 'fpo') loadFPOs();
  }, [view, fpoId]);

  // Auto-refresh farmers data every 30 seconds to keep in sync
  useEffect(() => {
    if (view === 'farmers' && fpoId) {
      const interval = setInterval(() => {
        loadFarmers();
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [view, fpoId]);

  // Handlers for inline submissions
  const handleFarmerCreatedInline = async (formData) => {
    try {
      // 1) Create farmer via global multipart endpoint (preserves validations and ID card flow)
      const createdFarmer = await farmersAPI.createFarmer(formData);

      // 2) Link farmer to this FPO as a member (lightweight JSON)
      await fpoAPI.addMemberToFPO(fpoId, { memberType: 'FARMER', farmerId: createdFarmer.id });

      setShowInlineFarmerCreate(false);
      setView('farmers');
      await loadFarmers();
      alert('Farmer created and linked to FPO successfully');
    } catch (e) {
      console.error('Failed to create/link farmer to FPO:', e);
      alert(e.response?.data?.message || e.response?.data?.error || 'Failed to add farmer');
    }
  };


  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <span>Loading FPO Admin Dashboard…</span>
      </div>
    );
  }

  if (error) {
    return <div className="admin-error">{error}</div>;
  }

  const fpoName = fpo?.fpoName || fpo?.name || '—';
  const fpoCode = fpo?.fpoId || fpo?.id || '—';

  return (
    <div className="dashboard">
      {/* Top Frame - Modern Professional Header */}
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
                {user?.name?.charAt(0) || 'A'}
              </div>
              <span className="user-email">{user?.email || 'admin@fpo.com'}</span>
              <i className={`fas fa-chevron-down dropdown-arrow ${showUserDropdown ? 'rotated' : ''}`}></i>
            </div>
            <div className={`user-dropdown-menu ${showUserDropdown ? 'show' : ''}`}>
              <div className="dropdown-header">
                <div className="user-avatar-large">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="user-details">
                  <div className="user-name-large">{user?.name || 'FPO Admin'}</div>
                  <div className="user-email">{user?.email || 'admin@fpo.com'}</div>
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
          <div className="sidebar-role">FPO Admin</div>
        </div>
        
        <div className="sidebar-nav">
          <div 
            className={`nav-item ${view === 'overview' ? 'active' : ''}`}
            onClick={() => setView('overview')}
            title="Dashboard"
          >
            <i className="fas fa-th-large"></i>
            <span className="nav-text">Dashboard</span>
          </div>

          <div 
            className={`nav-item ${view === 'farmers' ? 'active' : ''}`}
            onClick={() => setView('farmers')}
            title="Farmers"
          >
            <i className="fas fa-users"></i>
            <span className="nav-text">Farmers</span>
          </div>
          
          <div 
            className={`nav-item ${view === 'employees' ? 'active' : ''}`}
            onClick={() => setView('employees')}
            title="Employees"
          >
            <i className="fas fa-user-tie"></i>
            <span className="nav-text">Employees</span>
          </div>

          <div 
            className={`nav-item ${view === 'fpo' ? 'active' : ''}`}
            onClick={() => setView('fpo')}
            title="FPO"
          >
            <i className="fas fa-building"></i>
            <span className="nav-text">FPO</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {view === 'overview' && (
          <div className="welcome-section">
            <h1 className="welcome-title">
              {getGreeting()}, {user?.name || 'FPO Admin'}! 👋
            </h1>
            <p className="welcome-subtitle">
              Welcome to your FPO Admin Dashboard. Manage farmers and employees for <strong>{fpoName}</strong> (ID: {fpoCode}).
            </p>
          </div>
        )}

        {view === 'overview' && (
        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-icon farmers">
              <i className="fas fa-users"></i>
            </div>
            <div className="stats-content">
              <div className="stats-value">{farmers.length}</div>
              <div className="stats-label">Farmers</div>
              <div className="stats-change positive">+0% from last month</div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="stats-icon employees">
              <i className="fas fa-user-tie"></i>
            </div>
            <div className="stats-content">
              <div className="stats-value">{employees.length}</div>
              <div className="stats-label">Employees</div>
              <div className="stats-change positive">+0% from last month</div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="stats-icon fpo">
              <i className="fas fa-building"></i>
            </div>
            <div className="stats-content">
              <div className="stats-value">1</div>
              <div className="stats-label">FPO</div>
              <div className="stats-change positive">Active</div>
            </div>
          </div>
        </div>
        )}

        {view === 'overview' && (
          <div style={{ marginTop: 12 }}>
            <FPODashboard initialTab="overview" fpoId={fpoId} embedded />
        </div>
        )}

        {view === 'farmers' && !showInlineFarmerCreate && (
          <section className="panel" style={{ marginTop: 12, width: '100%', maxWidth: 'none', padding: '24px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <h2 style={{ marginTop: 0, fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>Farmers</h2>
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <input
                  value={farmerSearch}
                  onChange={(e) => setFarmerSearch(e.target.value)}
                  placeholder="Search name, phone or email"
                  className="input"
                  style={{ 
                    padding: '12px 16px', 
                    border: '2px solid #e5e7eb', 
                    borderRadius: '12px',
                    fontSize: '15px',
                    minWidth: '280px',
                    background: 'white',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#22c55e'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <button 
                  className="btn" 
                  onClick={() => setView('overview') || setTimeout(() => setView('farmers'), 0)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    color: '#374151',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Refresh
                </button>
                <button 
                  className="btn primary" 
                  onClick={() => setShowInlineFarmerCreate(true)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
                    border: 'none',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(21, 128, 61, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Add Farmer
                </button>
              </div>
            </div>
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <table className="fpo-table" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {farmers.filter(f => {
                    const q = farmerSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      (f.name || '').toLowerCase().includes(q) ||
                      (f.phoneNumber || '').toLowerCase().includes(q) ||
                      (f.email || '').toLowerCase().includes(q)
                    );
                  }).map(f => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: '600', color: '#15803d' }}>{f.id}</td>
                      <td style={{ fontWeight: '600', color: '#1e293b' }}>{f.name}</td>
                      <td style={{ color: '#64748b' }}>{f.phoneNumber}</td>
                      <td style={{ color: '#64748b' }}>{f.email}</td>
                      <td>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: f.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: f.status === 'ACTIVE' ? '#15803d' : '#dc2626'
                        }}>
                          {f.status}
                        </span>
                      </td>
                      <td>
                        <ActionDropdown
                          item={f}
                          customActions={[
                            {
                              label: 'View Details',
                              className: 'info',
                              onClick: async (row) => {
                                try {
                                  const dto = await farmersAPI.getFarmerById(row.farmerId || row.id);
                                  setFarmerViewData(dto);
                                  setShowFarmerView(true);
                                } catch (e) { alert('Failed to load farmer details'); }
                              }
                            },
                            {
                              label: 'Edit',
                              className: 'primary',
                              onClick: async (row) => {
                                try {
                                  const dto = await farmersAPI.getFarmerById(row.farmerId || row.id);
                                  setEditFarmerData(dto);
                                  setShowEditFarmer(true);
                                } catch (e) { alert('Failed to load farmer'); }
                              }
                            },
                            {
                              label: 'Delete',
                              className: 'danger',
                              onClick: async (row) => {
                                if (!window.confirm('Delete this farmer permanently?')) return;
                                try {
                                  await farmersAPI.deleteFarmer(row.farmerId || row.id);
                                  await loadFarmers();
                                  alert('Farmer deleted');
                                } catch (e) { alert(e.response?.data?.message || 'Failed to delete'); }
                              }
                            },
                            {
                              label: 'Approve KYC',
                              className: 'success',
                              onClick: async (row) => {
                                try {
                                  await fpoAPI.approveKyc(row.farmerId || row.id);
                                  alert('KYC approved');
                                } catch (e) { alert(e.response?.data?.message || 'Failed to approve'); }
                              }
                            },
                            {
                              label: 'Reject KYC',
                              className: 'danger',
                              onClick: async (row) => {
                                const reason = prompt('Enter rejection reason');
                                if (!reason) return;
                                try {
                                  await fpoAPI.rejectKyc(row.farmerId || row.id, { reason });
                                  alert('KYC rejected');
                                } catch (e) { alert(e.response?.data?.message || 'Failed to reject'); }
                              }
                            },
                            {
                              label: 'Refer Back',
                              className: 'warning',
                              onClick: async (row) => {
                                const reason = prompt('Enter refer-back reason');
                                if (!reason) return;
                                try {
                                  await fpoAPI.referBackKyc(row.farmerId || row.id, { reason });
                                  alert('Referred back to employee');
                                } catch (e) { console.error(e); alert('Failed to refer back'); }
                              }
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                  {farmers.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ 
                        textAlign: 'center', 
                        color: '#64748b', 
                        padding: '60px 20px',
                        fontSize: '16px',
                        fontWeight: '500'
                      }}>
                        No farmers found. Click "Add Farmer" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Edit Farmer - reuse registration form prefilled */}
        {showEditFarmer && editFarmerData && (
          <section className="panel" style={{ marginTop: 12, width: '100%', maxWidth: 'none', padding: '24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h2 style={{ marginTop:0 }}>Edit Farmer</h2>
              <button className="btn" onClick={()=>{ setShowEditFarmer(false); setEditFarmerData(null); }}>Close</button>
            </div>
            <FarmerRegistrationForm
              isInDashboard
              editData={editFarmerData}
              onClose={()=>{ setShowEditFarmer(false); setEditFarmerData(null); }}
              onSubmit={async (formData)=>{
                try {
                  await farmersAPI.updateFarmer(editFarmerData.id, formData);
                  setShowEditFarmer(false);
                  setEditFarmerData(null);
                  await loadFarmers();
                  alert('Farmer updated');
                } catch (e) { alert(e.response?.data?.message || 'Failed to update'); }
              }}
            />
          </section>
        )}

        {view === 'farmers' && showInlineFarmerCreate && (
          <section className="panel" style={{ marginTop: 12, width: '100%', maxWidth: 'none', padding: '24px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <h2 style={{ marginTop: 0, fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>Create Farmer</h2>
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <button 
                  className="btn" 
                  onClick={() => setShowInlineFarmerCreate(false)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    color: '#374151',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ← Back to Farmers
                </button>
                <button 
                  className="close-btn" 
                  onClick={() => setShowInlineFarmerCreate(false)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#dc2626';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#ef4444';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                  }}
                  title="Close"
                >
                  <i className="fas fa-times" style={{ fontSize: '14px' }}></i>
                </button>
              </div>
            </div>
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <FarmerRegistrationForm
                isInDashboard
                onClose={() => setShowInlineFarmerCreate(false)}
                onSubmit={handleFarmerCreatedInline}
              />
            </div>
          </section>
        )}

        {/* Employees list (scoped to this FPO) */}
        {view === 'employees' && !showInlineEmployeeCreate && (
          <section className="panel" style={{ marginTop: 12, width: '100%', maxWidth: 'none', padding: '24px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:16 }}>
              <h2 style={{ marginTop: 0, fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>Employees</h2>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
                <input
                  value={employeeSearch}
                  onChange={(e)=>setEmployeeSearch(e.target.value)}
                  placeholder="Search name, phone or email"
                  className="input"
                  style={{ padding:'12px 16px', border:'2px solid #e5e7eb', borderRadius:12, fontSize:15, minWidth:280, background:'white', boxShadow:'0 2px 4px rgba(0,0,0,0.05)', transition:'all 0.2s ease' }}
                  onFocus={(e)=>e.target.style.borderColor='#22c55e'}
                  onBlur={(e)=>e.target.style.borderColor='#e5e7eb'}
                />
                <button className="btn" onClick={()=>{ setView('overview'); setTimeout(()=>setView('employees'),0); }}
                  style={{ padding:'12px 20px', borderRadius:12, fontSize:15, fontWeight:600, background:'white', border:'2px solid #e5e7eb', color:'#374151', transition:'all 0.2s ease' }}>
                  Refresh
                </button>
              </div>
            </div>
            <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 25px rgba(0,0,0,0.08)', border:'1px solid #e2e8f0' }}>
              <table className="fpo-table" style={{ width:'100%', margin:0 }}>
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.filter(u=>{
                    const q = employeeSearch.trim().toLowerCase();
                    if (!q) return true;
                    const name = `${u.firstName||''} ${u.lastName||''}`.trim();
                    return name.toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q) || (u.phoneNumber||'').toLowerCase().includes(q);
                  }).map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight:600, color:'#15803d' }}>{u.id}</td>
                      <td style={{ fontWeight:600, color:'#1e293b' }}>{u.firstName} {u.lastName}</td>
                      <td style={{ color:'#64748b' }}>{u.email}</td>
                      <td style={{ color:'#64748b' }}>{u.phoneNumber}</td>
                      <td>
                        <span style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', background: u.status==='APPROVED' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: u.status==='APPROVED' ? '#15803d' : '#dc2626' }}>
                          {u.status}
                        </span>
                      </td>
                      <td>
                        <ActionDropdown
                          item={u}
                          customActions={[
                            {
                              label: 'Edit Password',
                              className: 'info',
                              onClick: async (userRow) => {
                            const pwd = prompt('Enter new password for employee');
                            if (!pwd) return;
                            try {
                                  await fpoUsersAPI.updatePassword(fpoId, userRow.id, pwd);
                              alert('Password updated');
                            } catch (e) { alert('Failed to update password'); }
                              }
                            },
                            {
                              label: (u.status === 'APPROVED') ? 'Deactivate Account' : 'Activate Account',
                              className: (u.status === 'APPROVED') ? 'danger' : 'success',
                              onClick: async (userRow) => {
                                try {
                                  await fpoUsersAPI.toggleActive(fpoId, userRow.id, !(userRow.status === 'APPROVED'));
                                  // refresh
                                  await loadEmployees();
                                } catch (e) {
                                  alert('Failed to update status');
                                }
                              }
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign:'center', color:'#64748b', padding:'60px 20px', fontSize:16, fontWeight:500 }}>No employees found for this FPO.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {view === 'employees' && showInlineEmployeeCreate && (
          <section className="panel" style={{ marginTop: 12, width: '100%', maxWidth: 'none', padding: '24px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <h2 style={{ marginTop: 0, fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>Create Employee</h2>
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <button 
                  className="btn" 
                  onClick={() => setShowInlineEmployeeCreate(false)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    color: '#374151',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ← Back to Employees
                </button>
                <button 
                  className="close-btn" 
                  onClick={() => setShowInlineEmployeeCreate(false)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#dc2626';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#ef4444';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                  }}
                  title="Close"
                >
                  <i className="fas fa-times" style={{ fontSize: '14px' }}></i>
                </button>
              </div>
            </div>
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <EmployeeRegistrationForm
                isInDashboard
                fpoId={fpoId}
                onClose={() => setShowInlineEmployeeCreate(false)}
                onSubmit={async (formData) => {
                  try {
                    // Use general employee creation API since FPO-specific endpoint doesn't exist
                    await employeesAPI.createEmployee(formData);
                    setShowInlineEmployeeCreate(false);
                    setView('employees');
                    await loadEmployees();
                    alert('Employee created successfully');
                  } catch (e) {
                    console.error('Failed to create FPO employee:', e);
                    alert(e.response?.data?.message || e.response?.data?.error || 'Failed to create FPO employee');
                  }
                }}
              />
            </div>
          </section>
        )}

        {view === 'fpo' && !showFPOEditForm && !showFPOBoardMembers && !showFPOFarmServices && !showFPOTurnover && !showFPOCropEntries && !showFPOInputShop && !showFPOProductCategories && !showFPOProducts && !showFPOUsers && (
          <div className="superadmin-overview-section">
                    <div className="superadmin-overview-header">
                      <div className="header-left">
                <h2 className="superadmin-overview-title">{fpo?.fpoName || 'FPO'} - Details</h2>
                <p className="overview-description">Manage all modules and details of this FPO.</p>
                      </div>
                      <div className="header-right">
                        {/* ActionDropdown removed to fix dual close button issue */}
                      </div>
                    </div>

            {/* FPO details table scoped to this FPO */}
            <section className="panel" style={{ marginTop: 12, width: '100%', maxWidth: 'none', padding: '24px' }}>
              <h3 style={{ marginTop: 0, fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>FPO Details</h3>
              <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 25px rgba(0,0,0,0.08)', border:'1px solid #e2e8f0' }}>
                <table className="fpo-table" style={{ width:'100%', margin:0 }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Reg No</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>State</th>
                      <th>District</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fpo ? (
                      <tr>
                        <td style={{ fontWeight:600, color:'#15803d' }}>{fpo.id || fpo.fpoId}</td>
                        <td style={{ fontWeight:600, color:'#1e293b' }}>{fpo.fpoName || fpo.name}</td>
                        <td style={{ color:'#64748b' }}>{fpo.registrationNumber || '-'}</td>
                        <td style={{ color:'#64748b' }}>{fpo.email || '-'}</td>
                        <td style={{ color:'#64748b' }}>{fpo.phoneNumber || '-'}</td>
                        <td style={{ color:'#64748b' }}>{fpo.state || '-'}</td>
                        <td style={{ color:'#64748b' }}>{fpo.district || '-'}</td>
                        <td>
                          <span style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', background: (String(fpo.status).toUpperCase()==='ACTIVE') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: (String(fpo.status).toUpperCase()==='ACTIVE') ? '#15803d' : '#dc2626' }}>
                            {String(fpo.status || 'PENDING')}
                          </span>
                        </td>
                        <td>
                <ActionDropdown
                            item={fpo}
                            customActions={[
                    { label: 'Edit FPO', className: 'primary', onClick: ()=> { setSelectedFPO(fpo); setShowFPOEditForm(true); } },
                    { label: 'Farm Services', className: 'primary', onClick: ()=> { setSelectedFPOForFarmServices(fpo); setShowFPOFarmServices(true); } },
                    { label: 'Board Members', className: 'primary', onClick: ()=> { setSelectedFPOForBoardMembers(fpo); setShowFPOBoardMembers(true); } },
                    { label: 'Crops', className: 'primary', onClick: ()=> { setSelectedFPOForCropEntries(fpo); setShowFPOCropEntries(true); } },
                    { label: 'Turnover', className: 'primary', onClick: ()=> { setSelectedFPOForTurnover(fpo); setShowFPOTurnover(true); } },
                    { label: 'Products', className: 'primary', onClick: ()=> { setSelectedFPOForProducts(fpo); setShowFPOProducts(true); } },
                    { label: 'Product Categories', className: 'primary', onClick: ()=> { setSelectedFPOForProductCategories(fpo); setShowFPOProductCategories(true); } },
                    { label: 'Input Shops', className: 'primary', onClick: ()=> { setSelectedFPOForInputShop(fpo); setShowFPOInputShop(true); } },
                    { label: 'Notifications', className: 'primary', onClick: ()=> { setSelectedFPO(fpo); setFpoEmbeddedTab('notifications'); scrollToModule(); } },
                    { label: 'FPO Users', className: 'primary', onClick: ()=> { setSelectedFPOForUsers(fpo); setShowFPOUsers(true); } },
                    
                            ]}
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr><td colSpan={9} style={{ textAlign:'center', color:'#64748b', padding:'24px 12px' }}>No FPO found</td></tr>
                    )}
                  </tbody>
                </table>
                    </div>
            </section>

            {/* Optional: render embedded sections when an action selects a tab */}
            {fpoEmbeddedTab && !showFPOBoardMembers && !showFPOFarmServices && !showFPOTurnover && !showFPOCropEntries && !showFPOInputShop && !showFPOProductCategories && !showFPOProducts && !showFPOUsers && (
              <div id="fpo-module-anchor" style={{ marginTop: 16 }}>
                <FPODashboard initialTab={fpoEmbeddedTab} fpoId={fpoId} embedded />
                  </div>
            )}
          </div>
        )}

        {/* FPO Full-Width Views */}
        {showFPOEditForm && selectedFPO && (
          <div className="section-card" style={{ padding: 0 }}>
            <FPOEditForm
              fpo={selectedFPO}
              onClose={() => { setShowFPOEditForm(false); setSelectedFPO(null); }}
              onSuccess={handleFPOUpdated}
            />
          </div>
        )}

        {showFPOBoardMembers && selectedFPOForBoardMembers && (
          <div className="section-card" style={{ padding: 0 }}>
            <FPOBoardMembersView
              fpo={selectedFPOForBoardMembers}
              onClose={() => { setShowFPOBoardMembers(false); setSelectedFPOForBoardMembers(null); }}
            />
          </div>
        )}

        {showFPOFarmServices && selectedFPOForFarmServices && (
          <div className="section-card" style={{ padding: 0 }}>
            <FPOFarmServicesView
              fpo={selectedFPOForFarmServices}
              onClose={() => { setShowFPOFarmServices(false); setSelectedFPOForFarmServices(null); }}
            />
          </div>
        )}

        {showFPOTurnover && selectedFPOForTurnover && (
          <div className="section-card" style={{ padding: 0 }}>
            <FPOTurnoverView
              fpo={selectedFPOForTurnover}
              onClose={() => { setShowFPOTurnover(false); setSelectedFPOForTurnover(null); }}
            />
          </div>
        )}

        {showFPOCropEntries && selectedFPOForCropEntries && (
          <div className="section-card" style={{ padding: 0 }}>
            <FPOCropEntriesView
              fpo={selectedFPOForCropEntries}
              onClose={() => { setShowFPOCropEntries(false); setSelectedFPOForCropEntries(null); }}
            />
          </div>
        )}

        {showFPOInputShop && selectedFPOForInputShop && (
          <div className="section-card" style={{ padding: 0 }}>
            <FPOInputShopView
              fpo={selectedFPOForInputShop}
              onClose={() => { setShowFPOInputShop(false); setSelectedFPOForInputShop(null); }}
            />
          </div>
        )}

        {showFPOProductCategories && selectedFPOForProductCategories && (
          <div className="section-card" style={{ padding: 0 }}>
            <FPOProductCategoriesView
              fpo={selectedFPOForProductCategories}
              onClose={() => { setShowFPOProductCategories(false); setSelectedFPOForProductCategories(null); }}
            />
          </div>
        )}

        {showFPOProducts && selectedFPOForProducts && (
          <div className="section-card" style={{ padding: 0 }}>
            <FPOProductsView
              fpo={selectedFPOForProducts}
              onClose={() => { setShowFPOProducts(false); setSelectedFPOForProducts(null); }}
            />
          </div>
        )}

        {showFPOUsers && selectedFPOForUsers && (
          <div className="section-card" style={{ padding: 0 }}>
            <FPOUsersView
              fpo={selectedFPOForUsers}
              onClose={() => { setShowFPOUsers(false); setSelectedFPOForUsers(null); }}
              userRole="FPO_ADMIN"
            />
          </div>
        )}
      </div>

      {/* FPO Modals */}



      {showFPODetailModal && selectedFPO && (
        <FPODetailModal
          fpo={selectedFPO}
          onClose={() => {
            setShowFPODetailModal(false);
            setSelectedFPO(null);
          }}
        />
      )}

      {/* Farmer quick view modal */}
      {showFarmerView && farmerViewData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Farmer Details - {farmerViewData.firstName} {farmerViewData.lastName}</h2>
              <button className="modal-close" onClick={() => { setShowFarmerView(false); setFarmerViewData(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item"><label>Name:</label><span>{farmerViewData.firstName} {farmerViewData.lastName}</span></div>
                <div className="info-item"><label>Phone:</label><span>{farmerViewData.contactNumber || '-'}</span></div>
                <div className="info-item"><label>Email:</label><span>{farmerViewData.email || '-'}</span></div>
                <div className="info-item"><label>Village:</label><span>{farmerViewData.village || '-'}</span></div>
                <div className="info-item"><label>District:</label><span>{farmerViewData.district || '-'}</span></div>
                <div className="info-item"><label>State:</label><span>{farmerViewData.state || '-'}</span></div>
                <div className="info-item"><label>Status:</label><span>{farmerViewData.status || '-'}</span></div>
              </div>
              <div style={{ marginTop:16, display:'flex', gap:8 }}>
                <button className="btn primary" onClick={() => { setShowFarmerView(false); setEditFarmerData(farmerViewData); setShowEditFarmer(true); }}>Edit</button>
                <button className="btn danger" onClick={async ()=>{
                  if (!window.confirm('Delete this farmer permanently?')) return;
                  try { await farmersAPI.deleteFarmer(farmerViewData.id); setShowFarmerView(false); setFarmerViewData(null); await loadFarmers(); alert('Farmer deleted'); }
                  catch(e){ alert(e.response?.data?.message || 'Failed to delete'); }
                }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FPOAdminDashboard;


