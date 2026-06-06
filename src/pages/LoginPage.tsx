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

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen page-bg flex items-center justify-center relative overflow-hidden">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-60" />

      {/* Ambient glow orbs */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #4f6ef7, transparent 60%)', filter: 'blur(60px)' }}
      />
      <motion.div
        animate={{
          x: [0, -20, 30, 0],
          y: [0, 30, -20, 0],
          scale: [1, 0.95, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full opacity-[0.04]"
        style={{ background: 'radial-gradient(circle, #FF6B35, transparent 60%)', filter: 'blur(60px)' }}
      />
      <motion.div
        animate={{
          x: [0, 15, -10, 0],
          y: [0, -20, 15, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-2/3 left-1/5 w-[300px] h-[300px] rounded-full opacity-[0.03]"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent 60%)', filter: 'blur(60px)' }}
      />

      {/* Main card */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="glass p-8 w-full max-w-md relative z-10"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 40px rgba(79,110,247,0.05)' }}
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="text-center mb-8">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #4f6ef7, #3b5ce4)',
              boxShadow: '0 8px 32px rgba(79,110,247,0.3)',
            }}
          >
            <span className="text-white font-bold text-2xl font-display">NX</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-1 font-display tracking-wide">NexusDFI</h1>
          <p className="text-xs text-accent-400 tracking-[0.2em] font-semibold uppercase">Digital Forensics Intelligence</p>
          <p className="text-sm text-navy-400 mt-2.5">Enterprise Digital Evidence Management</p>
        </motion.div>

        {/* Status bar */}
        <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6 px-3 py-2.5 rounded-lg bg-accent-500/6 border border-accent-500/12">
          <div className="w-2 h-2 rounded-full bg-accent-400 pulse-dot" />
          <span className="text-xs text-accent-300 font-medium">Secure Connection Established</span>
        </motion.div>

        {/* Form */}
        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-white font-medium">Continue with Google</span>
              </>
            )}
          </motion.button>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/15 text-xs text-red-400 text-center mt-4"
            >
              ⚠ {error}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <motion.p variants={fadeUp} className="text-center text-[10px] text-navy-500 mt-8 tracking-wider">
          Secured by 256-bit AES Encryption
        </motion.p>
      </motion.div>
    </div>
  );
}
