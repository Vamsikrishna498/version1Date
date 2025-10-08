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
  
  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
    if (candidates.length === 0) return <div style={{ height: 40, width: 120, background: '#f3f4f6', borderRadius: 6 }} />;
    return (
      <img
        src={candidates[idx]}
        alt={company.name}
        style={{ height: 40, objectFit: 'contain' }}
        onError={() => {
          if (idx < candidates.length - 1) setIdx(idx + 1);
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
      <div className="tab-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>Companies</div>
          <div style={{ color: '#6b7280' }}>Dashboard - Companies</div>
        </div>
        <button className="primary" onClick={openCreate}>+ Add New Company</button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {toast && (
        <div className={`toast ${toast.type}`} style={{ 
          position: 'fixed', 
          top: 20, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          background: toast.type === 'success' ? '#16a34a' : '#dc2626', 
          color: '#fff', 
          padding: '12px 20px 12px 20px', 
          borderRadius: 8, 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '400px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#fff', 
              cursor: 'pointer', 
              fontSize: '16px', 
              padding: '0', 
              marginLeft: '8px',
              opacity: 0.8,
              lineHeight: 1
            }}
            onMouseOver={(e) => e.target.style.opacity = '1'}
            onMouseOut={(e) => e.target.style.opacity = '0.8'}
          >
            ×
          </button>
        </div>
      )}

      <div className="card" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div className="table" role="table">
          <div className="thead" role="row" style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr 140px 120px 140px 140px', padding: '12px 16px', fontWeight: 600, color: '#374151', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <div>Company Logo</div>
            <div>Company Name</div>
            <div>Company Email</div>
            <div>Status</div>
            <div>Action</div>
            <div>Activate</div>
          </div>
          {companies.length === 0 && (
            <div style={{ padding: 24, color: '#6b7280' }}>No companies found.</div>
          )}
          {companies.map(c => (
            <div key={c.id} className="tbody-row" role="row" style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr 140px 120px 140px 140px', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <LogoCell company={c} />
              </div>
              <div>{c.name}</div>
              <div>{c.email}</div>
              <div>
                <span style={{ padding: '6px 10px', borderRadius: 9999, background: c.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: c.status === 'ACTIVE' ? '#166534' : '#991b1b' }}>
                  {c.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button title="Edit" onClick={() => { 
                  setSelected(c); setForm({ ...c }); setOpen(true); 
                  // Preview this company's branding immediately across app/login
                  try { if (c?.shortName) localStorage.setItem('tenant', (c.shortName || '').toString().trim()); } catch {}
                  try { window.dispatchEvent(new Event('branding:refresh')); } catch {}
                }} style={{ padding: 8 }}>✎</button>
                <button title="Delete" onClick={async () => {
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
                }} style={{ padding: 8 }}>🗑</button>
              </div>
              <div>
                {activeTenant && (activeTenant === (c?.shortName || c?.name)) ? (
                  <span style={{ padding: '6px 10px', borderRadius: 8, background: '#dcfce7', color: '#166534', fontWeight: 600 }}>Current</span>
                ) : (
                  <button className="primary" onClick={() => setActiveCompany(c)} style={{ padding: '6px 10px' }}>Set Active</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: 820, maxWidth: '96vw' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="modal-title" style={{ fontSize: 20, fontWeight: 700 }}>{selected?.id ? 'Edit Company' : 'Add New Company'}</div>
              <button className="close" onClick={() => setOpen(false)}>×</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid #e5e7eb', marginTop: 6 }}>
              <button onClick={() => setTab('basic')} style={{ border: 'none', background: 'transparent', padding: '14px 4px', fontWeight: 600, color: tab === 'basic' ? '#0ea5e9' : '#374151', borderBottom: tab === 'basic' ? '3px solid #0ea5e9' : '3px solid transparent' }}>Basic Details</button>
              <button onClick={() => setTab('logo')} style={{ border: 'none', background: 'transparent', padding: '14px 4px', fontWeight: 600, color: tab === 'logo' ? '#0ea5e9' : '#374151', borderBottom: tab === 'logo' ? '3px solid #0ea5e9' : '3px solid transparent' }}>Company Logo</button>
            </div>

            <div className="modal-content" style={{ padding: 20 }}>
              {tab === 'basic' && (
                <div>
                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="field"><label style={{ fontWeight: 600 }}>Company Name<span style={{ color: '#ef4444' }}>*</span></label><input placeholder="Please Enter Company Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" style={{ width: '100%' }} /></div>
                    <div className="field"><label style={{ fontWeight: 600 }}>Company Short Name<span style={{ color: '#ef4444' }}>*</span></label><input placeholder="Please Enter Company Short Name" value={form.shortName} onChange={e => setForm({ ...form, shortName: e.target.value })} className="input" style={{ width: '100%' }} /></div>
                    <div className="field"><label style={{ fontWeight: 600 }}>Company Email<span style={{ color: '#ef4444' }}>*</span></label><input placeholder="Please Enter Company Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" style={{ width: '100%' }} /></div>
                    <div className="field"><label style={{ fontWeight: 600 }}>Company Phone<span style={{ color: '#ef4444' }}>*</span></label><input placeholder="Please Enter Company Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" style={{ width: '100%' }} /></div>
                    <div className="field"><label style={{ fontWeight: 600 }}>Default Timezone<span style={{ color: '#ef4444' }}>*</span></label><select value={form.defaultTimezone} onChange={e => setForm({ ...form, defaultTimezone: e.target.value })} className="input" style={{ width: '100%' }}>
                      <option value="Asia/Kolkata">Asia/Kolkata</option>
                      <option value="UTC">UTC</option>
                      <option value="Asia/Dubai">Asia/Dubai</option>
                    </select></div>
                    <div className="field"><label style={{ fontWeight: 600 }}>Status<span style={{ color: '#ef4444' }}>*</span></label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input" style={{ width: '100%' }}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
                  </div>
                  <div className="field" style={{ marginTop: 16 }}>
                    <label style={{ fontWeight: 600 }}>Company Address</label>
                    <textarea placeholder="Please Enter Company Address" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} className="input" style={{ width: '100%', minHeight: 90 }} />
                  </div>
                  {/* Admin Account Details */}
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Admin Account Details</div>
                    <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="field"><label style={{ fontWeight: 600 }}>Email<span style={{ color: '#ef4444' }}>*</span></label><input placeholder="Please Enter Email" value={admin.email} onChange={e => setAdmin({ ...admin, email: e.target.value })} className="input" style={{ width: '100%' }} /></div>
                      <div className="field"><label style={{ fontWeight: 600 }}>Password<span style={{ color: '#ef4444' }}>*</span></label><input type="password" placeholder="Please Enter Password" value={admin.password} onChange={e => setAdmin({ ...admin, password: e.target.value })} className="input" style={{ width: '100%' }} /></div>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 13, marginTop: 6 }}>Admin will login using this password. (Leave blank to keep current password)</div>
                  </div>
                </div>
              )}

              {tab === 'logo' && (
                <div>
                  <div className="logo-uploader-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <UploaderBox title="Dark Logo" keyName="dark" />
                    <UploaderBox title="Light Logo" keyName="light" />
                    <UploaderBox title="Small Dark Logo" keyName="smallDark" />
                    <UploaderBox title="Small Light Logo" keyName="smallLight" />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: 16 }}>
              <button className="secondary" onClick={() => setOpen(false)} style={{ padding: '10px 16px' }}>Cancel</button>
              <button onClick={handleSave} disabled={loading} style={{ padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, opacity: loading ? 0.7 : 1 }}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesTab;

