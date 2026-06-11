import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FEATURE_PILLS = [
  '🔍 Image Forensics',
  '🤖 AI Analysis',
  '📊 Risk Assessment',
  '🔒 Deepfake Detection',
  '📑 PDF Reports',
];

export default function LoginPage() {
  const { login, loginWithEmail, signupWithEmail } = useAuth();
  const navigate  = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login();
      navigate('/dashboard');
    } catch {
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: any) => {
    e.preventDefault();
    
    // Client-side validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signupWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      // Firebase error mapping
      const code = err.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('Incorrect email or password.');
      } else if (code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Try again later.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
        console.error("Auth Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: '#070B14' }}>
      {/* Hex grid overlay */}
      <div className="absolute inset-0 hex-grid opacity-70" />

      {/* Grid lines overlay */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Ambient glow orbs */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden sm:block absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(240,90,40,0.08), transparent 60%)', filter: 'blur(70px)' }}
      />
      <motion.div
        animate={{
          x: [0, -30, 40, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden sm:block absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.06), transparent 60%)', filter: 'blur(70px)' }}
      />
      <motion.div
        animate={{
          x: [0, 20, -15, 0],
          y: [0, -25, 20, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden sm:block absolute top-3/4 left-1/5 w-[350px] h-[350px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(240,90,40,0.04), transparent 60%)', filter: 'blur(60px)' }}
      />

      {/* Left panel — branding (hidden on small screens) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative z-10">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center logo-pulse"
              style={{
                background: 'linear-gradient(135deg, #F05A28, #C84820)',
                boxShadow: '0 8px 32px rgba(240,90,40,0.35)',
              }}
            >
              <span className="text-white font-bold text-xl font-display">NX</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg font-display">NexusDFI</p>
              <p className="text-[10px] tracking-[0.22em] mono font-medium" style={{ color: '#F05A28' }}>FORENSICS INTELLIGENCE</p>
            </div>
          </div>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h1 className="text-5xl font-bold text-white font-display leading-tight mb-4">
              Digital Forensics<br />
              <span className="text-gradient-orange">Intelligence</span><br />
              Platform
            </h1>
            <p className="text-navy-300 text-lg leading-relaxed max-w-md">
              AI-powered investigation platform for law enforcement, security researchers, and forensic analysts.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap gap-2 mt-8"
          >
            {FEATURE_PILLS.map((pill, i) => (
              <motion.span
                key={pill}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-navy-200"
                style={{
                  background: 'rgba(14,22,40,0.85)',
                  border: '1px solid rgba(240,90,40,0.18)',
                }}
              >
                {pill}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { value: '10+', label: 'AI Modules' },
            { value: '256-bit', label: 'AES Encryption' },
            { value: 'Real-time', label: 'Analysis Engine' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold font-display text-gradient-orange">{stat.value}</p>
              <p className="text-xs text-navy-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right panel — login card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="glass w-full max-w-md"
          style={{
            padding: '2rem',
            boxShadow: '0 30px 90px rgba(0,0,0,0.6), 0 0 50px rgba(240,90,40,0.06)',
            border: '1px solid rgba(240,90,40,0.12)',
          }}
        >
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center mb-8">
            <motion.div
              whileHover={{ scale: 1.06, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="w-18 h-18 w-[72px] h-[72px] mx-auto mb-5 rounded-2xl flex items-center justify-center logo-pulse"
              style={{
                background: 'linear-gradient(135deg, #F05A28, #C84820)',
                boxShadow: '0 10px 36px rgba(240,90,40,0.35)',
              }}
            >
              <span className="text-white font-bold text-2xl font-display">NX</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-1 font-display tracking-wide">NexusDFI</h1>
            <p className="text-xs tracking-[0.22em] font-semibold uppercase mono" style={{ color: '#F05A28' }}>
              Digital Forensics Intelligence
            </p>
            <p className="text-sm text-navy-400 mt-2.5">Enterprise Digital Evidence Management</p>
          </motion.div>

          {/* Status bar */}
          <motion.div
            variants={fadeUp}
            className="flex items-center gap-2 mb-6 px-3 py-2.5 rounded-lg"
            style={{
              background: 'rgba(0,212,170,0.06)',
              border: '1px solid rgba(0,212,170,0.14)',
            }}
          >
            <div className="status-dot" />
            <span className="text-xs font-medium" style={{ color: '#00D4AA' }}>Secure Connection Established</span>
            <span className="ml-auto text-[10px] mono" style={{ color: '#4A6080' }}>TLS 1.3</span>
          </motion.div>

          {/* Sign In form */}
          <div className="space-y-4">
            <form onSubmit={handleEmailAuth} className="space-y-4 mb-4">
              <motion.div variants={fadeUp}>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-navy-900/50 border border-navy-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500 transition-colors placeholder:text-navy-500 text-sm"
                  required
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-navy-900/50 border border-navy-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-orange-500 transition-colors placeholder:text-navy-500 text-sm"
                  required
                />
              </motion.div>
              
              <motion.button
                variants={fadeUp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl transition-all relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #F05A28, #C84820)',
                  boxShadow: '0 8px 32px rgba(240,90,40,0.25)',
                }}
              >
                {loading ? <Spinner size="sm" /> : <span className="text-white font-medium">{isSignUp ? 'Sign Up' : 'Sign In'}</span>}
              </motion.button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-navy-800"></div>
              <span className="text-xs text-navy-500 font-medium">OR</span>
              <div className="h-px flex-1 bg-navy-800"></div>
            </div>

            <motion.button
              variants={fadeUp}
              whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              id="btn-google-signin"
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl transition-all relative overflow-hidden group"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              {/* Shimmer on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {loading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-white font-medium">Continue with Google</span>
                </>
              )}
            </motion.button>
            
            <motion.div variants={fadeUp} className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => setIsSignUp(!isSignUp)} 
                className="text-xs text-navy-400 hover:text-white transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="toast-error mt-2"
              >
                <span>⚠️</span>
                <span>{error}</span>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <motion.div variants={fadeUp} className="text-center mt-8 space-y-1">
            <p className="text-[10px] text-navy-500 tracking-wider">
              Secured by 256-bit AES Encryption · Firebase Auth
            </p>
            <p className="text-[10px] text-navy-600 mono">NexusDFI v3.0.0 — Forensics Intelligence Platform</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
