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
  
  // Enhanced validation functions
  const validateEmail = (email) => {
    if (!email || email.trim().length === 0) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  };

  const validatePhone = (phone) => {
    if (!phone || phone.trim().length === 0) return false;
    // Keep only digits
    const digitsOnly = phone.replace(/\D/g, '');
    // Require EXACTLY 10 digits, starting with 6-9 (typical Indian mobile format)
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(digitsOnly);
  };

  const validateShortName = (shortName) => {
    if (!shortName || shortName.trim().length === 0) return false;
    // Must be 2-30 characters, start with letter, contain only letters, numbers, hyphens, underscores
    const shortNameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{1,29}$/;
    return shortNameRegex.test(shortName.trim());
  };

  const validateCompanyName = (name) => {
    if (!name || name.trim().length === 0) return false;
    // Company name should contain at least some letters and be meaningful
    const trimmedName = name.trim();
    
    // Must be at least 2 characters
    if (trimmedName.length < 2) return false;
    
    // Must be less than 100 characters
    if (trimmedName.length > 100) return false;
    
    // Should contain at least one letter (not just numbers/symbols)
    const hasLetter = /[a-zA-Z]/.test(trimmedName);
    if (!hasLetter) return false;
    
    // Should not be just repeated characters
    const firstChar = trimmedName[0];
    if (trimmedName.split('').every(char => char === firstChar)) return false;
    
    // Should not contain only numbers
    const onlyNumbers = /^[0-9]+$/.test(trimmedName);
    if (onlyNumbers) return false;
    
    return true;
  };

  const validateAddress = (address) => {
    if (!address || address.trim().length === 0) return true; // Address is optional
    const trimmedAddress = address.trim();
    
    // Must be at least 10 characters if provided
    if (trimmedAddress.length < 10) return false;
    
    // Must be less than 500 characters
    if (trimmedAddress.length > 500) return false;
    
    // Should contain at least some letters
    const hasLetter = /[a-zA-Z]/.test(trimmedAddress);
    if (!hasLetter) return false;
    
    return true;
  };

  const validateAdminEmail = (email) => {
    return validateEmail(email);
  };

  const validateAdminPassword = (password) => {
    if (!password || password.trim().length === 0) return false;
    
    // Password must be at least 8 characters
    if (password.length < 8) return false;
    
    // Password must be less than 50 characters
    if (password.length > 50) return false;
    
    // Must contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) return false;
    
    // Must contain at least one lowercase letter
    if (!/[a-z]/.test(password)) return false;
    
    // Must contain at least one number
    if (!/[0-9]/.test(password)) return false;
    
    // Must contain at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    
    return true;
  };

  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'name':
        if (!value || value.trim().length === 0) {
          return 'Company name is required';
        } else if (!validateCompanyName(value)) {
          if (value.trim().length < 2) {
            return 'Company name must be at least 2 characters';
        } else if (value.trim().length > 100) {
            return 'Company name must be less than 100 characters';
          } else if (/^[0-9]+$/.test(value.trim())) {
            return 'Company name cannot be only numbers';
          } else if (!/[a-zA-Z]/.test(value.trim())) {
            return 'Company name must contain at least one letter';
          } else if (value.split('').every(char => char === value[0])) {
            return 'Company name cannot be repeated characters';
        } else {
            return 'Please enter a valid company name';
        }
        }
        return null;
        
      case 'shortName':
        if (!value || value.trim().length === 0) {
          return 'Company short name is required';
        } else if (!validateShortName(value)) {
          if (value.trim().length < 2) {
            return 'Short name must be at least 2 characters';
          } else if (value.trim().length > 30) {
            return 'Short name must be less than 30 characters';
          } else if (!/^[a-zA-Z]/.test(value.trim())) {
            return 'Short name must start with a letter';
          } else if (!/^[a-zA-Z0-9_-]+$/.test(value.trim())) {
            return 'Short name can only contain letters, numbers, hyphens, and underscores';
        } else {
            return 'Please enter a valid short name';
        }
        }
        return null;
        
      case 'email':
        if (!value || value.trim().length === 0) {
          return 'Company email is required';
        } else if (!validateEmail(value)) {
          return 'Please enter a valid email address (e.g., company@example.com)';
        }
        return null;
        
      case 'phone':
        if (!value || value.trim().length === 0) {
          return 'Company phone is required';
        } else if (!validatePhone(value)) {
          const digitsOnly = value.replace(/\D/g, '');
          if (digitsOnly.length !== 10) {
            return 'Phone number must be exactly 10 digits';
          } else if (!/^[6-9]/.test(digitsOnly)) {
            return 'Phone number must start with 6, 7, 8, or 9';
        } else {
            return 'Please enter a valid 10-digit mobile number';
          }
        }
        return null;
        
      case 'address':
        if (value && value.trim().length > 0 && !validateAddress(value)) {
          if (value.trim().length < 10) {
            return 'Address must be at least 10 characters if provided';
          } else if (value.trim().length > 500) {
            return 'Address must be less than 500 characters';
          } else if (!/[a-zA-Z]/.test(value.trim())) {
            return 'Address must contain at least one letter';
        } else {
            return 'Please enter a valid address';
        }
        }
        return null;
        
      case 'defaultTimezone':
        if (!value || value.trim().length === 0) {
          return 'Timezone is required';
        }
        return null;
        
      case 'status':
        if (!value || value.trim().length === 0) {
          return 'Status is required';
        } else if (!['ACTIVE', 'INACTIVE', 'Active', 'Inactive'].includes(value)) {
          return 'Status must be either Active or Inactive';
        }
        return null;
        
      case 'adminEmail':
        if (selected?.id && (!value || value.trim().length === 0)) {
          // When editing, admin email is optional (leave blank to keep current)
          return null;
        } else if (!selected?.id && (!value || value.trim().length === 0)) {
          // When creating, admin email is required
          return 'Admin email is required';
        } else if (value && value.trim().length > 0 && !validateAdminEmail(value)) {
          return 'Please enter a valid admin email address (e.g., admin@company.com)';
        }
        return null;
        
      case 'adminPassword':
        if (selected?.id && (!value || value.trim().length === 0)) {
          // When editing, admin password is optional (leave blank to keep current)
          return null;
        } else if (!selected?.id && (!value || value.trim().length === 0)) {
          // When creating, admin password is required
          return 'Admin password is required';
        } else if (value && value.trim().length > 0 && !validateAdminPassword(value)) {
          if (value.length < 8) {
            return 'Password must be at least 8 characters';
          } else if (value.length > 50) {
            return 'Password must be less than 50 characters';
          } else if (!/[A-Z]/.test(value)) {
            return 'Password must contain at least one uppercase letter';
          } else if (!/[a-z]/.test(value)) {
            return 'Password must contain at least one lowercase letter';
          } else if (!/[0-9]/.test(value)) {
            return 'Password must contain at least one number';
          } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            return 'Password must contain at least one special character';
        } else {
            return 'Please enter a strong password';
        }
        }
        return null;
        
      default:
        return null;
    }
  };

  // Helper function to handle input changes with real-time validation
  const handleInputChange = (field, value, isAdminField = false) => {
    const targetState = isAdminField ? admin : form;
    const setTargetState = isAdminField ? setAdmin : setForm;
    
    // Update the field value
    setTargetState({ ...targetState, [field]: value });
    
    // Validate the field immediately
    const errorMessage = validateField(field, value);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (errorMessage) {
        newErrors[field] = errorMessage;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const validateForm = async () => {
    // Only validate required fields for creation
    const requiredFields = ['name', 'shortName', 'email', 'phone', 'defaultTimezone', 'status'];
    const adminFields = selected?.id ? [] : ['adminEmail', 'adminPassword']; // Only validate admin fields when creating
    const fieldsToValidate = [...requiredFields, ...adminFields];
    let isValid = true;
    const newErrors = {};
    
    // Validate each field and collect all errors
    fieldsToValidate.forEach(field => {
      const fieldValue = field === 'adminEmail' ? admin.email : field === 'adminPassword' ? admin.password : form[field];
      const errorMessage = validateField(field, fieldValue);
      if (errorMessage) {
        newErrors[field] = errorMessage;
        isValid = false;
      }
    });
    
    // Set all validation errors at once
    setValidationErrors(newErrors);
    
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

  useEffect(() => { 
    load(); 
    setError(''); // Clear any error messages when component mounts
  }, []);

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
      
      const payload = { 
        ...form, 
        status: form.status?.toUpperCase() // Convert to uppercase for backend
      };
      
      // Only include admin fields if they have values (for editing) or if creating new company
      if (admin.email && admin.email.trim()) {
        payload.adminEmail = admin.email;
      }
      if (admin.password && admin.password.trim()) {
        payload.adminPassword = admin.password;
      }
      let saved;
      if (selected?.id) {
        saved = await companiesAPI.update(selected.id, payload);
      } else {
        saved = await companiesAPI.create(payload);
      }
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
      
      // Clear validation errors and error messages on success
      setValidationErrors({});
      setError('');
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
    setError(''); // Clear any previous error messages
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
    setError(''); // Clear any error messages when closing modal
  };

  const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:8080/api');
  const configuredApiOrigin = apiBase.replace(/\/?api\/?$/, '');
  
  // For localhost, always use backend origin; for server, use same-origin
  const apiOrigin = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? configuredApiOrigin
    : (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}` : configuredApiOrigin);

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
    const [loadingAttempts, setLoadingAttempts] = useState(0);
    
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
      apiBase: apiBase,
      currentIndex: idx,
      hasError: hasError,
      windowLocation: window.location.href
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
          fontWeight: '600',
          position: 'relative'
        }}>
          {company?.name ? company.name.charAt(0).toUpperCase() : '🏢'}
          {hasError && (
            <div style={{
              position: 'absolute',
              top: '-20px',
              left: '0',
              right: '0',
              fontSize: '10px',
              color: '#ef4444',
              textAlign: 'center',
              background: '#fff',
              padding: '2px 4px',
              borderRadius: '4px',
              border: '1px solid #fecaca'
            }}>
              Logo failed to load
            </div>
          )}
        </div>
      );
    };
    
    // If no candidates or all failed to load, show a placeholder
    if (candidates.length === 0 || (hasError && idx >= candidates.length - 1)) {
      return fallbackLogo();
    }
    
    const handleError = (e) => {
      console.log('Logo load error for company:', company?.name, 'candidate:', candidates[idx], 'error:', e);
      console.log('Current index:', idx, 'Total candidates:', candidates.length);
      
      setLoadingAttempts(prev => prev + 1);
      
      if (idx < candidates.length - 1) {
        console.log('Trying next candidate...');
        setIdx(idx + 1);
      } else {
        console.log('All logo candidates failed, showing fallback');
        setHasError(true);
      }
    };
    
    const handleLoad = () => {
      console.log('Logo loaded successfully for company:', company?.name, 'candidate:', candidates[idx]);
      setHasError(false);
      setLoadingAttempts(0);
    };
    
    return (
      <div style={{ position: 'relative' }}>
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
          onError={handleError}
          onLoad={handleLoad}
        />
        {loadingAttempts > 0 && !hasError && (
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '0',
            right: '0',
            fontSize: '10px',
            color: '#f59e0b',
            textAlign: 'center',
            background: '#fff',
            padding: '2px 4px',
            borderRadius: '4px',
            border: '1px solid #fed7aa'
          }}>
            Loading... ({loadingAttempts}/{candidates.length})
          </div>
        )}
      </div>
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
    // Enhanced API origin detection
    const getEffectiveApiOrigin = () => {
      const isStaging = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      if (isStaging) {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;
        return `${protocol}//${hostname}${port ? ':' + port : ''}`;
      }
      const currentOrigin = window.location.origin;
      return currentOrigin !== apiOrigin ? currentOrigin : apiOrigin;
    };
    
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
      const effectiveOrigin = getEffectiveApiOrigin();
      const candidates = cid ? [
        `${effectiveOrigin}/api/public/uploads/company-logos/${cid}/${tail}`,
        `${effectiveOrigin}/uploads/company-logos/${cid}/${tail}`,
        `${effectiveOrigin}/api/public/files/company-logos/${cid}/${tail}`,
        `${effectiveOrigin}/files/company-logos/${cid}/${tail}`,
        `${effectiveOrigin}/api/companies/${cid}/logos/${tail}`,
        `${effectiveOrigin}/companies/${cid}/logos/${tail}`,
        `${effectiveOrigin}/static/uploads/company-logos/${cid}/${tail}`,
        `${effectiveOrigin}/uploads/${fieldValue}`
      ] : [
        `${effectiveOrigin}/uploads/${fieldValue}`,
        `${effectiveOrigin}/api/public/uploads/${fieldValue}`,
        `${effectiveOrigin}/static/uploads/${fieldValue}`
      ];
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
                        placeholder="Please Enter Company Name (e.g., ABC Corporation)" 
                        value={form.name} 
                        onChange={e => handleInputChange('name', e.target.value)}
                        onBlur={e => {
                          const errorMessage = validateField('name', e.target.value);
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                            if (errorMessage) {
                              newErrors.name = errorMessage;
                            } else {
                              delete newErrors.name;
                            }
                              return newErrors;
                            });
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
                        placeholder="Please Enter Company Short Name (e.g., ABC)" 
                        value={form.shortName} 
                        onChange={e => handleInputChange('shortName', e.target.value)}
                        onBlur={e => {
                          const errorMessage = validateField('shortName', e.target.value);
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                            if (errorMessage) {
                              newErrors.shortName = errorMessage;
                            } else {
                              delete newErrors.shortName;
                            }
                              return newErrors;
                            });
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
                        placeholder="Please Enter Company Email (e.g., contact@company.com)" 
                        value={form.email} 
                        onChange={e => handleInputChange('email', e.target.value)}
                        onBlur={e => {
                          const errorMessage = validateField('email', e.target.value);
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                            if (errorMessage) {
                              newErrors.email = errorMessage;
                            } else {
                              delete newErrors.email;
                            }
                              return newErrors;
                            });
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
                        placeholder="Enter 10-digit mobile (e.g., 9876543210)" 
                        value={form.phone} 
                        onChange={e => handleInputChange('phone', e.target.value)}
                        onBlur={e => {
                          const errorMessage = validateField('phone', e.target.value);
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            if (errorMessage) {
                              newErrors.phone = errorMessage;
                            } else {
                              delete newErrors.phone;
                            }
                            return newErrors;
                          });
                        }}
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
                        onChange={e => handleInputChange('defaultTimezone', e.target.value)} 
                        className="input" 
                        style={{ width: '100%', padding: '12px 16px', border: `1px solid ${validationErrors.defaultTimezone ? '#ef4444' : '#d1d5db'}`, borderRadius: 8, fontSize: 14 }}
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata</option>
                        <option value="UTC">UTC</option>
                        <option value="Asia/Dubai">Asia/Dubai</option>
                      </select>
                      {validationErrors.defaultTimezone && (
                        <div style={{ 
                          color: '#ef4444', 
                          fontSize: '12px', 
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>⚠️</span>
                          {validationErrors.defaultTimezone}
                        </div>
                      )}
                    </div>
                    <div className="field">
                      <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                        Status<span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select 
                        value={form.status} 
                        onChange={e => handleInputChange('status', e.target.value)} 
                        className="input" 
                        style={{ width: '100%', padding: '12px 16px', border: `1px solid ${validationErrors.status ? '#ef4444' : '#d1d5db'}`, borderRadius: 8, fontSize: 14 }}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                      {validationErrors.status && (
                        <div style={{ 
                          color: '#ef4444', 
                          fontSize: '12px', 
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>⚠️</span>
                          {validationErrors.status}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="field" style={{ marginBottom: 32 }}>
                    <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Company Address</label>
                    <textarea 
                      placeholder="Please Enter Company Address (optional)" 
                      value={form.address || ''} 
                      onChange={e => handleInputChange('address', e.target.value)} 
                      className="input" 
                      style={{ width: '100%', minHeight: 100, padding: '12px 16px', border: `1px solid ${validationErrors.address ? '#ef4444' : '#d1d5db'}`, borderRadius: 8, fontSize: 14, resize: 'vertical' }} 
                    />
                    {validationErrors.address && (
                      <div style={{ 
                        color: '#ef4444', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>⚠️</span>
                        {validationErrors.address}
                      </div>
                    )}
                  </div>

                  {/* Admin Account Details */}
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 32 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#374151' }}>Admin Account Details</div>
                    <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      <div className="field">
                        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                          Email<span style={{ color: '#ef4444' }}>{selected?.id ? '' : '*'}</span>
                        </label>
                        <input 
                          type="email"
                          placeholder="Please Enter Admin Email (e.g., admin@company.com)" 
                          value={admin.email} 
                          onChange={e => handleInputChange('email', e.target.value, true)}
                          onBlur={async (e) => {
                            const errorMessage = validateField('adminEmail', e.target.value);
                              setValidationErrors(prev => {
                                const newErrors = { ...prev };
                              if (errorMessage) {
                                newErrors.adminEmail = errorMessage;
                              } else {
                                delete newErrors.adminEmail;
                              }
                                return newErrors;
                              });
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
                          Password<span style={{ color: '#ef4444' }}>{selected?.id ? '' : '*'}</span>
                        </label>
                        <input 
                          type="password" 
                          placeholder="Please Enter Strong Password (8+ chars, mixed case, numbers, symbols)" 
                          value={admin.password} 
                          onChange={e => handleInputChange('password', e.target.value, true)}
                          onBlur={e => {
                            const errorMessage = validateField('adminPassword', e.target.value);
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              if (errorMessage) {
                                newErrors.adminPassword = errorMessage;
                              } else {
                                delete newErrors.adminPassword;
                              }
                              return newErrors;
                            });
                          }}
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
                      {selected?.id 
                        ? 'Leave admin fields blank to keep current admin account unchanged.' 
                        : 'Admin will login using these credentials.'}
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
                  setSelected(c); 
                  setForm({ 
                    ...c, 
                    // Ensure status is properly formatted for the form
                    status: c.status === 'ACTIVE' ? 'ACTIVE' : c.status === 'INACTIVE' ? 'INACTIVE' : c.status || 'ACTIVE'
                  }); 
                  setAdmin({ email: '', password: '' }); // Clear admin fields for editing
                  setValidationErrors({}); // Clear validation errors
                  setError(''); // Clear any error messages
                  setOpen(true); 
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

