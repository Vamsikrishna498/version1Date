import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { companiesAPI } from '../api/apiService';

const BrandingContext = createContext({});

const detectTenant = () => {
  const saved = localStorage.getItem('tenant');
  if (saved) return saved;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '';
    const parts = host.split('.');
    if (parts.length > 2) return parts[0];
  }
  return 'default';
};

export const BrandingProvider = ({ children }) => {
  const [tenant, setTenant] = useState(() => {
    try {
      const t = localStorage.getItem('tenant');
      if (t && t.trim()) return t.trim();
    } catch {}
    return detectTenant();
  });
  // Initialize branding from cache to prevent flashes to default
  const cachedBrandingString = typeof window !== 'undefined' ? localStorage.getItem('brandingCache') : null;
  const cachedBranding = cachedBrandingString ? (() => { try { return JSON.parse(cachedBrandingString); } catch { return null; } })() : null;
  const [branding, setBranding] = useState(cachedBranding);
  const [loading, setLoading] = useState(!cachedBranding);
  const [userEmail, setUserEmail] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw)?.email || null) : null;
    } catch { return null; }
  });
  const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:8080/api');
  const apiOrigin = apiBase.replace(/\/?api\/?$/, '');
  
  // Enhanced API origin detection for staging environments
  const getApiOrigin = () => {
    // Check if we're in staging/production
    const isStaging = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isStaging) {
      // For staging, use the current origin
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port;
      const stagingOrigin = `${protocol}//${hostname}${port ? ':' + port : ''}`;
      console.log('Detected staging environment, using origin:', stagingOrigin);
      return stagingOrigin;
    }
    return apiOrigin;
  };

  const loadBranding = async (currentTenant = tenant) => {
      try {
      setLoading(true);
        let data;
      const storedTenant = (localStorage.getItem('tenant') || currentTenant || '').toString().trim();
        const rawUser = localStorage.getItem('user');
        const parsedUser = rawUser ? JSON.parse(rawUser) : null;

      // 1) Prefer explicit tenant selection (persisted)
      if (storedTenant && storedTenant.toLowerCase() !== 'default') {
        try {
          const res = await api.get(`/companies/branding/${storedTenant}`);
          data = res.data;
        } catch (e) {
          // continue to email fallback
        }
      }

      // 2) Fallback to email-based branding if not found or tenant missing
      if (!data && parsedUser?.email) {
        try {
          data = await companiesAPI.getBrandingByEmail(parsedUser.email);
        } catch (e) {
          // ignore; continue
        }
      }

      // 3) As a last resort, try the detected tenant (could be subdomain)
      if (!data) {
        const resolved = (storedTenant || currentTenant || '').toString().trim();
        if (resolved) {
          const res = await api.get(`/companies/branding/${resolved}`);
          data = res.data;
        }
        }
        const absolutize = (url) => {
          if (!url) {
            console.log('🔗 absolutize: null/undefined URL');
            return url;
          }
          console.log('🔗 absolutize: processing URL:', url);
        // Already absolute
          if (url.startsWith('http://') || url.startsWith('https://')) {
            console.log('🔗 absolutize: already absolute, returning:', url);
            return url;
          }
        // Common backend public paths
        if (url.startsWith('/api/public/')) {
          const result = apiOrigin + url;
          console.log('🔗 absolutize: /api/public/ pattern, returning:', result);
          return result;
        }
        if (url.startsWith('/uploads/')) {
          const result = `${apiOrigin}/api/public${url}`;
          console.log('🔗 absolutize: /uploads/ pattern, returning:', result);
          return result;
        }
        if (url.startsWith('uploads/')) {
          const result = `${apiOrigin}/api/public/${url}`;
          console.log('🔗 absolutize: uploads/ pattern, returning:', result);
          return result;
        }
        if (url.startsWith('/company-logos/')) {
          const result = `${apiOrigin}/api/public${url}`;
          console.log('🔗 absolutize: /company-logos/ pattern, returning:', result);
          return result;
        }
        if (url.startsWith('company-logos/')) {
          const result = `${apiOrigin}/api/public/${url}`;
          console.log('🔗 absolutize: company-logos/ pattern, returning:', result);
          return result;
        }
        // Fallback: treat as relative upload path
        const result = `${apiOrigin}/api/public/${url.replace(/^\//, '')}`;
        console.log('🔗 absolutize: fallback pattern, returning:', result);
        return result;
      };
      const addCacheBust = (u) => (u ? `${u}${u.includes('?') ? '&' : '?'}v=${Date.now()}` : u);
      const normalized = {
        ...data,
        logoLight: addCacheBust(absolutize(data.logoLight)),
        logoDark: addCacheBust(absolutize(data.logoDark)),
        logoSmallLight: addCacheBust(absolutize(data.logoSmallLight)),
        logoSmallDark: addCacheBust(absolutize(data.logoSmallDark))
      };
      const isDefaultBranding = (b) => {
        if (!b) return true;
        const n = (b.name || '').toLowerCase();
        const s = (b.shortName || '').toLowerCase();
        const noLogos = !b.logoLight && !b.logoDark && !b.logoSmallLight && !b.logoSmallDark;
        return (s === 'default' || n === 'default') && noLogos;
      };
      // If backend returns default but we have a cached branding, honor the cached one
      if (isDefaultBranding(normalized) && cachedBranding) {
        setBranding(cachedBranding);
        try { localStorage.setItem('brandingCache', JSON.stringify(cachedBranding)); } catch {}
        setLoading(false);
        return;
      }

      // If still default and no cache, try to auto-select the most recently created company
      if (isDefaultBranding(normalized) && !cachedBranding) {
        try {
          const list = await companiesAPI.list();
          const companies = Array.isArray(list) ? list : [];
          if (companies.length > 0) {
            // Prefer createdAt if available; otherwise last item (assumed latest)
            const latest = companies
              .slice()
              .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || companies[companies.length - 1];
            const latestTenant = (latest?.shortName || latest?.name || '').toString().trim().toLowerCase();
            if (latestTenant && latestTenant !== 'default') {
              try { localStorage.setItem('tenant', latestTenant); } catch {}
              setTenant(latestTenant);
              // Re-run load with selected tenant
              setLoading(false);
              await loadBranding(latestTenant);
              return;
            }
          }
        } catch {}
      }
      setBranding(normalized);
      // Persist last successful branding for future sessions and fallback
      try { localStorage.setItem('brandingCache', JSON.stringify(normalized)); } catch {}
      // Persist detected tenant so that post-logout login page retains same branding
      const detectedTenant = (normalized.shortName || normalized.name || '').toString().trim();
      if (detectedTenant && detectedTenant !== tenant && detectedTenant.toLowerCase() !== 'default') {
        try { localStorage.setItem('tenant', detectedTenant); } catch {}
        setTenant(detectedTenant);
      }
    } catch (e) {
      console.error('BrandingContext: Failed to load branding:', e);
      // Use cached branding if available to prevent fallback to default
      const fallback = cachedBrandingString ? (() => { try { return JSON.parse(cachedBrandingString); } catch { return null; } })() : null;
      if (fallback) {
        setBranding(fallback);
      } else {
        setBranding({
          name: 'Default',
          shortName: 'default',
          logoLight: null,
          logoDark: null,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadBranding(tenant);
      } catch (e) {
        console.error('BrandingContext: Failed to load branding:', e);
        setBranding({
          name: 'Default',
          shortName: 'default',
          logoLight: null,
          logoDark: null,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenant]);

  // Detect login changes in the same tab and refresh branding automatically
  useEffect(() => {
    const checkUserChange = () => {
      try {
        const raw = localStorage.getItem('user');
        const email = raw ? (JSON.parse(raw)?.email || null) : null;
        if (email !== userEmail) {
          setUserEmail(email);
          loadBranding(tenant);
        }
      } catch {}
    };
    const interval = setInterval(checkUserChange, 1000);
    window.addEventListener('storage', checkUserChange);
    window.addEventListener('branding:refresh', checkUserChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkUserChange);
      window.removeEventListener('branding:refresh', checkUserChange);
    };
  }, [tenant, userEmail]);

  // Helpers for dynamic logo usage across the app
  const getLogoUrl = (pref = 'auto') => {
    if (!branding) return null;
    const prefList = pref === 'small'
      ? [branding.logoSmallLight, branding.logoSmallDark, branding.logoLight, branding.logoDark]
      : pref === 'dark'
      ? [branding.logoDark, branding.logoSmallDark, branding.logoLight, branding.logoSmallLight]
      : [branding.logoLight, branding.logoSmallLight, branding.logoDark, branding.logoSmallDark];
    return prefList.find(Boolean) || null;
  };

  const refreshBranding = () => loadBranding(tenant);
  const value = useMemo(() => ({ tenant, setTenant, branding, loading, getLogoUrl, apiOrigin, refreshBranding }), [tenant, branding, loading]);
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
};

export const useBranding = () => useContext(BrandingContext);

export default BrandingContext;

// Reusable helper for company objects to build best-effort logo candidates
export const buildCompanyLogoCandidates = (company, apiOrigin, version) => {
  if (!company) return [];
  const pick = company.logoLight || company.logoDark || company.logoSmallLight || company.logoSmallDark;
  if (!pick) return [];
  const cid = company.id || company.companyId || company.companyID;
  const tail = (pick || '').split('/').pop();
  const addV = (u) => (u ? `${u}${u.includes('?') ? '&' : '?'}v=${version || company.updatedAt || company.logoUpdatedAt || Date.now()}` : u);
  const candidates = [];
  
  // Enhanced API origin detection for staging
  const getEffectiveApiOrigin = () => {
    // Check if we're in staging/production
    const isStaging = typeof window !== 'undefined' && 
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1';
    if (isStaging) {
      // For staging, use the current origin
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port;
      const stagingOrigin = `${protocol}//${hostname}${port ? ':' + port : ''}`;
      console.log('Using staging origin for logos:', stagingOrigin);
      return stagingOrigin;
    }
    return apiOrigin;
  };
  
  const effectiveApiOrigin = getEffectiveApiOrigin();
  
  // Enhanced logging for staging debugging
  console.log('buildCompanyLogoCandidates Debug:', {
    company: company?.name,
    companyId: cid,
    pick: pick,
    tail: tail,
    originalApiOrigin: apiOrigin,
    effectiveApiOrigin: effectiveApiOrigin,
    version: version || company.updatedAt || company.logoUpdatedAt || Date.now(),
    isStaging: typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  });
  
  // Build multiple URL candidates for better staging compatibility
  if (pick.startsWith('http')) {
    candidates.push(addV(pick));
  }
  
  if (cid) {
    // Primary staging-friendly paths
    candidates.push(addV(`${effectiveApiOrigin}/api/public/uploads/company-logos/${cid}/${tail}`));
    candidates.push(addV(`${effectiveApiOrigin}/uploads/company-logos/${cid}/${tail}`));
    candidates.push(addV(`${effectiveApiOrigin}/api/public/files/company-logos/${cid}/${tail}`));
    candidates.push(addV(`${effectiveApiOrigin}/files/company-logos/${cid}/${tail}`));
  }
  
  if (pick.startsWith('/uploads/')) {
    candidates.push(addV(`${effectiveApiOrigin}/api/public${pick}`));
    candidates.push(addV(`${effectiveApiOrigin}${pick}`));
  }
  
  // Generic fallback paths
  candidates.push(addV(`${effectiveApiOrigin}/api/public/${pick.replace(/^\//, '')}`));
  candidates.push(addV(`${effectiveApiOrigin}/${pick.replace(/^\//, '')}`));
  
  // Remove duplicates and log final candidates
  const uniqueCandidates = Array.from(new Set(candidates));
  console.log('Final logo candidates:', uniqueCandidates);
  
  return uniqueCandidates;
};


