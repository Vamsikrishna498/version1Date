import React, { useEffect, useMemo, useState } from 'react';
import { companiesAPI } from '../api/apiService';
import { buildCompanyLogoCandidates } from '../contexts/BrandingContext';

const initial = { name: '', shortName: '', email: '', phone: '', defaultTimezone: 'Asia/Kolkata', status: 'ACTIVE' };

const CompaniesTab = () => {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(initial);
  const [selected, setSelected] = useState(null);
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({ dark: null, light: null, smallDark: null, smallLight: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }

  const load = async () => {
    try {
      setLoading(true);
      const res = await companiesAPI.list().catch(() => []);
      setCompanies(Array.isArray(res) ? res : []);
    } catch (e) {
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getCurrentTenant = () => {
    try {
      const t = localStorage.getItem('tenant');
      return t && t.trim() ? t.trim() : null;
    } catch {
      return null;
    }
  };

  const [activeTenant, setActiveTenant] = useState(getCurrentTenant());

  const setActiveCompany = (company) => {
    try {
      const t = (company?.shortName || company?.name || '').toString().trim();
      if (!t) return;
      localStorage.setItem('tenant', t);
      setActiveTenant(t);
      try { window.dispatchEvent(new Event('branding:refresh')); } catch {}
      setToast({ type: 'success', message: `Active company set to ${company?.name || t}` });
    } catch (e) {
      setToast({ type: 'error', message: 'Failed to set active company' });
    }
  };

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      // Basic required validation
      if (!form.name || !form.shortName || !form.email || !form.phone) {
        setError('Please fill in all required fields.');
        setLoading(false);
        return;
      }
      const payload = { ...form, adminEmail: admin.email, adminPassword: admin.password };
      let saved;
      if (selected?.id) saved = await companiesAPI.update(selected.id, payload);
      else saved = await companiesAPI.create(payload);
      setSelected(saved);
      // Upload logos if provided
      if ((files.dark || files.light || files.smallDark || files.smallLight) && saved?.id) {
        try { 
          await companiesAPI.uploadLogos(saved.id, files);
          // Notify app to refresh branding (login page, headers, etc.)
          try { window.dispatchEvent(new Event('branding:refresh')); } catch {}
        } catch {}
      }
      // Persist active tenant for immediate branding on login page and dashboards
      try { if (saved?.shortName) localStorage.setItem('tenant', (saved.shortName || '').toString().trim()); } catch {}
      await load();
      try { window.dispatchEvent(new Event('branding:refresh')); } catch {}
      setToast({ type: 'success', message: selected?.id ? 'Company updated' : 'Company created' });
      setOpen(false);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Save failed';
      setError(msg);
      setToast({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selected?.id) return;
    setLoading(true);
    try {
      await companiesAPI.uploadLogos(selected.id, files);
      await load();
      try { window.dispatchEvent(new Event('branding:refresh')); } catch {}
    } catch (e) {
      setError('Logo upload failed');
    } finally {
      setLoading(false);
    }
  };

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('basic');
  const [admin, setAdmin] = useState({ email: '', password: '' });

  const openCreate = () => { setSelected(null); setForm(initial); setFiles({}); setOpen(true); };

  const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:8080/api');
  const apiOrigin = apiBase.replace(/\/?api\/?$/, '');

  // Ensure image URLs update immediately after upload by appending a cache-busting query param
  const addCacheBust = (url, ver) => {
    if (!url) return url;
    const sep = url.includes('?') ? '&' : '?';
    const version = ver ?? Date.now();
    return `${url}${sep}v=${version}`;
  };

  const buildCandidates = (c) => buildCompanyLogoCandidates(c, apiOrigin);

  const LogoCell = ({ company }) => {
    const candidates = buildCandidates(company);
    const [idx, setIdx] = useState(0);
    const [hasError, setHasError] = useState(false);
    
    // Debug logging
    console.log('LogoCell Debug:', {
      company: company?.name,
      companyId: company?.id,
      logoLight: company?.logoLight,
      logoDark: company?.logoDark,
      logoSmallLight: company?.logoSmallLight,
      logoSmallDark: company?.logoSmallDark,
      candidates: candidates,
      candidatesLength: candidates.length
    });
    
    // If no candidates or all failed to load, show a placeholder
    if (candidates.length === 0 || (hasError && idx >= candidates.length - 1)) {
      return (
        <div style={{ 
          height: 40, 
          width: 120, 
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', 
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #d1d5db',
          color: '#6b7280',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {company?.name ? company.name.charAt(0).toUpperCase() : '🏢'}
        </div>
      );
    }
    
    return (
      <img
        src={candidates[idx]}
        alt={company?.name || 'Company Logo'}
        style={{ 
          height: 40, 
          width: 120,
          objectFit: 'contain',
          borderRadius: 6,
          border: '1px solid #e5e7eb',
          background: '#fff',
          padding: '4px'
        }}
        onError={(e) => {
          console.log('Logo load error for company:', company?.name, 'candidate:', candidates[idx], 'error:', e);
          if (idx < candidates.length - 1) {
            setIdx(idx + 1);
          } else {
            setHasError(true);
          }
        }}
        onLoad={() => {
          console.log('Logo loaded successfully for company:', company?.name, 'candidate:', candidates[idx]);
          setHasError(false);
        }}
      />
    );
  };

  const updateFile = (key, file) => {
    setFiles(prev => ({ ...prev, [key]: file }));
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [key]: url }));
    } else {
      setPreviews(prev => ({ ...prev, [key]: null }));
    }
  };

  const UploaderBox = ({ title, keyName }) => {
    // pick field specific existing value
    const fieldValue = selected ? (
      keyName === 'dark' ? selected.logoDark :
      keyName === 'light' ? selected.logoLight :
      keyName === 'smallDark' ? selected.logoSmallDark :
      selected.logoSmallLight
    ) : null;
    let existing = null;
    if (selected && fieldValue) {
      const tail = (fieldValue || '').split('/').pop();
      const cid = selected.id || selected.companyId || selected.companyID;
      const version = selected?.updatedAt || selected?.logoUpdatedAt || Date.now();
      const candidates = cid ? [
        `${apiOrigin}/api/public/uploads/company-logos/${cid}/${tail}`,
        `${apiOrigin}/uploads/company-logos/${cid}/${tail}`,
        `${apiOrigin}/uploads/${fieldValue}`
      ] : [`${apiOrigin}/uploads/${fieldValue}`];
      // pick first candidate and append cache-busting param
      existing = `${candidates[0]}?v=${version}`;
    }
    const showUrl = previews[keyName] || existing || null;
    return (
      <div className="uploader" style={{ border: '2px dashed #d1d5db', borderRadius: 10, padding: 16, width: '100%', height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <input id={`file-${keyName}`} type="file" accept="image/*" onChange={e => updateFile(keyName, e.target.files?.[0])} style={{ display: 'none' }} />
        <label htmlFor={`file-${keyName}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 140, height: 140, background: '#f9fafb', borderRadius: 8, border: '1px dashed #d1d5db' }}>
          {showUrl ? (
            <img src={showUrl} alt={`${title} preview`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>+</div>
              <div>Upload</div>
            </div>
          )}
        </label>
        {!previews[keyName] && fieldValue ? (
          <div style={{ fontSize: 12, color: '#6b7280', maxWidth: 160, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fieldValue}</div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="companies-tab">
      {/* Show form inline when creating/editing */}
      {open ? (
        <div className="company-form-section">
          <div className="form-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{selected?.id ? 'Edit Company' : 'Add New Company'}</div>
              <div style={{ color: '#6b7280' }}>Dashboard - Companies - {selected?.id ? 'Edit' : 'Add New'}</div>
            </div>
            <button 
              className="secondary" 
              onClick={() => {
                setOpen(false);
                setSelected(null);
                setForm(initial);
                setFiles({});
                setAdmin({ email: '', password: '' });
                setTab('basic');
              }}
              style={{ padding: '10px 16px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 8 }}
            >
              <i className="fas fa-arrow-left"></i> Back to Companies
            </button>
          </div>

          {error && <div className="error-message" style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 20, border: '1px solid #fecaca' }}>{error}</div>}
          {toast && (
            <div className={`toast ${toast.type}`} style={{ position: 'fixed', right: 16, bottom: 16, background: toast.type === 'success' ? '#16a34a' : '#dc2626', color: '#fff', padding: '10px 14px', borderRadius: 8, zIndex: 1000 }}>
              {toast.message}
            </div>
          )}

          <div className="form-container" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb' }}>
              <button 
                onClick={() => setTab('basic')} 
                style={{ 
                  border: 'none', 
                  background: tab === 'basic' ? '#f8fafc' : 'transparent', 
                  padding: '16px 24px', 
                  fontWeight: 600, 
                  color: tab === 'basic' ? '#0ea5e9' : '#374151', 
                  borderBottom: tab === 'basic' ? '3px solid #0ea5e9' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Basic Details
              </button>
              <button 
                onClick={() => setTab('logo')} 
                style={{ 
                  border: 'none', 
                  background: tab === 'logo' ? '#f8fafc' : 'transparent', 
                  padding: '16px 24px', 
                  fontWeight: 600, 
                  color: tab === 'logo' ? '#0ea5e9' : '#374151', 
                  borderBottom: tab === 'logo' ? '3px solid #0ea5e9' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Company Logo
              </button>
            </div>

            <div className="form-content" style={{ padding: 32 }}>
              {tab === 'basic' && (
                <div>
                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                    <div className="field">
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                        Company Name<span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        placeholder="Please Enter Company Name" 
                        value={form.name} 
                        onChange={e => setForm({ ...form, name: e.target.value })} 
                        className="input" 
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} 
                      />
                    </div>
                    <div className="field">
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                        Company Short Name<span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        placeholder="Please Enter Company Short Name" 
                        value={form.shortName} 
                        onChange={e => setForm({ ...form, shortName: e.target.value })} 
                        className="input" 
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} 
                      />
                    </div>
                    <div className="field">
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                        Company Email<span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        placeholder="Please Enter Company Email" 
                        value={form.email} 
                        onChange={e => setForm({ ...form, email: e.target.value })} 
                        className="input" 
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} 
                      />
                    </div>
                    <div className="field">
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                        Company Phone<span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        placeholder="Please Enter Company Phone" 
                        value={form.phone} 
                        onChange={e => setForm({ ...form, phone: e.target.value })} 
                        className="input" 
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} 
                      />
                    </div>
                    <div className="field">
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                        Default Timezone<span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select 
                        value={form.defaultTimezone} 
                        onChange={e => setForm({ ...form, defaultTimezone: e.target.value })} 
                        className="input" 
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata</option>
                        <option value="UTC">UTC</option>
                        <option value="Asia/Dubai">Asia/Dubai</option>
                      </select>
                    </div>
                    <div className="field">
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                        Status<span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select 
                        value={form.status} 
                        onChange={e => setForm({ ...form, status: e.target.value })} 
                        className="input" 
                        style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="field" style={{ marginBottom: 32 }}>
                    <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Company Address</label>
                    <textarea 
                      placeholder="Please Enter Company Address" 
                      value={form.address || ''} 
                      onChange={e => setForm({ ...form, address: e.target.value })} 
                      className="input" 
                      style={{ width: '100%', minHeight: 100, padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical' }} 
                    />
                  </div>

                  {/* Admin Account Details */}
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 32 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#374151' }}>Admin Account Details</div>
                    <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      <div className="field">
                        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                          Email<span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input 
                          placeholder="Please Enter Email" 
                          value={admin.email} 
                          onChange={e => setAdmin({ ...admin, email: e.target.value })} 
                          className="input" 
                          style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} 
                        />
                      </div>
                      <div className="field">
                        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                          Password<span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input 
                          type="password" 
                          placeholder="Please Enter Password" 
                          value={admin.password} 
                          onChange={e => setAdmin({ ...admin, password: e.target.value })} 
                          className="input" 
                          style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} 
                        />
                      </div>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 14, marginTop: 12 }}>
                      Admin will login using this password. (Leave blank to keep current password)
                    </div>
                  </div>
                </div>
              )}

              {tab === 'logo' && (
                <div>
                  <div className="logo-uploader-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <UploaderBox title="Dark Logo" keyName="dark" />
                    <UploaderBox title="Light Logo" keyName="light" />
                    <UploaderBox title="Small Dark Logo" keyName="smallDark" />
                    <UploaderBox title="Small Light Logo" keyName="smallLight" />
                  </div>
                </div>
              )}
            </div>

            <div className="form-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, padding: '24px 32px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
              <button 
                className="secondary" 
                onClick={() => {
                  setOpen(false);
                  setSelected(null);
                  setForm(initial);
                  setFiles({});
                  setAdmin({ email: '', password: '' });
                  setTab('basic');
                }} 
                style={{ 
                  padding: '12px 24px', 
                  border: '1px solid #d1d5db', 
                  background: '#fff', 
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={loading} 
                style={{ 
                  padding: '12px 24px', 
                  background: '#2563eb', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 8, 
                  opacity: loading ? 0.7 : 1,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Saving...' : (selected?.id ? 'Update Company' : 'Create Company')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Show companies list when not creating/editing */
        <>
          <div className="tab-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '20px 0' }}>
        <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>Companies</div>
              <div style={{ color: '#6b7280', fontSize: 14 }}>Dashboard - Companies</div>
        </div>
            <button 
              onClick={openCreate}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '14px 24px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
            >
              <i className="fas fa-plus" style={{ fontSize: '14px' }}></i>
              Add New Company
            </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {toast && (
        <div className={`toast ${toast.type}`} style={{ position: 'fixed', right: 16, bottom: 16, background: toast.type === 'success' ? '#16a34a' : '#dc2626', color: '#fff', padding: '10px 14px', borderRadius: 8 }}>
          {toast.message}
        </div>
      )}

          <div className="card" style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
        <div className="table" role="table">
              <div className="thead" role="row" style={{ 
                display: 'grid', 
                gridTemplateColumns: '180px 1fr 1fr 1.4fr 1fr 140px 120px 140px 140px', 
                padding: '20px 24px', 
                fontWeight: '700', 
                color: '#1e293b', 
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                borderBottom: '2px solid #e2e8f0',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
            <div>Company Logo</div>
            <div>Company Name</div>
            <div>Company Email</div>
            <div>Details</div>
            <div>Subscription Plan</div>
            <div>Status</div>
            <div>Action</div>
            <div>Activate</div>
          </div>
          {companies.length === 0 && (
                <div style={{ 
                  padding: '60px 24px', 
                  color: '#64748b', 
                  textAlign: 'center',
                  fontSize: '16px',
                  background: '#fafbfc'
                }}>
                  <div style={{ marginBottom: '12px', fontSize: '48px', opacity: 0.5 }}>🏢</div>
                  No companies found.
                </div>
              )}
              {companies.map((c, index) => (
                <div 
                  key={c.id} 
                  className="tbody-row" 
                  role="row" 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '180px 1fr 1fr 1.4fr 1fr 140px 120px 140px 140px', 
                    alignItems: 'center', 
                    padding: '20px 24px', 
                    borderBottom: '1px solid #f1f5f9',
                    background: index % 2 === 0 ? '#ffffff' : '#fafbfc',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f8fafc';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = index % 2 === 0 ? '#ffffff' : '#fafbfc';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
              <div>
                <LogoCell company={c} />
              </div>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>{c.name}</div>
                  <div style={{ color: '#64748b', fontSize: '14px' }}>{c.email}</div>
                  <div style={{ color: '#475569', fontSize: '13px' }}>
                    <div style={{ marginBottom: '4px' }}>
                      Verified: <span style={{ color: '#dc2626', fontWeight: '600' }}>✗</span>
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      Register Date: <span style={{ fontWeight: '500' }}>{new Date(c.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div>
                      Total Users: <span style={{ fontWeight: '600', color: '#3b82f6' }}>{c.totalUsers || 0}</span>
                    </div>
              </div>
              <div>
                    <div style={{ marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>Trial (monthly)</div>
                    <button 
                      className="secondary" 
                      style={{ 
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      Change
                    </button>
              </div>
              <div>
                    <span style={{ 
                      padding: '8px 16px', 
                      borderRadius: '20px', 
                      background: c.status === 'ACTIVE' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', 
                      color: c.status === 'ACTIVE' ? '#166534' : '#991b1b',
                      fontWeight: '600',
                      fontSize: '12px',
                      border: `1px solid ${c.status === 'ACTIVE' ? '#bbf7d0' : '#fecaca'}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                  {c.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      title="Edit" 
                      onClick={() => { 
                  setSelected(c); setForm({ ...c }); setOpen(true); 
                  // Preview this company's branding immediately across app/login
                  try { if (c?.shortName) localStorage.setItem('tenant', (c.shortName || '').toString().trim()); } catch {}
                  try { window.dispatchEvent(new Event('branding:refresh')); } catch {}
                      }} 
                      style={{ 
                        padding: '10px',
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        border: '1px solid #93c5fd',
                        borderRadius: '8px',
                        color: '#1d4ed8',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      ✎
                    </button>
                    <button 
                      title="Delete" 
                      onClick={async () => {
                  if (!window.confirm(`Delete company "${c.name}"? This will also delete all associated users. This action cannot be undone.`)) return;
                  try {
                    const response = await companiesAPI.remove(c.id);
                    setToast({ type: 'success', message: response.message || 'Company deleted successfully' });
                    await load();
                  } catch (e) {
                    const errorMessage = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Failed to delete company';
                    console.error('Delete company error:', e);
                    setToast({ type: 'error', message: errorMessage });
                  }
                      }} 
                      style={{ 
                        padding: '10px',
                        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                        border: '1px solid #fca5a5',
                        borderRadius: '8px',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      🗑
                    </button>
              </div>
              <div>
                {activeTenant && (activeTenant === (c?.shortName || c?.name)) ? (
                      <span style={{ 
                        padding: '8px 16px', 
                        borderRadius: '8px', 
                        background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', 
                        color: '#166534', 
                        fontWeight: '700',
                        fontSize: '12px',
                        border: '1px solid #bbf7d0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Current
                      </span>
                    ) : (
                      <button 
                        className="primary" 
                        onClick={() => setActiveCompany(c)} 
                        style={{ 
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontWeight: '600',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        Set Active
                      </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default CompaniesTab;

