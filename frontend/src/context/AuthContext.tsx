import React, { createContext, useContext, useEffect, useState } from 'react';
import jwtDecode from 'jwt-decode';
import { api } from '../services/api';

type User = { id: string; email: string; role: string; firstName: string; lastName: string };

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('session');
    if (stored) {
      const { access, user } = JSON.parse(stored);
      setAccessToken(access);
      setUser(user);
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.access);
    setUser(res.data.user);
    localStorage.setItem('session', JSON.stringify({ access: res.data.access, user: res.data.user }));
  }

  function logout() {
    localStorage.removeItem('session');
    setAccessToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, accessToken, login, logout }}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext missing');
  return ctx;
}
