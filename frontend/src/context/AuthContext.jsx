import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('crm_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('crm_access_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sync token header with Axios
  useEffect(() => {
    if (token) {
      localStorage.setItem('crm_access_token', token);
    } else {
      localStorage.removeItem('crm_access_token');
    }
  }, [token]);

  // Fetch /api/users/me on startup if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('crm_access_token');
      if (storedToken) {
        try {
          const response = await api.get('/api/users/me');
          setUser(response.data.data);
          localStorage.setItem('crm_user', JSON.stringify(response.data.data));
        } catch {
          // Token invalid or expired
          setUser(null);
          setToken(null);
          localStorage.removeItem('crm_user');
          localStorage.removeItem('crm_access_token');
          localStorage.removeItem('crm_refresh_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { accessToken, refreshToken, user: userData } = response.data;

      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('crm_access_token', accessToken);
      localStorage.setItem('crm_refresh_token', refreshToken);
      localStorage.setItem('crm_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const registerCompany = async (formData) => {
    setAuthError(null);
    try {
      const response = await api.post('/api/auth/register', formData);
      const { accessToken, refreshToken, user: userData } = response.data;

      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('crm_access_token', accessToken);
      localStorage.setItem('crm_refresh_token', refreshToken);
      localStorage.setItem('crm_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('crm_refresh_token');
    try {
      if (refreshToken) {
        await api.post('/api/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore logout API failures
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('crm_user');
      localStorage.removeItem('crm_access_token');
      localStorage.removeItem('crm_refresh_token');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        login,
        registerCompany,
        logout,
        isAuthenticated: !!user && !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
