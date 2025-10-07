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
  const [tenant, setTenant] = useState(detectTenant());
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:8080/api');
  const apiOrigin = apiBase.replace(/\/?api\/?$/, '');

  useEffect(() => {
    const load = async () => {
      try {
        let data;
        const rawUser = localStorage.getItem('user');
        const parsedUser = rawUser ? JSON.parse(rawUser) : null;
        if (parsedUser?.email) {
          data = await companiesAPI.getBrandingByEmail(parsedUser.email);
        } else {
          const res = await api.get(`/companies/branding/${tenant}`);
          data = res.data;
        }
        const absolutize = (url) => {
          if (!url) return url;
          if (url.startsWith('http://') || url.startsWith('https://')) return url;
          if (url.startsWith('/uploads/')) return apiOrigin + '/api/public' + url;
          return url;
        };
        setBranding({
          ...data,
          logoLight: absolutize(data.logoLight),
          logoDark: absolutize(data.logoDark),
          logoSmallLight: absolutize(data.logoSmallLight),
          logoSmallDark: absolutize(data.logoSmallDark)
        });
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

  const value = useMemo(() => ({ tenant, setTenant, branding, loading }), [tenant, branding, loading]);
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
};

export const useBranding = () => useContext(BrandingContext);

export default BrandingContext;


