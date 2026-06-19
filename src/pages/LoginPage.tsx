import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function LoginPage() {
  const { login, loginWithEmail, signupWithEmail, user, loading: authLoading } = useAuth();
  const navigate  = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

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
    <div className="min-h-screen flex" style={{ background: '#0B1220' }}>

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 border-r border-navy-800">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-20">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: '#F8FAFC' }}>
              <img src="/nexusdfi-logo.png" alt="NexusDFI" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <p className="text-white font-semibold text-base font-display">NexusDFI</p>
              <p className="text-[10px] text-navy-400">Digital Forensics & Incident Response</p>
            </div>
          </div>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-4xl font-bold text-white font-display leading-tight mb-5">
              Digital Forensics<br />
              <span className="text-gradient-cyan">Intelligence Platform</span>
            </h1>
            <p className="text-navy-300 text-base leading-relaxed max-w-lg">
              NexusDFI assists investigators in securely managing digital evidence, performing AI-assisted forensic analysis, maintaining chain of custody, and generating investigation reports.
            </p>
          </motion.div>

          {/* Workflow steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 space-y-3"
          >
            {[
              { step: '01', label: 'Case Creation & Assignment' },
              { step: '02', label: 'Evidence Upload & SHA-256 Verification' },
              { step: '03', label: 'AI-Powered Forensic Analysis' },
              { step: '04', label: 'Report Generation & Export' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <span className="text-xs font-mono font-semibold text-accent-400 w-6">{item.step}</span>
                <div className="h-px flex-1 bg-navy-800 max-w-4" />
                <span className="text-sm text-navy-300">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-navy-500"
        >
          Built with React · FastAPI · Firebase Auth · Gemini AI
        </motion.p>
      </div>

      {/* Right panel — login card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="glass w-full max-w-md p-8"
        >
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center mb-8">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ background: '#F8FAFC' }}
            >
              <img src="/nexusdfi-logo.png" alt="NexusDFI" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-white mb-0.5 font-display">NexusDFI</h1>
            <p className="text-sm text-navy-400">Sign in to your investigation workspace</p>
          </motion.div>

          {/* Sign In form */}
          <div className="space-y-4">
            <form onSubmit={handleEmailAuth} className="space-y-3 mb-4">
              <motion.div variants={fadeUp}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-cyber"
                  required
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-cyber"
                  required
                />
              </motion.div>
              
              <motion.button
                variants={fadeUp}
                type="submit"
                disabled={loading}
                className="btn-cyber btn-primary w-full justify-center py-2.5"
              >
                {loading ? <Spinner size="sm" /> : <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>}
              </motion.button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-navy-700"></div>
              <span className="text-xs text-navy-500">or</span>
              <div className="h-px flex-1 bg-navy-700"></div>
            </div>

            <motion.button
              variants={fadeUp}
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              id="btn-google-signin"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg transition-all border border-navy-700 hover:border-navy-600 bg-navy-800/50 hover:bg-navy-800"
            >
              {loading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-sm text-navy-200 font-medium">Continue with Google</span>
                </>
              )}
            </motion.button>
            
            <motion.div variants={fadeUp} className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => setIsSignUp(!isSignUp)} 
                className="text-xs text-navy-400 hover:text-accent-400 transition-colors"
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
                <span>{error}</span>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <motion.div variants={fadeUp} className="text-center mt-8">
            <p className="text-[10px] text-navy-500">NexusDFI v4.0 — Digital Forensics & Incident Response</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
