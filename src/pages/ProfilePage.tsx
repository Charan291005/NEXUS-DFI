import { useState } from 'react';
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

  return (
    <div className="space-y-6">
      <PageHeader title="User Profile" subtitle="Account settings and access privileges" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="text-center p-6 border-navy-800">
            <div className="w-20 h-20 mx-auto rounded-xl flex items-center justify-center text-3xl font-bold text-white mb-4 bg-accent-600">
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <h2 className="text-lg font-bold text-white truncate font-display">{user?.username}</h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded border border-accent-500/20 bg-accent-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400"></span>
              <span className="text-xs font-semibold text-accent-400 uppercase tracking-wider">{user?.role}</span>
            </div>
            <p className="text-xs text-navy-400 mt-4 mono">ID: {user?.id ?? 'N/A'} | Joined: {new Date(user?.created_at || defaultDate).toLocaleDateString()}</p>
          </Card>

          <Card className="p-6 border-navy-800">
            <SectionHeader title="Access Privileges" />
            <div className="space-y-4">
              <div>
                <p className="text-xs text-navy-400 mb-1">Current Role</p>
                <p className="text-sm font-medium text-white">{user?.role}</p>
              </div>
              
              {user?.role !== 'Admin' && (
                <div className="pt-3 border-t border-navy-800">
                  <button 
                    onClick={handleRequestAdmin}
                    disabled={requestStatus !== 'idle'}
                    className="btn-cyber w-full justify-center text-xs py-2 bg-navy-800 hover:bg-navy-700 text-white disabled:opacity-50"
                  >
                    {requestStatus === 'idle' && 'Request Admin Access'}
                    {requestStatus === 'loading' && 'Submitting...'}
                    {requestStatus === 'pending' && 'Request Pending Review'}
                    {requestStatus === 'already_admin' && 'You are an Admin'}
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Features & Logs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-navy-800">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader title="Security Checkup" />
              <span className="px-2.5 py-1 rounded text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wider">Secure</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-lg bg-navy-900/50 border border-navy-800 flex flex-col">
                <span className="font-semibold text-white mb-1">Multi-Factor Auth</span>
                <span className="text-green-400 mt-auto">Enabled (Hardware Token)</span>
              </div>
              <div className="p-4 rounded-lg bg-navy-900/50 border border-navy-800 flex flex-col">
                <span className="font-semibold text-white mb-1">Active Sessions</span>
                <span className="text-navy-300 mt-auto">1 session (Current IP)</span>
              </div>
              <div className="p-4 rounded-lg bg-navy-900/50 border border-navy-800 flex flex-col">
                <span className="font-semibold text-white mb-1">Last Password Change</span>
                <span className="text-navy-300 mt-auto">45 days ago</span>
              </div>
              <div className="p-4 rounded-lg bg-navy-900/50 border border-navy-800 flex flex-col justify-center items-center cursor-pointer hover:bg-navy-800 transition-colors">
                <span className="font-semibold text-accent-400">Run Audit Scan →</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-navy-800">
            <SectionHeader title="Recent Activity" />
            <div className="relative border-l border-navy-800 ml-2 space-y-5 pb-2 mt-4">
              {[
                { time: 'Just now', action: 'Accessed User Profile', type: 'info' },
                { time: '2 hours ago', action: 'Logged into NexusDFI', type: 'auth' },
                { time: 'Yesterday', action: 'Viewed Case #NXDFI-2605', type: 'case' },
                { time: '3 days ago', action: 'Requested Analysis on evidence_01.jpg', type: 'analysis' }
              ].map((log, i) => (
                <div key={i} className="relative pl-5">
                  <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-navy-900 ${
                    log.type === 'auth' ? 'bg-accent-500' :
                    log.type === 'case' ? 'bg-navy-400' :
                    log.type === 'analysis' ? 'bg-amber-500' : 'bg-accent-400'
                  }`}></div>
                  <p className="text-sm text-white">{log.action}</p>
                  <p className="text-[10px] text-navy-500 mt-0.5 mono">{log.time}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
