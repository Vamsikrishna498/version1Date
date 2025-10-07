import React, { createContext, useContext, useState, useEffect } from 'react';
import TokenStorage from '../utils/tokenStorage';
import Logger from '../utils/logger';

const AuthContext = createContext();

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = TokenStorage.getToken();
    const userData = TokenStorage.getUserData();
    
    Logger.log('=== AUTH CONTEXT INITIALIZATION ===');
    Logger.log('Token found:', !!token);
    Logger.log('User data found:', !!userData);
    
    if (token && userData) {
      // Check if token is expired
      if (TokenStorage.isTokenExpired()) {
        Logger.warn('Token is expired, clearing auth data');
        TokenStorage.clearAuth();
        setUser(null);
      } else {
        Logger.log('User authenticated successfully');
        setUser(userData);
      }
    } else {
      Logger.log('No token or user data found');
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    TokenStorage.setToken(token);
    TokenStorage.setUserData(userData);
    Logger.log('User logged in successfully');
  };

  const logout = () => {
    setUser(null);
    // Use centralized storage/logout
    TokenStorage.logout();
    Logger.log('User logged out');
    // Keep the last known tenant branding for login screen
    try { window.dispatchEvent(new Event('branding:refresh')); } catch {}
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 