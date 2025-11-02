import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'huicloud-os-auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  const login = useCallback(async (username: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const success = username === 'hxadmin' && password === 'hx84556793';
    setIsAuthenticated(success);
    return success;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(() => ({ isAuthenticated, login, logout }), [isAuthenticated, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
