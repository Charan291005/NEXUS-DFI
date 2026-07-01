import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Card, SectionHeader } from '../components/ui';

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'pending' | 'already_admin'>('idle');
  const [defaultDate] = useState(() => Date.now());

  const handleRequestAdmin = async () => {
    setRequestStatus('loading');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/request-admin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === 'pending') setRequestStatus('pending');
      else if (data.status === 'already_admin') setRequestStatus('already_admin');
      else setRequestStatus('idle');
    } catch (err) {
      console.error('Failed to request admin access', err);
      setRequestStatus('idle');
    }
  };

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
    show:   { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <PageHeader title="User Profile" subtitle="Account settings and access privileges" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Details */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="text-center p-6 border-navy-800">
              {/* Avatar with animated ring */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute', inset: '-4px', borderRadius: '16px',
                    border: '2px solid transparent',
                    borderTopColor: '#1a2ffb',
                    borderRightColor: '#c1ff00',
                  }}
                />
                <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #1a2ffb, #3d4fff)' }}
                >
                  {user?.username?.[0]?.toUpperCase() ?? 'U'}
                </div>
              </div>

              <h2 className="text-lg font-bold text-white truncate font-display">{user?.username}</h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded border border-accent-500/20 bg-accent-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400" style={{ boxShadow: '0 0 6px rgba(61,79,255,0.5)' }} />
                <span className="text-xs font-semibold text-accent-400 uppercase tracking-wider">{user?.role}</span>
              </div>
              <p className="text-xs text-navy-400 mt-4 mono">ID: {user?.id ?? 'N/A'} | Joined: {new Date(user?.created_at || defaultDate).toLocaleDateString()}</p>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-6 border-navy-800">
              <SectionHeader title="Access Privileges" />
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-navy-400 mb-1">Current Role</p>
                  <p className="text-sm font-medium text-white">{user?.role}</p>
                </div>
                
                {user?.role !== 'Admin' && (
                  <div className="pt-3 border-t border-navy-800">
                    <motion.button
                      onClick={handleRequestAdmin}
                      disabled={requestStatus !== 'idle'}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-cyber w-full justify-center text-xs py-2 bg-navy-800 hover:bg-navy-700 text-white disabled:opacity-50"
                    >
                      {requestStatus === 'idle' && 'Request Admin Access'}
                      {requestStatus === 'loading' && 'Submitting...'}
                      {requestStatus === 'pending' && 'Request Pending Review'}
                      {requestStatus === 'already_admin' && 'You are an Admin'}
                    </motion.button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Features & Logs */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="p-6 border-navy-800">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader title="Security Checkup" />
                <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wider"
                  style={{ boxShadow: '0 0 12px rgba(34,197,94,0.15)' }}
                >Secure</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Multi-Factor Auth', value: 'Enabled (Hardware Token)', color: '#4ADE80' },
                  { label: 'Active Sessions', value: '1 session (Current IP)', color: '#b0b3c0' },
                  { label: 'Last Password Change', value: '45 days ago', color: '#b0b3c0' },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    whileHover={{ y: -2, borderColor: 'rgba(26,47,251,0.15)' }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-lg bg-navy-900/50 border border-navy-800 flex flex-col card-spotlight"
                  >
                    <span className="font-semibold text-white mb-1">{item.label}</span>
                    <span style={{ color: item.color }} className="mt-auto">{item.value}</span>
                  </motion.div>
                ))}
                <motion.div
                  whileHover={{ y: -2, borderColor: 'rgba(26,47,251,0.3)', background: 'rgba(26,47,251,0.05)' }}
                  className="p-4 rounded-lg bg-navy-900/50 border border-navy-800 flex flex-col justify-center items-center cursor-pointer transition-colors"
                >
                  <span className="font-semibold text-accent-400">Run Audit Scan →</span>
                </motion.div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-6 border-navy-800">
              <SectionHeader title="Recent Activity" />
              <div className="relative border-l border-navy-800 ml-2 space-y-5 pb-2 mt-4">
                {[
                  { time: 'Just now', action: 'Accessed User Profile', type: 'info', color: '#3d4fff' },
                  { time: '2 hours ago', action: 'Logged into NexusDFI', type: 'auth', color: '#1a2ffb' },
                  { time: 'Yesterday', action: 'Viewed Case #NXDFI-2605', type: 'case', color: '#7a7d8e' },
                  { time: '3 days ago', action: 'Requested Analysis on evidence_01.jpg', type: 'analysis', color: '#F59E0B' }
                ].map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                    className="relative pl-5"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.1, type: 'spring', stiffness: 300 }}
                      className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-navy-900"
                      style={{ background: log.color, boxShadow: `0 0 6px ${log.color}40` }}
                    />
                    <p className="text-sm text-white">{log.action}</p>
                    <p className="text-[10px] text-navy-500 mt-0.5 mono">{log.time}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
