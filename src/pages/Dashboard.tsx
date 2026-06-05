import { useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { casesApi } from '../utils/api';
import type { DashboardStats, ActivityItem } from '../types';
import { StatCard, Card, SectionHeader, Spinner, RiskBadge } from '../components/ui';
import { timeAgo } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

// ── Mock data (used when backend is offline) ──────────────
const MOCK_STATS: DashboardStats = {
  total_cases: 42,
  active_investigations: 8,
  evidence_files: 217,
  high_risk_findings: 15,
  deepfake_detections: 7,
  cases_this_week: 3,
  risk_distribution: [
    { level: 'Critical', count: 5 },
    { level: 'High',     count: 10 },
    { level: 'Medium',   count: 18 },
    { level: 'Low',      count: 25 },
    { level: 'Safe',     count: 42 },
  ],
  evidence_by_type: [
    { type: 'image',    count: 98 },
    { type: 'video',    count: 34 },
    { type: 'log',      count: 52 },
    { type: 'pdf',      count: 18 },
    { type: 'zip',      count: 15 },
  ],
  recent_activity: [
    { id:1, message:'Evidence uploaded for Case #NXDFI-2605-4821',  timestamp: new Date(Date.now()-60000*3).toISOString(),  type:'evidence_uploaded',    severity:'Medium' },
    { id:2, message:'Deepfake detected in Case #NXDFI-2605-3317',   timestamp: new Date(Date.now()-60000*18).toISOString(), type:'alert',                severity:'Critical' },
    { id:3, message:'Image forensics analysis complete',             timestamp: new Date(Date.now()-60000*42).toISOString(), type:'analysis_complete',    severity:'High' },
    { id:4, message:'New case NXDFI-2605-9102 created',             timestamp: new Date(Date.now()-3600000).toISOString(),  type:'case_created' },
    { id:5, message:'PDF report generated for Case #NXDFI-2605-1244', timestamp: new Date(Date.now()-3600000*2).toISOString(), type:'report_generated' },
    { id:6, message:'Log anomalies detected: 14 suspicious events', timestamp: new Date(Date.now()-3600000*5).toISOString(), type:'alert',               severity:'High' },
  ],
  weekly_cases: [
    { day: 'Mon', count: 4 },
    { day: 'Tue', count: 7 },
    { day: 'Wed', count: 3 },
    { day: 'Thu', count: 9 },
    { day: 'Fri', count: 6 },
    { day: 'Sat', count: 2 },
    { day: 'Sun', count: 5 },
  ],
};

const RISK_PIE_COLORS: Record<string, string> = {
  Critical: '#ef4444', High: '#ea580c', Medium: '#f59e0b', Low: '#3b82f6', Safe: '#10b981',
};

const ACTIVITY_ICON: Record<string, string> = {
  evidence_uploaded: '📁',
  alert: '🚨',
  analysis_complete: '🔍',
  case_created: '📂',
  report_generated: '📑',
};

const ACTIVITY_COLOR: Record<string, string> = {
  evidence_uploaded: '#3b82f6',
  alert: '#ef4444',
  analysis_complete: '#10b981',
  case_created: '#8b5cf6',
  report_generated: '#f59e0b',
};

const AnimatedCounter = memo(function AnimatedCounter({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const start  = Date.now();
    const step   = () => {
      const elapsed = (Date.now() - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <>{count}</>;
});

const CustomTooltip = memo(function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-3 py-2 text-xs">
      <p className="text-navy-300">{label}</p>
      <p className="text-accent-400 font-bold">{payload[0]?.value}</p>
    </div>
  );
});

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState<DashboardStats>(MOCK_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    casesApi.stats()
      .then(r => setStats(r.data))
      .catch(() => setStats(MOCK_STATS))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" label="Loading Dashboard..." />
    </div>
  );

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

      {/* ── Page Header ─────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <p className="text-xs text-navy-400 mono tracking-widest uppercase mb-1">Intelligence Overview</p>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, <span className="text-gradient-cyan">{user?.username}</span>
        </h1>
        <p className="text-sm text-navy-300 mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
        </p>
      </motion.div>

      {/* ── Stat Cards (reduced to 4) ───────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Cases" value={<AnimatedCounter target={stats.total_cases} />}       icon="📂" color="#3b82f6"  delta={`+${stats.cases_this_week}`} />
        <StatCard label="Active Investigations" value={<AnimatedCounter target={stats.active_investigations} />} icon="🔍" color="#8b5cf6" />
        <StatCard label="Evidence Files" value={<AnimatedCounter target={stats.evidence_files} />} icon="💾" color="#10b981"  />
        <StatCard label="High Risk Findings" value={<AnimatedCounter target={stats.high_risk_findings} />}     icon="⚠️" color="#ea580c"  />
      </motion.div>

      {/* ── Charts Row (2 columns) ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Weekly cases area chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <SectionHeader title="Investigation Activity" subtitle="New cases per day this week" icon="📈" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.weekly_cases}>
                <defs>
                  <linearGradient id="caseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4f6ef7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,110,247,0.06)" />
                <XAxis dataKey="day" tick={{ fill:'#5a6d8e', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#5a6d8e', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#4f6ef7" strokeWidth={2} fill="url(#caseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Risk pie chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <SectionHeader title="Risk Distribution" subtitle="All findings" icon="🎯" />
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={stats.risk_distribution} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={70} innerRadius={38} paddingAngle={2}>
                  {stats.risk_distribution.map((entry, i) => (
                    <Cell key={i} fill={RISK_PIE_COLORS[entry.level]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [v, n]} contentStyle={{ background:'#0b1120', border:'1px solid rgba(79,110,247,0.2)', borderRadius:10, fontSize:11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {stats.risk_distribution.map((r) => (
                <div key={r.level} className="flex items-center gap-1.5 text-xs text-navy-300">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: RISK_PIE_COLORS[r.level] }} />
                  <span>{r.level}</span>
                  <span className="ml-auto text-white font-medium">{r.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Activity Feed ───────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card>
          <SectionHeader title="Recent Activity" subtitle="Latest forensic events" icon="⚡" />
          <div className="space-y-2">
            {stats.recent_activity.map((item: ActivityItem, i: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity:0, x: 20 }}
                animate={{ opacity:1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-navy-800/50 hover:bg-navy-700/40 transition-colors group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                  style={{ background: `${ACTIVITY_COLOR[item.type]}15` }}
                >
                  {ACTIVITY_ICON[item.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy-200 group-hover:text-white transition-colors leading-snug">{item.message}</p>
                  <p className="text-[11px] text-navy-500 mt-0.5 mono">{timeAgo(item.timestamp)}</p>
                </div>
                {item.severity && <RiskBadge level={item.severity as any} />}
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── Threat Intelligence Banner ─────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="glass p-4 border border-red-500/20 bg-red-500/[0.03] rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center text-xl flex-shrink-0">🚨</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400">Active Threat Detected</p>
            <p className="text-xs text-navy-300 mt-0.5">7 deepfake artifacts found across 3 active cases. Immediate review recommended by the AI Analysis Engine.</p>
          </div>
          <button id="btn-view-threats" className="btn-cyber btn-danger flex-shrink-0">Review Threats</button>
        </div>
      </motion.div>

    </motion.div>
  );
}
