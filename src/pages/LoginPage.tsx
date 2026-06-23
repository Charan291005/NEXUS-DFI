import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import ParticleCanvas from '../components/ParticleCanvas';
import CustomCursor from '../components/CustomCursor';

// ── Lusion-style stagger animation variants ─────────────
const lusionEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.6 } },
};

const textReveal: Variants = {
  hidden: { opacity: 0, y: 40, rotateX: -15 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease: lusionEase } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6 } },
};

const slideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: lusionEase } },
};

export default function LoginPage() {
  const { login, loginWithEmail, signupWithEmail, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Lusion-style loading counter
  useEffect(() => {
    const duration = 1800;
    const steps = 60;
    const increment = 100 / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= 100) {
        setLoadProgress(100);
        clearInterval(timer);
        setTimeout(() => setIsReady(true), 300);
      } else {
        setLoadProgress(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login();
    } catch {
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: any) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter both email and password.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError('Please enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters long.'); return; }

    setError('');
    setLoading(true);
    try {
      if (isSignUp) { await signupWithEmail(email, password); }
      else { await loginWithEmail(email, password); }
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') setError('Incorrect email or password.');
      else if (code === 'auth/wrong-password') setError('Incorrect password.');
      else if (code === 'auth/email-already-in-use') setError('An account with this email already exists.');
      else if (code === 'auth/too-many-requests') setError('Too many failed attempts. Try again later.');
      else if (code === 'auth/weak-password') setError('Password is too weak.');
      else { setError(err.message || 'Authentication failed.'); console.error("Auth Error:", err); }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="noise-overlay" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000000' }}>
      <CustomCursor />

      {/* ── Loading Overlay (Lusion preloader) ─────────────── */}
      <AnimatePresence>
        {!isReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Progress bar */}
            <div style={{ width: '200px', height: '1px', background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                animate={{ width: `${loadProgress}%` }}
                transition={{ duration: 0.1 }}
                style={{ height: '100%', background: '#1a2ffb' }}
              />
            </div>
            <div className="loading-counter">
              {String(loadProgress).padStart(3, '0')}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ───────────────────────────────────── */}
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>

        {/* ── Left Panel — Particle Canvas + Branding ──────── */}
        <div
          style={{
            position: 'relative',
            width: '55%',
            height: '100%',
            overflow: 'hidden',
          }}
          className="hidden lg:block"
        >
          <ParticleCanvas />

          {/* Overlay content on top of particles */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '3rem',
            zIndex: 2,
          }}>
            {/* Top — Logo */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={isReady ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <img src="/nexusdfi-logo.png" alt="NexusDFI" style={{ width: '26px', height: '26px', objectFit: 'contain', filter: 'brightness(1.2)' }} />
              </div>
              <div>
                <p style={{ color: '#f0f1fa', fontWeight: 700, fontSize: '14px', letterSpacing: '-0.02em' }}>NEXUSDFI</p>
                <p style={{ color: '#4a4d5c', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Digital Forensics</p>
              </div>
            </motion.div>

            {/* Center — Hero text */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate={isReady ? "show" : "hidden"}
              style={{ maxWidth: '500px' }}
            >
              <motion.h1
                variants={textReveal}
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                  fontWeight: 800,
                  color: '#f0f1fa',
                  lineHeight: 1.05,
                  letterSpacing: '-0.04em',
                  marginBottom: '24px',
                }}
              >
                Digital Forensics
                <br />
                <span style={{
                  background: 'linear-gradient(135deg, #1a2ffb, #6670ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Intelligence Platform
                </span>
              </motion.h1>

              <motion.p
                variants={slideUp}
                style={{
                  color: '#7a7d8e',
                  fontSize: '0.9375rem',
                  lineHeight: 1.7,
                  maxWidth: '420px',
                  fontWeight: 400,
                }}
              >
                NexusDFI assists investigators in securely managing digital evidence,
                performing AI-assisted forensic analysis, and generating investigation reports.
              </motion.p>

              {/* Workflow steps — Lusion number style */}
              <motion.div
                variants={fadeIn}
                style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                {[
                  { step: '01', label: 'Case Creation & Assignment' },
                  { step: '02', label: 'Evidence Upload & SHA-256 Verification' },
                  { step: '03', label: 'AI-Powered Forensic Analysis' },
                  { step: '04', label: 'Report Generation & Export' },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isReady ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 1.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                  >
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#1a2ffb',
                      minWidth: '24px',
                    }}>{item.step}</span>
                    <div style={{ width: '16px', height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                    <span style={{ fontSize: '13px', color: '#7a7d8e', fontWeight: 400 }}>{item.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Bottom — Footer text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isReady ? { opacity: 1 } : {}}
              transition={{ delay: 1.8 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <p style={{
                fontSize: '10px',
                color: '#22222e',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                Built with React · FastAPI · Firebase Auth · Gemini AI
              </p>
              <p style={{
                fontSize: '10px',
                color: '#22222e',
                letterSpacing: '0.15em',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                SCROLL TO EXPLORE
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── Right Panel — Login Form ─────────────────────── */}
        <div
          className="flex-1"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: '#0a0a0f',
            position: 'relative',
          }}
        >
          {/* Subtle gradient glow behind card */}
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(26,47,251,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={isReady ? "show" : "hidden"}
            style={{
              width: '100%',
              maxWidth: '380px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Mobile logo (shown on small screens) */}
            <motion.div
              variants={textReveal}
              className="lg:hidden"
              style={{ marginBottom: '48px', textAlign: 'center' }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.04)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <img src="/nexusdfi-logo.png" alt="NexusDFI" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f0f1fa', letterSpacing: '-0.03em' }}>NEXUSDFI</h1>
            </motion.div>

            {/* Header text */}
            <motion.div variants={textReveal} style={{ marginBottom: '36px' }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#f0f1fa',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                marginBottom: '6px',
              }}>
                {isSignUp ? 'Create Account' : 'Welcome back'}
              </h2>
              <p style={{ color: '#4a4d5c', fontSize: '14px', fontWeight: 400 }}>
                {isSignUp ? 'Set up your investigation workspace' : 'Sign in to your investigation workspace'}
              </p>
            </motion.div>

            {/* Email/Password form */}
            <form onSubmit={handleEmailAuth}>
              <motion.div variants={slideUp} style={{ marginBottom: '20px', position: 'relative' }}>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#7a7d8e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: '2px',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-cyber"
                  placeholder="your@email.com"
                  required
                  id="input-email"
                  data-cursor="TYPE"
                />
              </motion.div>

              <motion.div variants={slideUp} style={{ marginBottom: '28px', position: 'relative' }}>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#7a7d8e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: '2px',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-cyber"
                  placeholder="••••••••"
                  required
                  id="input-password"
                  data-cursor="TYPE"
                />
              </motion.div>

              <motion.button
                variants={slideUp}
                type="submit"
                disabled={loading}
                data-cursor="CLICK"
                id="btn-email-auth"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '100px',
                  background: '#1a2ffb',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: loading ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                whileHover={!loading ? {
                  backgroundColor: '#c1ff00',
                  color: '#000000',
                  boxShadow: '0 0 40px rgba(193,255,0,0.3)',
                } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? <Spinner size="sm" /> : <span>{isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}</span>}
              </motion.button>
            </form>

            {/* Divider */}
            <motion.div
              variants={fadeIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                margin: '16px 0',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              <span style={{
                fontSize: '10px',
                color: '#4a4d5c',
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            </motion.div>

            {/* Google Sign-In */}
            <motion.button
              variants={slideUp}
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              id="btn-google-signin"
              data-cursor="CLICK"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '100px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent',
                color: '#b0b3c0',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: loading ? 0.5 : 1,
              }}
              whileHover={!loading ? {
                borderColor: 'rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.03)',
              } : {}}
            >
              {loading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '0.01em' }}>Continue with Google</span>
                </>
              )}
            </motion.button>

            {/* Toggle Sign Up / Sign In */}
            <motion.div variants={fadeIn} style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4a4d5c',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  fontWeight: 400,
                }}
                data-cursor="CLICK"
                onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#1a2ffb'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#4a4d5c'}
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>
            </motion.div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="toast-error"
                  style={{ marginTop: '20px' }}
                >
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Version footer */}
            <motion.div
              variants={fadeIn}
              style={{
                textAlign: 'center',
                marginTop: '32px',
              }}
            >
              <p style={{
                fontSize: '10px',
                color: '#22222e',
                letterSpacing: '0.1em',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                NEXUSDFI v4.0 — DFIR PLATFORM
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
