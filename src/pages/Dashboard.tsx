import { useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { casesApi, newsApi } from '../utils/api';
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

interface NewsArticle {
  title: string;
  link: string;
  pub_date: string;
  description: string;
}

const RISK_PIE_COLORS: Record<string, string> = {
  Critical: '#DC2626', High: '#EF4444', Medium: '#F59E0B', Low: '#3B82F6', Safe: '#22C55E',
};

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  evidence_uploaded: 'Evidence',
  alert: 'Alert',
  analysis_complete: 'Analysis',
  case_created: 'Case',
  report_generated: 'Report',
};

const AnimatedCounter = memo(function AnimatedCounter({ target, duration = 1.2 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const start  = Date.now();
    const step   = () => {
      const elapsed = (Date.now() - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
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
    <div className="px-3 py-2 text-xs rounded-lg" style={{ background: '#1E293B', border: '1px solid #334155' }}>
      <p className="text-navy-400">{label}</p>
      <p className="font-semibold text-sm text-accent-400 mt-0.5">{payload[0]?.value} cases</p>
    </div>
  );
});

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState<DashboardStats>(DEFAULT_STATS);
  const [news,    setNews]    = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      casesApi.stats().catch(() => ({ data: DEFAULT_STATS })),
      newsApi.getLatest().catch(() => ({ data: [] }))
    ])
      .then(([statsRes, newsRes]) => {
        setStats(statsRes.data);
        setNews(newsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" label="Loading dashboard..." />
    </div>
  );

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

      {/* ── Page Header ─────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <p className="text-xs text-navy-400 mb-1">Overview</p>
        <h1 className="text-2xl font-bold text-white font-display">
          Welcome back, <span className="text-accent-400">{user?.username}</span>
        </h1>
        <p className="text-sm text-navy-400 mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
        </p>
      </motion.div>

      {/* ── Stat Cards ───────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Cases"           value={<AnimatedCounter target={stats.total_cases} />}           color="#2563EB"  delta={`+${stats.cases_this_week}`} />
        <StatCard label="Active Investigations" value={<AnimatedCounter target={stats.active_investigations} />} color="#3B82F6" />
        <StatCard label="Evidence Files"        value={<AnimatedCounter target={stats.evidence_files} />}        color="#22C55E" />
        <StatCard label="Critical Findings"     value={<AnimatedCounter target={stats.high_risk_findings} />}    color="#EF4444" />
      </motion.div>

      {/* ── Charts Row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Weekly cases area chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <SectionHeader title="Investigation Activity" subtitle="Cases opened per day" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.weekly_cases}>
                <defs>
                  <linearGradient id="caseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
                <XAxis dataKey="day" tick={{ fill:'#64748B', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#64748B', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} fill="url(#caseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Risk pie chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <SectionHeader title="Risk Distribution" subtitle="All findings" />
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={stats.risk_distribution} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={70} innerRadius={38} paddingAngle={2}>
                  {stats.risk_distribution.map((entry, i) => (
                    <Cell key={i} fill={RISK_PIE_COLORS[entry.level]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {stats.risk_distribution.map((r) => (
                <div key={r.level} className="flex items-center gap-1.5 text-xs text-navy-300">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: RISK_PIE_COLORS[r.level] }} />
                  <span>{r.level}</span>
                  <span className="ml-auto text-white font-medium">{r.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Activity & News Feed ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={itemVariants}>
          <Card>
            <SectionHeader title="Recent Activity" subtitle="Latest investigation events" />
            <div className="space-y-1">
              {stats.recent_activity.length > 0 ? stats.recent_activity.map((item: ActivityItem, i: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity:0, x: 8 }}
                  animate={{ opacity:1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-navy-800/50 transition-colors"
                >
                  <div className="mt-1">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-navy-800 text-navy-400 border border-navy-700">
                      {ACTIVITY_TYPE_LABEL[item.type] || item.type}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy-200 leading-snug">{item.message}</p>
                    <p className="text-[11px] text-navy-500 mono mt-0.5">{timeAgo(item.timestamp)}</p>
                  </div>
                  {item.severity && <RiskBadge level={item.severity as RiskLevel} />}
                </motion.div>
              )) : (
                <div className="p-4 text-center text-sm text-navy-400 border border-dashed border-navy-700 rounded-lg">
                  No recent activity found.
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── Cyber Intelligence Feed ────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card>
            <SectionHeader 
              title="Live Intelligence Feed" 
              subtitle="Real-time cybercrime & forensics news" 
              action={<span className="flex items-center gap-1 text-[10px] text-[#c1ff00] font-mono uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-[#c1ff00] animate-pulse" /> Live</span>}
            />
            <div className="space-y-3 mt-2 h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              {news.length > 0 ? news.map((article, i) => (
                <motion.a
                  key={i}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity:0, y: 8 }}
                  animate={{ opacity:1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="block p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(26,47,251,0.3)] transition-all cursor-pointer group"
                >
                  <h4 className="text-[13px] font-semibold text-[#f0f1fa] group-hover:text-[#1a2ffb] transition-colors leading-snug mb-1">
                    {article.title}
                  </h4>
                  <p className="text-[11px] text-[#7a7d8e] line-clamp-2 mb-2 leading-relaxed">
                    {article.description}
                  </p>
                  <p className="text-[9px] text-[#4a4d5c] font-mono uppercase tracking-wider">
                    {article.pub_date}
                  </p>
                </motion.a>
              )) : (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                   <Spinner size="sm" label="Fetching live feeds..." />
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── System Status ───────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card>
          <SectionHeader title="System Status" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Frontend',       status: 'Operational', ok: true },
              { label: 'Authentication', status: 'Firebase Active', ok: true },
              { label: 'API Server',     status: 'Cloud Run', ok: true },
              { label: 'AI Engine',      status: 'Gemini Ready', ok: true },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-lg bg-navy-950/50 border border-navy-800">
                <p className="text-[10px] text-navy-400 uppercase tracking-wider mb-1">{s.label}</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${s.ok ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-xs text-navy-200 font-medium">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

    </motion.div>
  );
}
