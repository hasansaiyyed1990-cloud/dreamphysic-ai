import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { clearLastApiError } from './api.js';

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
const TOKEN_KEY = 'dp_token';
const USER_KEY = 'dp_user';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function wipeCachedUserState() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('dp_') || k.startsWith('dreamphysic'))) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
  try {
    sessionStorage.clear();
  } catch {
    // ignore
  }
  clearLastApiError();
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(readStoredUser);

  const login = useCallback((tok, profile = null) => {
    localStorage.setItem(TOKEN_KEY, tok);
    setToken(tok);
    if (profile) {
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
      setUser(profile);
    }
  }, []);

  const logout = useCallback(() => {
    wipeCachedUserState();
    setToken('');
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('dp:logout', logout);
    return () => window.removeEventListener('dp:logout', logout);
  }, [logout]);

  return (
    <AuthCtx.Provider value={{ token: token || null, user: user ?? null, setUser, login, logout, isLoggedIn: !!token, loading: false }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx) ?? DEFAULT_AUTH_VALUE;
}
