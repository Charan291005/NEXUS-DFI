/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import type { NexusUser } from '../types';

interface AuthCtx {
  user: NexusUser | null;
  token: string | null;
  login: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  signupWithEmail: (e: string, p: string) => Promise<void>;
  resetPassword: (e: string) => Promise<void>;
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
          // Fetch the user profile from the backend using the token
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/me`, {
              headers: { Authorization: `Bearer ${idToken}` }
            });
            if (response.ok) {
              const u = await response.json();
              setUser(u);
              localStorage.setItem('nexus_user', JSON.stringify(u));
            } else {
              throw new Error('Failed to fetch user from backend');
            }
          } catch (err) {
            console.error("Backend auth sync failed:", err);
            // Fallback (for testing if backend is down)
            const fallbackRole = firebaseUser.email === 'shreecharan5277443@gmail.com' ? 'Admin' : 'Investigator';
            const u = {
              id: 1,
              username: firebaseUser.email || 'user',
              role: fallbackRole,
              created_at: new Date().toISOString()
            };
            setUser(u as any);
            localStorage.setItem('nexus_user', JSON.stringify(u));
          }
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

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      console.error("Email login failed", err);
      throw err;
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      console.error("Signup failed", err);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error("Password reset failed", err);
      throw err;
    }
  };

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithEmail, signupWithEmail, resetPassword, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
