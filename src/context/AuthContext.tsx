/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import type { NexusUser } from '../types';

interface AuthCtx {
  user: NexusUser | null;
  token: string | null;
  login: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NexusUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('nexus_token', idToken);
          // In a real app, you might sync the user profile with the backend
          // using the idToken here, but for now we construct the NexusUser
          const u = {
            id: 1,
            username: firebaseUser.email || 'user',
            is_admin: true,
            created_at: new Date().toISOString()
          };
          setUser(u);
          localStorage.setItem('nexus_user', JSON.stringify(u));
        } catch (err) {
          console.error("Failed to get ID token", err);
          setUser(null);
          setToken(null);
          localStorage.removeItem('nexus_token');
          localStorage.removeItem('nexus_user');
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed", err);
      throw err;
    }
  };

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
