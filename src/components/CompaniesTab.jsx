import React, { useEffect, useMemo, useState } from 'react';
import { companiesAPI, authAPI } from '../api/apiService';
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
  const [validationErrors, setValidationErrors] = useState({});
  
  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validateShortName = (shortName) => {
    const shortNameRegex = /^[a-zA-Z0-9_-]{2,20}$/;
    return shortNameRegex.test(shortName);
  };

  const validateField = (fieldName, value) => {
    const errors = { ...validationErrors };
    
    switch (fieldName) {
      case 'name':
        if (!value || value.trim().length === 0) {
          errors.name = 'Company name is required';
        } else if (value.trim().length < 2) {
          errors.name = 'Company name must be at least 2 characters';
        } else if (value.trim().length > 100) {
          errors.name = 'Company name must be less than 100 characters';
        } else {
          delete errors.name;
        }
        break;
        
      case 'shortName':
        if (!value || value.trim().length === 0) {
          errors.shortName = 'Company short name is required';
        } else if (!validateShortName(value.trim())) {
          errors.shortName = 'Short name must be 2-20 characters, letters, numbers, hyphens, and underscores only';
        } else {
          delete errors.shortName;
        }
        break;
        
      case 'email':
        if (!value || value.trim().length === 0) {
          errors.email = 'Company email is required';
        } else if (!validateEmail(value.trim())) {
          errors.email = 'Please enter a valid email address';
        } else {
          delete errors.email;
        }
        break;
        
      case 'phone':
        if (!value || value.trim().length === 0) {
          errors.phone = 'Company phone is required';
        } else if (!validatePhone(value.trim())) {
          errors.phone = 'Please enter a valid phone number';
        } else {
          delete errors.phone;
        }
        break;
        
      case 'adminEmail':
        if (!value || value.trim().length === 0) {
          errors.adminEmail = 'Admin email is required';
        } else if (!validateEmail(value.trim())) {
          errors.adminEmail = 'Please enter a valid admin email address';
        } else {
          delete errors.adminEmail;
        }
        break;
        
      case 'adminPassword':
        if (!value || value.trim().length === 0) {
          errors.adminPassword = 'Admin password is required';
        } else if (value.trim().length < 6) {
          errors.adminPassword = 'Admin password must be at least 6 characters';
        } else if (value.trim().length > 50) {
          errors.adminPassword = 'Admin password must be less than 50 characters';
        } else {
          delete errors.adminPassword;
        }
        break;
        
      default:
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = async () => {
    const fieldsToValidate = ['name', 'shortName', 'email', 'phone', 'adminEmail', 'adminPassword'];
    let isValid = true;
    
    fieldsToValidate.forEach(field => {
      const fieldValid = validateField(field, field === 'adminEmail' ? admin.email : field === 'adminPassword' ? admin.password : form[field]);
      if (!fieldValid) isValid = false;
    });
    
    // Check for duplicates against existing companies
    if (isValid) {
      const duplicateName = companies.find(c => c.name.toLowerCase() === form.name.toLowerCase() && (!selected || c.id !== selected.id));
      const duplicateShortName = companies.find(c => c.shortName.toLowerCase() === form.shortName.toLowerCase() && (!selected || c.id !== selected.id));
      const duplicateEmail = companies.find(c => c.email.toLowerCase() === form.email.toLowerCase() && (!selected || c.id !== selected.id));
      
      if (duplicateName) {
        setValidationErrors(prev => ({ ...prev, name: 'Company name already exists. Please choose a different name.' }));
        isValid = false;
      }
      if (duplicateShortName) {
        setValidationErrors(prev => ({ ...prev, shortName: 'Company short name already exists. Please choose a different short name.' }));
        isValid = false;
      }
      if (duplicateEmail) {
        setValidationErrors(prev => ({ ...prev, email: 'Company email already exists. Please choose a different email.' }));
        isValid = false;
      }

      // Check for admin email duplicates if provided
      if (admin.email && admin.email.trim()) {
        try {
          const emailCheck = await authAPI.checkEmailAvailability(admin.email);
          if (!emailCheck.available) {
            setValidationErrors(prev => ({ ...prev, adminEmail: 'Admin email already exists. Please choose a different email.' }));
            isValid = false;
          }
        } catch (error) {
          console.warn('Could not check admin email availability:', error);
          // Continue with validation even if email check fails
        }
      }
    }
    
    return isValid;
  };
  
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
      // Validate all fields
      const isFormValid = await validateForm();
      if (!isFormValid) {
        setError('Please fix all validation errors before saving.');
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
      
      // Clear validation errors on success
      setValidationErrors({});
      setToast({ type: 'success', message: selected?.id ? 'Company updated successfully' : 'Company created successfully' });
      setOpen(false);
    } catch (e) {
      // Handle specific validation errors from backend
      let errorMessage = 'Save failed';
      
      if (e?.response?.data?.error) {
        // Backend validation error (e.g., duplicate company name)
        errorMessage = e.response.data.error;
        
        // Parse the error message to show field-specific validation
        if (errorMessage.includes('Company name') && errorMessage.includes('already exists')) {
          setValidationErrors(prev => ({ ...prev, name: 'Company name already exists. Please choose a different name.' }));
        } else if (errorMessage.includes('Company short name') && errorMessage.includes('already exists')) {
          setValidationErrors(prev => ({ ...prev, shortName: 'Company short name already exists. Please choose a different short name.' }));
        } else if (errorMessage.includes('Company email') && errorMessage.includes('already exists')) {
          setValidationErrors(prev => ({ ...prev, email: 'Company email already exists. Please choose a different email.' }));
        } else if (errorMessage.includes('Admin email') && errorMessage.includes('already exists')) {
          setValidationErrors(prev => ({ ...prev, adminEmail: 'Admin email already exists. Please choose a different email.' }));
        } else if (errorMessage.includes('Admin phone number') && errorMessage.includes('already exists')) {
          setValidationErrors(prev => ({ ...prev, phone: 'Admin phone number already exists. Please choose a different phone number.' }));
        }
      } else if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      setError(errorMessage);
      setToast({ type: 'error', message: errorMessage });
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

  const openCreate = () => { 
    setSelected(null); 
    setForm(initial); 
    setFiles({}); 
    setValidationErrors({});
    setOpen(true); 
  };

  const closeModal = () => {
    console.log('Closing modal');
    setOpen(false);
    setSelected(null);
    setForm(initial);
    setFiles({});
    setAdmin({ email: '', password: '' });
    setTab('basic');
    setValidationErrors({});
  };

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
    
    // Enhanced debug logging for staging environment
    console.log('LogoCell Debug:', {
      company: company?.name,
      companyId: company?.id,
      logoLight: company?.logoLight,
      logoDark: company?.logoDark,
      logoSmallLight: company?.logoSmallLight,
      logoSmallDark: company?.logoSmallDark,
      apiOrigin: apiOrigin,
      candidates: candidates,
      candidatesLength: candidates.length,
      environment: process.env.NODE_ENV,
      apiBase: apiBase
    });
    
    // Enhanced fallback mechanism for staging
    const fallbackLogo = () => {
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
    };
    
    // If no candidates or all failed to load, show a placeholder
    if (candidates.length === 0 || (hasError && idx >= candidates.length - 1)) {
      return fallbackLogo();
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
          console.log('Trying next candidate...');
          if (idx < candidates.length - 1) {
            setIdx(idx + 1);
          } else {
            console.log('All logo candidates failed, showing fallback');
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
              type="button"
              data-testid="back-to-companies-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Back to Companies button clicked');
                console.log('Current open state:', open);
                
                // Reset all state with callbacks to ensure proper updates
                setOpen(false);
                setSelected(null);
                setForm(initial);
                setFiles({});
                setAdmin({ email: '', password: '' });
                setTab('basic');
                setValidationErrors({});
                
                // Force a re-render by updating a dummy state
                setTimeout(() => {
                  console.log('Modal should be closed now');
                }, 0);
              }}
              style={{ 
                padding: '12px 20px', 
                border: '1px solid #d1d5db', 
                background: '#fff', 
                borderRadius: 8,
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                zIndex: 1000,
                position: 'relative',
                pointerEvents: 'auto',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f9fafb';
                e.target.style.borderColor = '#9ca3af';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#fff';
                e.target.style.borderColor = '#d1d5db';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.target.click();
                }
              }}
              aria-label="Back to Companies list"
              title="Back to Companies list"
            >
              <i className="fas fa-arrow-left" style={{ fontSize: '12px' }}></i> 
              Back to Companies
            </button>
          </div>

          {error && <div className="error-message" style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 20, border: '1px solid #fecaca' }}>{error}</div>}
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
                        onChange={e => {
                          setForm({ ...form, name: e.target.value });
                          validateField('name', e.target.value);
                          // Clear duplicate error if user changes the name
                          if (validationErrors.name && validationErrors.name.includes('already exists')) {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.name;
                              return newErrors;
                            });
                          }
                        }}
                        onBlur={e => {
                          validateField('name', e.target.value);
                          // Check for duplicates on blur
                          const duplicateName = companies.find(c => c.name.toLowerCase() === e.target.value.toLowerCase() && (!selected || c.id !== selected.id));
                          if (duplicateName) {
                            setValidationErrors(prev => ({ ...prev, name: 'Company name already exists. Please choose a different name.' }));
                          }
                        }}
                        className="input" 
                        style={{ 
                          width: '100%', 
                          padding: '12px 16px', 
                          border: `1px solid ${validationErrors.name ? '#ef4444' : '#d1d5db'}`, 
                          borderRadius: 8, 
                          fontSize: 14,
                          backgroundColor: validationErrors.name ? '#fef2f2' : '#fff'
                        }} 
                      />
                      {validationErrors.name && (
                        <div style={{ 
                          color: '#ef4444', 
                          fontSize: '12px', 
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>⚠️</span>
                          {validationErrors.name}
                        </div>
                      )}
                    </div>
                    <div className="field">
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                        Company Short Name<span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        placeholder="Please Enter Company Short Name" 
                        value={form.shortName} 
                        onChange={e => {
                          setForm({ ...form, shortName: e.target.value });
                          validateField('shortName', e.target.value);
                          // Clear duplicate error if user changes the short name
                          if (validationErrors.shortName && validationErrors.shortName.includes('already exists')) {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.shortName;
                              return newErrors;
                            });
                          }
                        }}
                        onBlur={e => {
                          validateField('shortName', e.target.value);
                          // Check for duplicates on blur
                          const duplicateShortName = companies.find(c => c.shortName.toLowerCase() === e.target.value.toLowerCase() && (!selected || c.id !== selected.id));
                          if (duplicateShortName) {
                            setValidationErrors(prev => ({ ...prev, shortName: 'Company short name already exists. Please choose a different short name.' }));
                          }
                        }}
                        className="input" 
                        style={{ 
                          width: '100%', 
                          padding: '12px 16px', 
                          border: `1px solid ${validationErrors.shortName ? '#ef4444' : '#d1d5db'}`, 
                          borderRadius: 8, 
                          fontSize: 14,
                          backgroundColor: validationErrors.shortName ? '#fef2f2' : '#fff'
                        }} 
                      />
                      {validationErrors.shortName && (
                        <div style={{ 
                          color: '#ef4444', 
                          fontSize: '12px', 
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>⚠️</span>
                          {validationErrors.shortName}
                        </div>
                      )}
                    </div>
                    <div className="field">
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                        Company Email<span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        type="email"
                        placeholder="Please Enter Company Email" 
                        value={form.email} 
                        onChange={e => {
                          setForm({ ...form, email: e.target.value });
                          validateField('email', e.target.value);
                          // Clear duplicate error if user changes the email
                          if (validationErrors.email && validationErrors.email.includes('already exists')) {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.email;
                              return newErrors;
                            });
                          }
                        }}
                        onBlur={e => {
                          validateField('email', e.target.value);
                          // Check for duplicates on blur
                          const duplicateEmail = companies.find(c => c.email.toLowerCase() === e.target.value.toLowerCase() && (!selected || c.id !== selected.id));
                          if (duplicateEmail) {
                            setValidationErrors(prev => ({ ...prev, email: 'Company email already exists. Please choose a different email.' }));
                          }
                        }}
                        className="input" 
                        style={{ 
                          width: '100%', 
                          padding: '12px 16px', 
                          border: `1px solid ${validationErrors.email ? '#ef4444' : '#d1d5db'}`, 
                          borderRadius: 8, 
                          fontSize: 14,
                          backgroundColor: validationErrors.email ? '#fef2f2' : '#fff'
                        }} 
                      />
                      {validationErrors.email && (
                        <div style={{ 
                          color: '#ef4444', 
                          fontSize: '12px', 
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>⚠️</span>
                          {validationErrors.email}
                        </div>
                      )}
                    </div>
                    <div className="field">
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                        Company Phone<span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        type="tel"
                        placeholder="Please Enter Company Phone" 
                        value={form.phone} 
                        onChange={e => {
                          setForm({ ...form, phone: e.target.value });
                          validateField('phone', e.target.value);
                        }}
                        onBlur={e => validateField('phone', e.target.value)}
                        className="input" 
                        style={{ 
                          width: '100%', 
                          padding: '12px 16px', 
                          border: `1px solid ${validationErrors.phone ? '#ef4444' : '#d1d5db'}`, 
                          borderRadius: 8, 
                          fontSize: 14,
                          backgroundColor: validationErrors.phone ? '#fef2f2' : '#fff'
                        }} 
                      />
                      {validationErrors.phone && (
                        <div style={{ 
                          color: '#ef4444', 
                          fontSize: '12px', 
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>⚠️</span>
                          {validationErrors.phone}
                        </div>
                      )}
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
                          type="email"
                          placeholder="Please Enter Email" 
                          value={admin.email} 
                          onChange={e => {
                            setAdmin({ ...admin, email: e.target.value });
                            validateField('adminEmail', e.target.value);
                            // Clear duplicate error if user changes the email
                            if (validationErrors.adminEmail && validationErrors.adminEmail.includes('already exists')) {
                              setValidationErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.adminEmail;
                                return newErrors;
                              });
                            }
                          }}
                          onBlur={async (e) => {
                            validateField('adminEmail', e.target.value);
                            // Check for admin email duplicates on blur
                            if (e.target.value && e.target.value.trim()) {
                              try {
                                const emailCheck = await authAPI.checkEmailAvailability(e.target.value);
                                if (!emailCheck.available) {
                                  setValidationErrors(prev => ({ ...prev, adminEmail: 'Admin email already exists. Please choose a different email.' }));
                                }
                              } catch (error) {
                                console.warn('Could not check admin email availability:', error);
                              }
                            }
                          }}
                          className="input" 
                          style={{ 
                            width: '100%', 
                            padding: '12px 16px', 
                            border: `1px solid ${validationErrors.adminEmail ? '#ef4444' : '#d1d5db'}`, 
                            borderRadius: 8, 
                            fontSize: 14,
                            backgroundColor: validationErrors.adminEmail ? '#fef2f2' : '#fff'
                          }} 
                        />
                        {validationErrors.adminEmail && (
                          <div style={{ 
                            color: '#ef4444', 
                            fontSize: '12px', 
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>⚠️</span>
                            {validationErrors.adminEmail}
                          </div>
                        )}
                      </div>
                      <div className="field">
                        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                          Password<span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input 
                          type="password" 
                          placeholder="Please Enter Password" 
                          value={admin.password} 
                          onChange={e => {
                            setAdmin({ ...admin, password: e.target.value });
                            validateField('adminPassword', e.target.value);
                          }}
                          onBlur={e => validateField('adminPassword', e.target.value)}
                          className="input" 
                          style={{ 
                            width: '100%', 
                            padding: '12px 16px', 
                            border: `1px solid ${validationErrors.adminPassword ? '#ef4444' : '#d1d5db'}`, 
                            borderRadius: 8, 
                            fontSize: 14,
                            backgroundColor: validationErrors.adminPassword ? '#fef2f2' : '#fff'
                          }} 
                        />
                        {validationErrors.adminPassword && (
                          <div style={{ 
                            color: '#ef4444', 
                            fontSize: '12px', 
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>⚠️</span>
                            {validationErrors.adminPassword}
                          </div>
                        )}
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
                onClick={closeModal} 
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
        <div>
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
                gridTemplateColumns: '180px 1fr 1fr 140px 120px 140px', 
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
                    gridTemplateColumns: '180px 1fr 1fr 140px 120px 140px', 
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
        </div>
      )}
    </div>
  );
};

export default CompaniesTab;

