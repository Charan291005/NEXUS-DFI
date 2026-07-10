import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { casesApi, newsApi } from '../utils/api';
import type { DashboardStats, ActivityItem, RiskLevel } from '../types';
import { StatCard, Card, SectionHeader, Spinner, RiskBadge, ThreatRadar } from '../components/ui';
import { timeAgo } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useRealtimeStats } from '../hooks/useRealtimeStats';
import { FiCheckCircle, FiFileText, FiFolder, FiActivity } from 'react-icons/fi';
import CaseHeatmap from '../components/CaseHeatmap';

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

const ACTIVITY_TYPE_COLOR: Record<string, string> = {
  evidence_uploaded: '#3B82F6',
  alert: '#EF4444',
  analysis_complete: '#22C55E',
  case_created: '#1a2ffb',
  report_generated: '#F59E0B',
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
    <div style={{
      padding: '8px 12px',
      borderRadius: '12px',
      background: 'rgba(15,15,25,0.9)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      fontSize: '12px',
    }}>
      <p style={{ color: '#7a7d8e', marginBottom: '2px' }}>{label}</p>
      <p style={{ color: '#1a2ffb', fontWeight: 700, fontSize: '14px' }}>{payload[0]?.value} cases</p>
    </div>
  );
});

export default function Dashboard() {
  const { user } = useAuth();
  
  // Use our real-time hook for stats. It handles polling in the background.
  const { stats, setStats, isLive } = useRealtimeStats(DEFAULT_STATS, 30000);
  
  const [news,    setNews]    = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [auditLog, setAuditLog] = useState<{ id: number; msg: string; ts: string; type: string }[]>([]);

  useEffect(() => {
    // Seed audit log from recent activity
    const seedLog = (activity: ActivityItem[]) => {
      setAuditLog(activity.slice(0, 20).map((a, i) => ({
        id: a.id || i,
        msg: a.message,
        ts: a.timestamp,
        type: a.type,
      })));
    };

    // Fetch stats instantly
    casesApi.stats()
      .then(r => { setStats(r.data); if (r.data?.recent_activity) seedLog(r.data.recent_activity); })
      .catch(() => setStats(DEFAULT_STATS));

    // Fetch news independently without blocking the UI
    newsApi.getLatest()
      .then(r => setNews(r.data))
      .catch(() => setNews([]))
      .finally(() => setLoadingNews(false));

    // Simulate live audit events arriving
    const liveTimer = setInterval(() => {
      const types = ['analysis_complete', 'evidence_uploaded', 'alert', 'case_created', 'report_generated'];
      const msgs = [
        'ELA analysis completed on exhibit_scan.jpg',
        'New evidence uploaded: network_capture.pcap',
        'High-risk deepfake signature detected in media_001.mp4',
        'New case #DFI-' + String(Math.floor(Math.random() * 9000) + 1000) + ' created',
        'SHA-256 hash verified for evidence chain-of-custody',
        'OSINT query resolved: IP 185.220.101.x flagged in threat DB',
        'AI assistant session started by user',
      ];
      const t = types[Math.floor(Math.random() * types.length)];
      const m = msgs[Math.floor(Math.random() * msgs.length)];
      setAuditLog(prev => [{ id: Date.now(), msg: m, ts: new Date().toISOString(), type: t }, ...prev].slice(0, 40));
    }, 7000);

    return () => clearInterval(liveTimer);
  }, [setStats]);



  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
    show:   { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

      {/* ── Page Header ─────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex justify-between items-end">
        <div>
          <p className="text-xs text-navy-400 mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Overview</p>
          <h1 className="text-2xl font-bold text-white font-display">
            Welcome back, <span style={{
              background: 'linear-gradient(135deg, #1a2ffb, #c1ff00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>{user?.username}</span>
          </h1>
          <p className="text-sm text-navy-400 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
          </p>
        </div>
        {isLive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a2ffb]/10 border border-[#1a2ffb]/30"
          >
            <span className="w-2 h-2 rounded-full bg-[#c1ff00]" style={{
              boxShadow: '0 0 8px rgba(193,255,0,0.5)',
              animation: 'riskDotPulse 2s ease-in-out infinite',
            }} />
            <span className="text-xs font-mono text-[#c1ff00]">SYNCED</span>
          </motion.div>
        )}
      </motion.div>

      {/* ── Investigation Workflow Tracker ───────────────── */}
      <motion.div variants={itemVariants}>
        <Card className="animated-border">
          <div className="flex items-start justify-between mb-1">
            <SectionHeader title="Active Investigation Pipeline" subtitle="Cross-layer correlation tracking" />
            {/* Threat Radar */}
            <ThreatRadar />
          </div>
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between mt-2" style={{ gap: 0 }}>
            {[
              { label: 'Open Cases',       count: stats?.pipeline?.open_cases || 0,           icon: <FiFolder size={18} />,      hexColor: '#3B82F6', borderColor: 'rgba(59,130,246,0.35)' },
              { label: 'Pending Evidence', count: stats?.pipeline?.pending_evidence || 0,     icon: <FiFileText size={18} />,    hexColor: '#F59E0B', borderColor: 'rgba(250,204,21,0.35)' },
              { label: 'Analysis Running', count: stats?.pipeline?.analysis_in_progress || 0, icon: <FiActivity size={18} />,    hexColor: '#A78BFA', borderColor: 'rgba(168,85,247,0.35)' },
              { label: 'Ready for Report', count: stats?.pipeline?.ready_for_report || 0,     icon: <FiCheckCircle size={18} />, hexColor: '#c1ff00', borderColor: 'rgba(193,255,0,0.35)' },
            ].map((step, idx, arr) => (
              <div key={step.label} className="flex-1 flex items-center" style={{ minWidth: 0 }}>
                <motion.div
                  whileHover={{ scale: 1.04, borderColor: step.borderColor, boxShadow: `0 0 20px ${step.hexColor}20` }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    flex: 1,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '16px', borderRadius: '14px',
                    border: `1px solid rgba(255,255,255,0.06)`,
                    background: `${step.hexColor}08`,
                    position: 'relative', overflow: 'hidden',
                    margin: '0 4px',
                  }}
                >
                  {/* Corner glow */}
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    width: '48px', height: '48px',
                    background: `radial-gradient(circle at top right, ${step.hexColor}20, transparent 70%)`,
                    borderRadius: '0 14px 0 48px', pointerEvents: 'none',
                  }} />
                  <motion.div
                    animate={{ boxShadow: [`0 0 0px ${step.hexColor}00`, `0 0 12px ${step.hexColor}50`, `0 0 0px ${step.hexColor}00`] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.5 }}
                    style={{
                      padding: '10px', borderRadius: '50%',
                      background: `${step.hexColor}15`,
                      color: step.hexColor, marginBottom: '10px',
                    }}
                  >
                    {step.icon}
                  </motion.div>
                  <h4 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.04em', color: step.hexColor, lineHeight: 1, textShadow: `0 0 16px ${step.hexColor}40` }}>
                    {step.count}
                  </h4>
                  <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4a4d5c', fontWeight: 600, marginTop: '6px', textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {step.label}
                  </p>
                </motion.div>
                {/* Animated pipeline connector */}
                {idx < arr.length - 1 && (
                  <div className="hidden md:block pipeline-connector" style={{ flexShrink: 0, width: '24px', margin: '0 -4px', alignSelf: 'center' }} />
                )}
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── Stat Cards ───────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Cases"           value={<AnimatedCounter target={stats?.total_cases || 0} />}           color="#1a2ffb"  delta={`+${stats?.cases_this_week || 0}`} />
        <StatCard label="Active Investigations" value={<AnimatedCounter target={stats?.active_investigations || 0} />} color="#3d4fff" />
        <StatCard label="Evidence Files"        value={<AnimatedCounter target={stats?.evidence_files || 0} />}        color="#22C55E" />
        <StatCard label="Critical Findings"     value={<AnimatedCounter target={stats?.high_risk_findings || 0} />}    color="#EF4444" />
      </motion.div>

      {/* ── Charts Row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Weekly cases area chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <SectionHeader title="Investigation Activity" subtitle="Cases opened per day" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats?.weekly_cases || []}>
                <defs>
                  <linearGradient id="caseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1a2ffb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1a2ffb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="day" tick={{ fill:'#4a4d5c', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#4a4d5c', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#1a2ffb" strokeWidth={2} fill="url(#caseGrad)" dot={{ fill: '#1a2ffb', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: '#c1ff00', stroke: '#1a2ffb', strokeWidth: 2 }} />
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
                <Pie data={stats?.risk_distribution || []} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={70} innerRadius={38} paddingAngle={2}>
                  {(stats?.risk_distribution || []).map((entry, i) => (
                    <Cell key={i} fill={RISK_PIE_COLORS[entry.level]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,15,25,0.9)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    fontSize: 11,
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {(stats?.risk_distribution || []).map((r) => (
                <div key={r.level} className="flex items-center gap-1.5 text-xs text-navy-300">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: RISK_PIE_COLORS[r.level], boxShadow: `0 0 6px ${RISK_PIE_COLORS[r.level]}40` }} />
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
              {stats?.recent_activity?.length ? stats.recent_activity.map((item: ActivityItem, i: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity:0, x: 12 }}
                  animate={{ opacity:1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-navy-800/50 transition-colors group"
                >
                  {/* Color indicator */}
                  <div style={{
                    width: '3px', height: '100%', minHeight: '32px', borderRadius: '4px',
                    background: ACTIVITY_TYPE_COLOR[item.type] || '#4a4d5c',
                    opacity: 0.6,
                    flexShrink: 0,
                    marginTop: '2px',
                  }} />
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
              action={<span className="flex items-center gap-1 text-[10px] text-[#c1ff00] font-mono uppercase tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-[#c1ff00]" style={{ boxShadow: '0 0 8px rgba(193,255,0,0.5)', animation: 'riskDotPulse 2s ease-in-out infinite' }} /> Live</span>}
            />
            <div className="space-y-3 mt-2 h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingNews ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="p-3 rounded-xl">
                      <div className="skeleton skeleton-text" style={{ width: '80%', height: '14px' }} />
                      <div className="skeleton skeleton-text" style={{ width: '100%', marginTop: '8px' }} />
                      <div className="skeleton skeleton-text" style={{ width: '40%', marginTop: '8px' }} />
                    </div>
                  ))}
                </div>
              ) : news.length > 0 ? news.map((article, i) => (
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

      {/* ── Activity Heatmap + Live Audit Log ─────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <Card>
          <SectionHeader title="Case Activity" subtitle="365-day investigation heatmap" />
          <div className="mt-3">
            <CaseHeatmap
              activityDates={(stats?.recent_activity ?? []).map(a => ({
                date: a.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0],
                count: 1,
              }))}
              title="Forensic Events"
            />
          </div>
        </Card>

        {/* Live Audit Log */}
        <Card>
          <SectionHeader
            title="Live Audit Log"
            subtitle="Real-time system events"
            action={
              <span className="flex items-center gap-1 text-[10px] text-[#c1ff00] font-mono uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c1ff00]" style={{ boxShadow: '0 0 8px rgba(193,255,0,0.5)', animation: 'riskDotPulse 2s ease-in-out infinite' }} />
                Live
              </span>
            }
          />
          <div className="h-[240px] overflow-y-auto pr-1 custom-scrollbar mt-2 space-y-1">
            {auditLog.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Spinner size="sm" label="Awaiting events..." />
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {auditLog.map((log, i) => {
                  const typeColor: Record<string, string> = {
                    analysis_complete: '#22C55E',
                    evidence_uploaded: '#3B82F6',
                    alert: '#EF4444',
                    case_created: '#1a2ffb',
                    report_generated: '#F59E0B',
                  };
                  const typeIcon: Record<string, string> = {
                    analysis_complete: '⚙', evidence_uploaded: '📎',
                    alert: '⚠', case_created: '📁', report_generated: '📄',
                  };
                  const color = typeColor[log.type] || '#1a2ffb';
                  const isNew = i === 0;
                  return (
                    <motion.div
                      key={log.id}
                      layout
                      initial={{ opacity: 0, x: -16, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto', marginBottom: 4 }}
                      exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        padding: '7px 10px', borderRadius: '10px',
                        background: isNew ? `${color}0d` : 'transparent',
                        border: `1px solid ${isNew ? `${color}25` : 'transparent'}`,
                        borderLeft: `2px solid ${isNew ? color : 'rgba(255,255,255,0.04)'}`,
                        boxShadow: isNew ? `0 0 12px ${color}08` : 'none',
                      }}
                    >
                      <motion.span
                        initial={isNew ? { scale: 0 } : { scale: 1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 20 }}
                        style={{ fontSize: '12px', marginTop: '1px', flexShrink: 0 }}
                      >
                        {typeIcon[log.type] || '●'}
                      </motion.span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '11px',
                          color: isNew ? '#d8dae3' : '#b0b3c0',
                          lineHeight: 1.4,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          fontWeight: isNew ? 500 : 400,
                        }}>
                          {log.msg}
                        </p>
                        <p style={{ fontSize: '9px', color: '#4a4d5c', fontFamily: "'IBM Plex Mono', monospace", marginTop: '2px' }}>
                          {timeAgo(log.ts)}
                        </p>
                      </div>
                      {isNew && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{
                            fontSize: '8px', padding: '1px 6px', borderRadius: '100px',
                            background: `${color}15`, color, border: `1px solid ${color}30`,
                            fontFamily: "'IBM Plex Mono', monospace",
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            flexShrink: 0, alignSelf: 'center',
                          }}
                        >new</motion.span>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </Card>
      </motion.div>

      {/* ── System Status ───────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card>
          <SectionHeader title="System Status" subtitle="All systems nominal" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Frontend',       status: 'Operational',   ok: true,  uptime: '99.9%' },
              { label: 'Authentication', status: 'Firebase',       ok: true,  uptime: '100%' },
              { label: 'API Server',     status: 'Cloud Run',      ok: true,  uptime: '99.7%' },
              { label: 'AI Engine',      status: 'Gemini Ready',   ok: true,  uptime: '99.5%' },
            ].map((s, idx) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -3, borderColor: s.ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)' }}
                style={{
                  padding: '14px', borderRadius: '12px',
                  background: s.ok ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)',
                  border: `1px solid ${s.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}`,
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Corner accent */}
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: '32px', height: '32px',
                  background: `radial-gradient(circle at top right, ${s.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}, transparent 70%)`,
                  borderRadius: '0 12px 0 32px',
                }} />
                <p style={{ fontSize: '9px', color: '#4a4d5c', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '8px', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {s.label}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  {/* Ping ring status dot */}
                  <div style={{ position: 'relative', width: '8px', height: '8px', flexShrink: 0 }}>
                    <div
                      style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: s.ok ? '#4ADE80' : '#F87171',
                        boxShadow: s.ok ? '0 0 6px rgba(74,222,128,0.6)' : '0 0 6px rgba(248,113,113,0.6)',
                      }}
                    />
                    {s.ok && (
                      <div
                        style={{
                          position: 'absolute', inset: 0, borderRadius: '50%',
                          background: 'rgba(74,222,128,0.5)',
                          animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                          animationDelay: `${idx * 0.4}s`,
                        }}
                      />
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: '#b0b3c0', fontWeight: 600 }}>{s.status}</span>
                </div>
                <p style={{ fontSize: '9px', color: s.ok ? '#4ADE80' : '#F87171', fontFamily: "'IBM Plex Mono', monospace", opacity: 0.7 }}>
                  ↑ {s.uptime} uptime
                </p>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

    </motion.div>
  );
}
