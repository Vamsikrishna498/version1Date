// Secure token storage utility
class TokenStorage {
  static TOKEN_KEY = 'auth_token';
  static USER_KEY = 'user_data';
  static REFRESH_TOKEN_KEY = 'refresh_token';

  // Store token securely
  static setToken(token) {
    try {
      if (token) {
        // In production, consider using httpOnly cookies instead
        localStorage.setItem(this.TOKEN_KEY, token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error storing token:', error);
      return false;
    }
  }

  // Get token
  static getToken() {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  // Remove token
  static removeToken() {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      return true;
    } catch (error) {
      console.error('Error removing token:', error);
      return false;
    }
  }

  // Store user data
  static setUserData(userData) {
    try {
      if (userData) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  }

  // Get user data
  static getUserData() {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  // Remove user data
  static removeUserData() {
    try {
      localStorage.removeItem(this.USER_KEY);
      return true;
    } catch (error) {
      console.error('Error removing user data:', error);
      return false;
    }
  }

  // Clear all auth data
  static clearAuth() {
    this.removeToken();
    this.removeUserData();
  }

  // Check if user is authenticated
  static isAuthenticated() {
    const token = this.getToken();
    const userData = this.getUserData();
    return !!(token && userData);
  }

  // Get token expiration time
  static getTokenExpiration() {
    try {
      const token = this.getToken();
      if (!token) return null;

      // Decode JWT token to get expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  }

  // Check if token is expired
  static isTokenExpired() {
    const expiration = this.getTokenExpiration();
    if (!expiration) return true;
    return new Date() >= expiration;
  }

  // Auto-refresh token if needed
  static async refreshTokenIfNeeded() {
    if (this.isTokenExpired()) {
      // Token is expired, clear auth data
      this.clearAuth();
      return false;
    }
    return true;
  }

  // Secure logout
  static logout() {
    this.clearAuth();
    // Redirect to login page
    window.location.href = '/login';
  }
}

export default TokenStorage;

