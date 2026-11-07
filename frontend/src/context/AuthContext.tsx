import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('documind_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('documind_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('documind_token');
      if (savedToken) {
        try {
          const me = await api.auth.getMe();
          setUser(me);
          localStorage.setItem('documind_user', JSON.stringify(me));
          setIsLoading(false);
          return;
        } catch {
          // Token expired, fallback to guest
        }
      }

      // Auto-initialize demo guest session for instant zero-friction testing
      try {
        const res = await fetch('/api/auth/guest');
        if (res.ok) {
          const guestRes = await res.json();
          localStorage.setItem('documind_token', guestRes.access_token);
          localStorage.setItem('documind_user', JSON.stringify(guestRes.user));
          setToken(guestRes.access_token);
          setUser(guestRes.user);
        } else {
          setUser({
            id: 'guest-tester-00000000-0000-0000-0000',
            name: 'Demo Tester',
            email: 'guest@documind.ai',
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        setUser({
          id: 'guest-tester-00000000-0000-0000-0000',
          name: 'Demo Tester',
          email: 'guest@documind.ai',
          created_at: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    localStorage.setItem('documind_token', res.access_token);
    localStorage.setItem('documind_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.auth.register(name, email, password);
    localStorage.setItem('documind_token', res.access_token);
    localStorage.setItem('documind_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = async () => {
    await api.auth.logout();
    // Reset back to guest tester
    const guestUser: User = {
      id: 'guest-tester-00000000-0000-0000-0000',
      name: 'Demo Tester',
      email: 'guest@documind.ai',
      created_at: new Date().toISOString(),
    };
    setUser(guestUser);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
