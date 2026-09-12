import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  demoLogin: async () => {},
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('codeguard_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('codeguard_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (token) {
        try {
          const data = await authApi.getMe();
          setUser(data.user);
          localStorage.setItem('codeguard_user', JSON.stringify(data.user));
        } catch {
          // Token invalid or expired
          logout();
        }
      }
      setIsLoading(false);
    }
    checkAuth();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const data = await authApi.login(email, pass);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('codeguard_token', data.token);
    localStorage.setItem('codeguard_user', JSON.stringify(data.user));
  };

  const register = async (email: string, pass: string, name: string) => {
    const data = await authApi.register(email, pass, name);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('codeguard_token', data.token);
    localStorage.setItem('codeguard_user', JSON.stringify(data.user));
  };

  const demoLogin = async () => {
    const data = await authApi.demoLogin();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('codeguard_token', data.token);
    localStorage.setItem('codeguard_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('codeguard_token');
    localStorage.removeItem('codeguard_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        demoLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
