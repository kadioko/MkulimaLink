import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/api/auth/me');
          setUser(response.data);
        } catch (err) {
          console.error('Auth init error:', err);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.post('/api/auth/register', userData);
      const { token: newToken, user: responseUser } = response.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(responseUser);

      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Registration failed';
      setError(errorMsg);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/api/auth/login', { email, password });
      const { token: newToken, user: responseUser } = response.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(responseUser);

      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Login failed';
      setError(errorMsg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/api/auth/logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await api.put('/api/auth/profile', profileData);
      setUser(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Profile update failed';
      setError(errorMsg);
      throw err;
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post('/api/auth/refresh-token', { token });
      const newToken = response.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      return newToken;
    } catch (err) {
      logout();
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    refreshToken,
    isAuthenticated: !!user && !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
