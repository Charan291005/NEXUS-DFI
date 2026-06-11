import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'pending' | 'already_admin'>('idle');

  const handleRequestAdmin = async () => {
    setRequestStatus('loading');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/request-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.status === 'pending') {
        setRequestStatus('pending');
      } else if (data.status === 'already_admin') {
        setRequestStatus('already_admin');
      } else {
        setRequestStatus('idle');
      }
    } catch (err) {
      console.error('Failed to request admin access', err);
      setRequestStatus('idle');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">User Profile</h1>
          <p className="text-navy-300 text-sm mt-1">Manage your account settings and access privileges.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 text-center">
            <div className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-[0_0_20px_rgba(240,90,40,0.3)]" style={{ background: 'linear-gradient(135deg, #F05A28, #C84820)' }}>
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <h2 className="text-xl font-bold text-white truncate">{user?.username}</h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full border border-accent-400/20 bg-accent-400/10">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400"></span>
              <span className="text-xs font-semibold text-accent-400 uppercase tracking-wider">{user?.role}</span>
            </div>
            <p className="text-xs text-navy-400 mt-4 mono">ID: {user?.id ?? 'N/A'} | Joined: {new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
          </div>

          <div className="glass p-6">
            <h3 className="text-sm font-semibold text-navy-100 mb-4 border-b border-navy-700/50 pb-2">Access Privileges</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-navy-300 mb-1">Current Role</p>
                <p className="text-sm font-medium text-white">{user?.role}</p>
              </div>
              
              {user?.role !== 'Admin' && (
                <div className="pt-2">
                  <button 
                    onClick={handleRequestAdmin}
                    disabled={requestStatus !== 'idle'}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                      requestStatus === 'idle' ? 'bg-navy-700 hover:bg-navy-600 text-white' : 
                      requestStatus === 'loading' ? 'bg-navy-800 text-navy-400 cursor-not-allowed' :
                      'bg-teal-500/10 text-teal-400 border border-teal-500/20 cursor-not-allowed'
                    }`}
                  >
                    {requestStatus === 'idle' && 'Request Admin Access'}
                    {requestStatus === 'loading' && 'Submitting...'}
                    {requestStatus === 'pending' && '✓ Request Pending Review'}
                    {requestStatus === 'already_admin' && 'You are an Admin'}
                  </button>
                  <p className="text-[10px] text-navy-400 mt-2 text-center">Requires approval from the Chairman.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Features & Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white font-display">Security Checkup</h3>
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">Secure</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-navy-800/50 border border-navy-700/50 flex flex-col">
                <span className="text-xl mb-2">🔐</span>
                <span className="text-sm font-semibold text-white mb-1">Two-Factor Auth</span>
                <span className="text-xs text-teal-400 mt-auto">Enabled (Authenticator App)</span>
              </div>
              <div className="p-4 rounded-xl bg-navy-800/50 border border-navy-700/50 flex flex-col">
                <span className="text-xl mb-2">💻</span>
                <span className="text-sm font-semibold text-white mb-1">Active Sessions</span>
                <span className="text-xs text-navy-300 mt-auto">1 session (Current IP)</span>
              </div>
              <div className="p-4 rounded-xl bg-navy-800/50 border border-navy-700/50 flex flex-col">
                <span className="text-xl mb-2">🔑</span>
                <span className="text-sm font-semibold text-white mb-1">Last Password Change</span>
                <span className="text-xs text-navy-300 mt-auto">45 days ago</span>
              </div>
              <div className="p-4 rounded-xl bg-navy-800/50 border border-navy-700/50 flex flex-col justify-center items-center cursor-pointer hover:bg-navy-700/50 transition-colors">
                <span className="text-sm font-semibold text-accent-400">Run Full Scan →</span>
              </div>
            </div>
          </div>

          <div className="glass p-6">
            <h3 className="text-lg font-semibold text-white font-display mb-4">Recent Activity</h3>
            <div className="relative border-l-2 border-navy-700/50 ml-3 space-y-6 pb-2">
              {[
                { time: 'Just now', action: 'Accessed User Profile', type: 'info' },
                { time: '2 hours ago', action: 'Logged into NexusDFI', type: 'auth' },
                { time: 'Yesterday', action: 'Viewed Case #NX-2023-004', type: 'case' },
                { time: '3 days ago', action: 'Requested Analysis on evidence_01.jpg', type: 'analysis' }
              ].map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="relative pl-6"
                >
                  <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-navy-900 ${
                    log.type === 'auth' ? 'bg-teal-500' :
                    log.type === 'case' ? 'bg-accent-400' :
                    log.type === 'analysis' ? 'bg-purple-500' : 'bg-blue-500'
                  }`}></div>
                  <p className="text-sm text-white">{log.action}</p>
                  <p className="text-xs text-navy-400 mt-0.5">{log.time}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
