import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [mode,     setMode]     = useState<'login'|'demo'>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid credentials. Try admin / admin123');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async () => {
    setMode('demo');
    setLoading(true);
    try {
      await login('admin', 'admin123');
      navigate('/dashboard');
    } catch {
      setError('Demo login failed. Please start the backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-bg flex items-center justify-center relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #4f6ef7, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass p-8 w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f6ef7, #3b5ce4)', boxShadow: '0 8px 25px rgba(79,110,247,0.25)' }}>
            <span className="text-white font-bold text-2xl">NX</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">NexusDFI</h1>
          <p className="text-xs text-accent-400 tracking-widest font-semibold uppercase">Digital Forensics Intelligence</p>
          <p className="text-sm text-navy-400 mt-2">Enterprise Digital Evidence Management</p>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-accent-500/8 border border-accent-500/15">
          <div className="w-2 h-2 rounded-full bg-accent-400" />
          <span className="text-xs text-accent-300 font-medium">Secure Connection Established</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-cyber">Investigator ID</label>
            <input
              id="input-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              className="input-cyber"
              required
            />
          </div>
          <div>
            <label className="label-cyber">Access Code</label>
            <input
              id="input-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="input-cyber"
              required
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400"
            >
              ⚠ {error}
            </motion.div>
          )}

          <button
            id="btn-login"
            type="submit"
            disabled={loading}
            className="btn-cyber btn-primary w-full justify-center py-2.5 mt-2"
          >
            {loading && mode === 'login' ? <Spinner size="sm" /> : null}
            {loading && mode === 'login' ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="divider-cyber" />

        <button
          id="btn-demo"
          onClick={demoLogin}
          disabled={loading}
          className="btn-cyber btn-cyan w-full justify-center py-2.5"
        >
          {loading && mode === 'demo' ? <Spinner size="sm" /> : null}
          {loading && mode === 'demo' ? 'Authenticating...' : 'Demo Access'}
        </button>

        <p className="text-center text-xs text-navy-400 mt-4">
          Demo: admin / admin123
        </p>

        {/* Footer */}
        <p className="text-center text-[10px] text-navy-500 mt-8">
          Secured by 256-bit AES Encryption
        </p>
      </motion.div>
    </div>
  );
}
