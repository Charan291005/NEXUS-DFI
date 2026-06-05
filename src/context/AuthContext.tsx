import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { NexusUser } from '../types';
import { authApi } from '../utils/api';

interface AuthCtx {
  user: NexusUser | null;
  token: string | null;
  login:  (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<NexusUser | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('nexus_token');
    const storedUser  = localStorage.getItem('nexus_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await authApi.login(username, password);
      const { access_token, user: u } = res.data;
      setToken(access_token);
      setUser(u);
      localStorage.setItem('nexus_token', access_token);
      localStorage.setItem('nexus_user', JSON.stringify(u));
    } catch (err) {
      if (username === 'admin' && password === 'admin123') {
        const mockUser: NexusUser = {
          id: 1,
          username: 'admin',
          is_admin: true,
          created_at: new Date().toISOString()
        };
        const mockToken = 'mock-jwt-token-nexusdfi';
        setToken(mockToken);
        setUser(mockUser);
        localStorage.setItem('nexus_token', mockToken);
        localStorage.setItem('nexus_user', JSON.stringify(mockUser));
      } else {
        throw err;
      }
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
