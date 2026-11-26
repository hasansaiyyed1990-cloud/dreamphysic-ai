import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api.js';

const DEFAULT_AUTH_VALUE = {
  isLoggedIn: false,
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  loading: false,
  setUser: () => {},
};

const AuthCtx = createContext(DEFAULT_AUTH_VALUE);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('dp_token') || '');
  const [user, setUser] = useState(null);

  const login = useCallback((tok) => {
    localStorage.setItem('dp_token', tok);
    setToken(tok);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dp_token');
    setToken('');
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('dp:logout', logout);
    return () => window.removeEventListener('dp:logout', logout);
  }, [logout]);

  return (
    <AuthCtx.Provider value={{ token, user, setUser, login, logout, isLoggedIn: !!token, loading: false }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx) ?? DEFAULT_AUTH_VALUE;
}
