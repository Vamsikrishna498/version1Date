import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fpoAPI, farmersAPI, kycAPI } from '../api/apiService';
import '../styles/Dashboard.css';
import FarmerRegistrationForm from '../components/FarmerRegistrationForm';
import KYCModal from '../components/KYCModal';

const FPOEmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fpo, setFpo] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [view, setView] = useState('farmers'); // only farmers in FPO employee dashboard
  const [showCreateFarmer, setShowCreateFarmer] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [showFarmerView, setShowFarmerView] = useState(false);
  const [farmerViewData, setFarmerViewData] = useState(null);
  const [tab, setTab] = useState('pending'); // pending | approved | all
  const [search, setSearch] = useState('');
  // Photo upload state (persisted in localStorage)
  const [userPhoto, setUserPhoto] = useState(null);
  const fileInputRef = useRef(null);

  const employeeFpoId = user?.fpoId || user?.assignedFpoId || user?.fpo?.id || user?.fpo?.fpoId;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (employeeFpoId) {
          const info = await fpoAPI.getFPOById(employeeFpoId);
          setFpo(info);
        }
        // Load FPO members and enrich with farmer details
        const members = await fpoAPI.getFPOMembers(employeeFpoId);
        const base = (members || []).map((m, idx) => ({
          id: m.id || idx + 1,
          memberId: m.id,
          farmerId: m.farmerId,
          name: m.farmerName || m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim(),
          phone: '-',
          email: '-',
          kycStatus: (m.status || 'PENDING').toUpperCase(),
          raw: m
        }));
        const enriched = await Promise.all(base.map(async (row) => {
          if (!row.farmerId) return row;
          try {
            const dto = await farmersAPI.getFarmerById(row.farmerId);
            return {
              ...row,
              name: dto?.firstName ? `${dto.firstName} ${dto.lastName || ''}`.trim() : (row.name || '-'),
              phone: dto?.contactNumber || row.phone,
              email: dto?.email || row.email,
              kycStatus: (dto?.status || row.kycStatus || 'PENDING').toUpperCase(),
            };
          } catch {
            return row;
          }
        }));
        setFarmers(enriched);

        // Note: FPO employee dashboard intentionally does not show Employees list
      } catch (e) {
        console.error(e);
        setError('Failed to load FPO employee dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [employeeFpoId]);

  // Load saved photo
  useEffect(() => {
    try {
      const savedPhoto = localStorage.getItem('userProfilePhoto:FPO_EMPLOYEE');
      if (savedPhoto) setUserPhoto(savedPhoto);
    } catch {}
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please upload an image'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      if (typeof data === 'string') {
        setUserPhoto(data);
        try { localStorage.setItem('userProfilePhoto', data); } catch {}
      }
    };
    reader.onerror = () => alert('Error reading the file');
    reader.readAsDataURL(file);
  };

  const handlePhotoClick = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const handleRemovePhoto = () => { setUserPhoto(null); try { localStorage.removeItem('userProfilePhoto:FPO_EMPLOYEE'); } catch {} };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return farmers.filter(f => {
      const byTab = tab === 'all' ? true : tab === 'pending' ? (f.kycStatus !== 'APPROVED') : (f.kycStatus === 'APPROVED');
      if (!byTab) return false;
      if (!q) return true;
      return (f.name || '').toLowerCase().includes(q) || (f.phone || '').toLowerCase().includes(q) || (f.email || '').toLowerCase().includes(q);
    });
  }, [farmers, tab, search]);

  const stats = useMemo(() => {
    const total = farmers.length;
    const approved = farmers.filter(f => f.kycStatus === 'APPROVED').length;
    const pending = total - approved;
    return { total, approved, pending };
  }, [farmers]);

  const approveKyc = async (farmer) => {
    try {
      await kycAPI.approveFarmerKyc(farmer.id);
      setFarmers(prev => prev.map(x => x.id === farmer.id ? { ...x, kycStatus: 'APPROVED' } : x));
    } catch (e) {
      alert('Failed to approve KYC');
    }
  };

  const rejectKyc = async (farmer) => {
    try {
      await kycAPI.rejectFarmerKyc(farmer.id, 'Rejected by employee');
      setFarmers(prev => prev.map(x => x.id === farmer.id ? { ...x, kycStatus: 'REJECTED' } : x));
    } catch (e) {
      alert('Failed to reject KYC');
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner" /><span>Loading FPO Employee Dashboard…</span></div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <h1 className="logo-title">DATE</h1>
            <p className="logo-subtitle">Digital Agristack</p>
          </div>
        </div>
        <div className="header-right">
          <div className="user-profile-dropdown">
            <div className="user-profile-trigger">
              <div className="user-avatar user-avatar-with-upload" onClick={handlePhotoClick}>
                {userPhoto ? (
                  <img src={userPhoto} alt="Profile" className="user-avatar-photo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <div className="user-avatar-initials">{(user?.name || 'E').charAt(0)}</div>
                )}
                <div className="avatar-upload-overlay"><i className="fas fa-camera"></i></div>
              </div>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-welcome">Welcome!!!</h2>
          <div className="sidebar-role">FPO Employee</div>
        </div>
        <div className="sidebar-nav">
          <div className={`nav-item ${view === 'farmers' ? 'active' : ''}`} onClick={() => setView('farmers')}>
            <i className="fas fa-users" />
            <span>Farmers</span>
          </div>
          <div className={`nav-item ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
            <i className="fas fa-user-clock" />
            <span>Pending KYC</span>
          </div>
          <div className={`nav-item ${tab === 'approved' ? 'active' : ''}`} onClick={() => setTab('approved')}>
            <i className="fas fa-user-check" />
            <span>Approved</span>
          </div>
          <div className={`nav-item ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
            <i className="fas fa-users" />
            <span>All Farmers</span>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="welcome-section">
          <h1 className="welcome-title">{fpo?.fpoName || 'FPO'} — Employee</h1>
          <p className="welcome-subtitle">Manage KYC for farmers under this FPO.</p>
        </div>

        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-icon"><i className="fas fa-users" /></div>
            <div className="stats-content">
              <div className="stats-value">{stats.total}</div>
              <div className="stats-label">Total Farmers</div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-icon"><i className="fas fa-user-check" /></div>
            <div className="stats-content">
              <div className="stats-value">{stats.approved}</div>
              <div className="stats-label">KYC Approved</div>
            </div>
          </div>
          <div className="stats-card">
            <div className="stats-icon"><i className="fas fa-user-clock" /></div>
            <div className="stats-content">
              <div className="stats-value">{stats.pending}</div>
              <div className="stats-label">Pending KYC</div>
            </div>
          </div>
        </div>

        {view === 'farmers' && (
        <section className="panel" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ marginTop: 0 }}>Farmers</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search name/phone/email" style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
              <button className="btn" onClick={() => setSearch('')}>Clear</button>
              <button className="btn primary" onClick={() => setShowCreateFarmer(true)}>Add Farmer</button>
            </div>
          </div>
          <table className="fpo-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>KYC Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>{f.name}</td>
                  <td>{f.phone}</td>
                  <td>{f.email}</td>
                  <td>{f.kycStatus}</td>
                  <td>
                    <div className="action-dropdown" style={{ position: 'relative' }}>
                      <button className="dropdown-toggle">⋯</button>
                      <div className="dropdown-menu-enhanced" style={{ position: 'absolute', right: 0 }}>
                        <button className="dropdown-item" onClick={async () => {
                          try {
                            const dto = await farmersAPI.getFarmerById(f.farmerId || f.id);
                            setFarmerViewData(dto);
                            setShowFarmerView(true);
                          } catch (e) { alert('Failed to load farmer'); }
                        }}>View</button>
                        {f.kycStatus !== 'APPROVED' && (
                          <>
                            <button className="dropdown-item" onClick={() => { setSelectedFarmer(f); setShowKycModal(true); }}>Review & Approve</button>
                            <button className="dropdown-item" onClick={() => rejectKyc(f)}>Reject KYC</button>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b' }}>No farmers</td></tr>
              )}
            </tbody>
          </table>
        </section>
        )}

        {showCreateFarmer && (
          <div className="form-modal-overlay">
            <div className="form-modal-content" style={{ width: '90%', maxWidth: 1100 }}>
              <div className="form-modal-header">
                <h3>Create Farmer</h3>
                <button className="close-btn" onClick={() => setShowCreateFarmer(false)}>×</button>
              </div>
              <div className="form-modal-body">
                <FarmerRegistrationForm 
                  isInDashboard
                  onClose={() => setShowCreateFarmer(false)}
                  onSubmit={async (formData) => {
                    setShowCreateFarmer(false);
                    // reload farmers after slight delay
                    setTimeout(async () => {
                      try {
                        // Persist farmer under this FPO
                        const created = await farmersAPI.createFarmer({ ...formData, fpoId: employeeFpoId });
                        // Assign farmer to this employee so KYC approve endpoint authorizes
                        try {
                          const me = user?.email;
                          // Use admin endpoint to assign by ids if available
                          const employeeId = user?.id || user?.employeeId;
                          if (employeeId && (created?.id || created?.farmerId)) {
                            // Fallback assignment via admin endpoint
                            await (await import('../api/apiService')).adminAPI?.assignFarmerToEmployee?.(created.id || created.farmerId, employeeId);
                          }
                        } catch (assignErr) { console.warn('Assignment skipped', assignErr); }
                        // Link farmer as FPO member so it appears in this dashboard
                        try {
                          await fpoAPI.addMemberToFPO(employeeFpoId, { memberType: 'FARMER', farmerId: created?.id || created?.farmerId || created?.farmer?.id });
                        } catch (linkErr) {
                          console.warn('Failed to link farmer as FPO member', linkErr);
                        }
                        const members = await fpoAPI.getFPOMembers(employeeFpoId);
                        const base = (members || []).map((m, idx) => ({
                          id: m.id || idx + 1,
                          memberId: m.id,
                          farmerId: m.farmerId,
                          name: m.farmerName || m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim(),
                          phone: '-',
                          email: '-',
                          kycStatus: (m.status || 'PENDING').toUpperCase(),
                          raw: m
                        }));
                        const enriched = await Promise.all(base.map(async (row) => {
                          if (!row.farmerId) return row;
                          try {
                            const dto = await farmersAPI.getFarmerById(row.farmerId);
                            return {
                              ...row,
                              name: dto?.firstName ? `${dto.firstName} ${dto.lastName || ''}`.trim() : (row.name || '-'),
                              phone: dto?.contactNumber || row.phone,
                              email: dto?.email || row.email,
                              kycStatus: (dto?.status || row.kycStatus || 'PENDING').toUpperCase(),
                            };
                          } catch { return row; }
                        }));
                        setFarmers(enriched);
                      } catch {}
                    }, 500);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {showKycModal && selectedFarmer && (
          <KYCModal
            farmer={{
              id: selectedFarmer.farmerId || selectedFarmer.id,
              name: selectedFarmer.name,
              phone: selectedFarmer.phone,
              location: fpo?.district || '',
              kycStatus: selectedFarmer.kycStatus
            }}
            onClose={() => { setShowKycModal(false); setSelectedFarmer(null); }}
            onApprove={async (farmerId, docs) => {
              try {
                await kycAPI.approveKYC?.(farmerId) || await kycAPI.approveFarmerKyc?.(farmerId, docs);
                setFarmers(prev => prev.map(x => (x.farmerId === farmerId || x.id === farmerId) ? { ...x, kycStatus: 'APPROVED' } : x));
              } catch (e) { alert('Failed to approve'); }
            }}
            onReject={async (farmerId, reason) => {
              try { await kycAPI.rejectKYC?.(farmerId, { reason }) || await kycAPI.rejectFarmerKyc?.(farmerId, reason); setFarmers(prev => prev.map(x => (x.farmerId === farmerId || x.id === farmerId) ? { ...x, kycStatus: 'REJECTED' } : x)); } catch (e) { alert('Failed to reject'); }
            }}
            onReferBack={async (farmerId, reason) => {
              try { await kycAPI.referBackKYC?.(farmerId, { reason }) || await kycAPI.referBackFarmerKyc?.(farmerId, reason); } catch (e) { console.log('Refer-back not implemented'); }
            }}
          />
        )}

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
              </div>
            </div>
          </div>
        )}

        {/* Employees section intentionally removed for FPO Employee dashboard */}
      </div>
    </div>
  );
};

export default FPOEmployeeDashboard;


