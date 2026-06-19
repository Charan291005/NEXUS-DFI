import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader, Card, RiskBadge } from '../components/ui';
import { fmtDateTime } from '../utils/helpers';
import type { TimelineEvent } from '../types';
import { casesApi } from '../utils/api';

const TYPE_ICON: Record<string, string>  = { case:'📂', evidence:'💾', analysis:'🔍', alert:'🚨' };
const TYPE_COLOR: Record<string, string> = { case:'#3B82F6', evidence:'#60A5FA', analysis:'#10b981', alert:'#DC2626' };

export default function TimelinePage() {
  const [filter, setFilter] = useState<'all'|'case'|'evidence'|'analysis'|'alert'>('all');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    casesApi.timeline()
      .then(res => setEvents(res.data))
      .catch(err => console.error("Error fetching timeline:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => filter === 'all' || e.type === filter);

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, x: -24 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.45 } },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timeline Reconstruction"
        subtitle="Chronological event reconstruction for investigations"
        icon="⏱"
      />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {(['all','case','evidence','analysis','alert'] as const).map(f => (
          <motion.button
            key={f}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            id={`filter-timeline-${f}`}
            onClick={() => setFilter(f)}
            className={`btn-cyber text-xs py-1.5 capitalize ${filter === f ? 'btn-cyan' : 'btn-ghost'}`}
          >
            {f !== 'all' && TYPE_ICON[f]} {f}
          </motion.button>
        ))}
        <span className="ml-auto text-xs text-navy-500 self-center mono">{filtered.length} events</span>
      </div>

      {/* Timeline */}
      <Card className="relative min-h-[300px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-navy-400">Loading timeline...</div>
        ) : filtered.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-navy-400">No events found matching criteria.</div>
        ) : (
          <>
        {/* Animated vertical line */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ duration: 1.2 }}
          className="absolute left-[2.75rem] top-6 bottom-6 w-px"
          style={{ background: 'linear-gradient(180deg, #DC2626, rgba(220,38,38,0.1), transparent)' }}
        />

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1">
          {filtered.map((ev) => (
            <motion.div
              key={ev.id}
              variants={itemVariants}
              whileHover={{ x: 6 }}
              className="flex gap-4 py-4 px-2 rounded-xl hover:bg-navy-800/40 transition-all group cursor-default"
            >
              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 relative z-10"
                style={{
                  background: `${TYPE_COLOR[ev.type]}10`,
                  border: `1px solid ${TYPE_COLOR[ev.type]}20`,
                  boxShadow: `0 0 16px ${TYPE_COLOR[ev.type]}08`,
                }}
              >
                {TYPE_ICON[ev.type]}
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-navy-200 group-hover:text-white transition-colors font-display">{ev.title}</p>
                  {ev.severity && <RiskBadge level={ev.severity} />}
                </div>
                <p className="text-xs text-navy-400 mt-1 leading-relaxed">{ev.description}</p>
                <p className="text-[11px] text-navy-500 mono mt-1.5">{fmtDateTime(ev.timestamp)}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
        </>
        )}
      </Card>
    </div>
  );
}
