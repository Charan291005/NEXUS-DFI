import { useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { casesApi } from '../utils/api';
import type { DashboardStats, ActivityItem, RiskLevel } from '../types';
import { StatCard, Card, SectionHeader, Spinner, RiskBadge } from '../components/ui';
import { timeAgo } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const DEFAULT_STATS: DashboardStats = {
  total_cases: 0,
  active_investigations: 0,
  evidence_files: 0,
  high_risk_findings: 0,
  deepfake_detections: 0,
  cases_this_week: 0,
  risk_distribution: [],
  evidence_by_type: [],
  recent_activity: [],
  weekly_cases: [],
};

const RISK_PIE_COLORS: Record<string, string> = {
  Critical: '#ef4444', High: '#F05A28', Medium: '#F59E0B', Low: '#00D4AA', Safe: '#10b981',
};

const ACTIVITY_ICON: Record<string, string> = {
  evidence_uploaded: '📁',
  alert: '🚨',
  analysis_complete: '🔍',
  case_created: '📂',
  report_generated: '📑',
};

const ACTIVITY_COLOR: Record<string, string> = {
  evidence_uploaded: '#00D4AA',
  alert: '#ef4444',
  analysis_complete: '#F05A28',
  case_created: '#FF7A3D',
  report_generated: '#F59E0B',
};

const AnimatedCounter = memo(function AnimatedCounter({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const start  = Date.now();
    const step   = () => {
      const elapsed = (Date.now() - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for smoother deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <>{count}</>;
});

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip = memo(function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-4 py-3 text-xs rounded-xl"
      style={{
        background: 'rgba(10,16,32,0.97)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        border: '1px solid rgba(240,90,40,0.18)',
      }}
    >
      <p className="text-navy-300 font-medium">{label}</p>
      <p className="font-bold text-sm mt-0.5" style={{ color: '#F05A28' }}>{payload[0]?.value} cases</p>
    </div>
  );
});

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState<DashboardStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    casesApi.stats()
      .then(r => setStats(r.data))
      .catch(() => setStats(DEFAULT_STATS))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" label="Loading Dashboard..." />
    </div>
  );

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

      {/* ── Page Header ─────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <p className="text-[11px] text-navy-400 mono tracking-[0.15em] uppercase mb-1.5">Intelligence Overview</p>
        <h1 className="text-3xl font-bold text-white font-display tracking-wide">
          Welcome back, <span className="text-gradient-cyan">{user?.username}</span>
        </h1>
        <p className="text-sm text-navy-300 mt-1.5">
          {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
        </p>
      </motion.div>

      {/* ── Stat Cards ───────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Cases" value={<AnimatedCounter target={stats.total_cases} />}       icon="📂" color="#F05A28"  delta={`+${stats.cases_this_week}`} />
        <StatCard label="Active Investigations" value={<AnimatedCounter target={stats.active_investigations} />} icon="🔍" color="#00D4AA" />
        <StatCard label="Evidence Files" value={<AnimatedCounter target={stats.evidence_files} />} icon="💾" color="#FF7A3D"  />
        <StatCard label="High Risk Findings" value={<AnimatedCounter target={stats.high_risk_findings} />}     icon="⚠️" color="#ef4444"  />
      </motion.div>

      {/* ── Charts Row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Weekly cases area chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <SectionHeader title="Investigation Activity" subtitle="New cases per day this week" icon="📈" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.weekly_cases}>
                <defs>
                  <linearGradient id="caseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F05A28" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#F05A28" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,90,40,0.06)" />
                <XAxis dataKey="day" tick={{ fill:'#4A6080', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#4A6080', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#F05A28" strokeWidth={2.5} fill="url(#caseGrad)" />
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
                <Tooltip
                  contentStyle={{
                    background: 'rgba(12,19,34,0.95)',
                    border: '1px solid rgba(79,110,247,0.15)',
                    borderRadius: 12,
                    fontSize: 11,
                    backdropFilter: 'blur(12px)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
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
                whileHover={{ x: 4 }}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-800/40 hover:bg-navy-700/30 transition-all group cursor-default"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                  style={{ background: `${ACTIVITY_COLOR[item.type]}10`, border: `1px solid ${ACTIVITY_COLOR[item.type]}15` }}
                >
                  {ACTIVITY_ICON[item.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy-200 group-hover:text-white transition-colors leading-snug">{item.message}</p>
                  <p className="text-[11px] text-navy-500 mt-0.5 mono">{timeAgo(item.timestamp)}</p>
                </div>
                {item.severity && <RiskBadge level={item.severity as RiskLevel} />}
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── Threat Intelligence Banner ─────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="glass p-5 border border-red-500/15 bg-red-500/[0.02] rounded-2xl flex items-center gap-4 threat-banner">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center text-xl flex-shrink-0"
            style={{ border: '1px solid rgba(239,68,68,0.15)' }}
          >
            🚨
          </motion.div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400 font-display">Active Threat Detected</p>
            <p className="text-xs text-navy-300 mt-0.5">7 deepfake artifacts found across 3 active cases. Immediate review recommended by the AI Analysis Engine.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            id="btn-view-threats"
            className="btn-cyber btn-danger flex-shrink-0"
          >
            Review Threats
          </motion.button>
        </div>
      </motion.div>

    </motion.div>
  );
}
