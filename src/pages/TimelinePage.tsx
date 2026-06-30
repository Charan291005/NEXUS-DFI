import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageHeader, Card, RiskBadge } from '../components/ui';
import { fmtDateTime } from '../utils/helpers';
import type { TimelineEvent } from '../types';
import { casesApi } from '../utils/api';

const TYPE_ICON: Record<string, string>  = { case: 'M', evidence: 'E', analysis: 'A', alert: '!' };
const TYPE_COLOR: Record<string, string> = { case: '#3B82F6', evidence: '#60A5FA', analysis: '#10b981', alert: '#DC2626' };
const TYPE_LABEL: Record<string, string> = { case: 'Mgmt', evidence: 'Evid', analysis: 'Analys', alert: 'Alert' };

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

  const filtered = useMemo(() => events.filter(e => filter === 'all' || e.type === filter), [events, filter]);

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.04 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timeline Reconstruction"
        subtitle="Chronological event reconstruction for investigations"
      />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {(['all','case','evidence','analysis','alert'] as const).map(f => (
          <button
            key={f}
            id={`filter-timeline-${f}`}
            onClick={() => setFilter(f)}
            className={`btn-cyber text-xs py-1.5 capitalize ${filter === f ? 'btn-cyan' : 'btn-ghost'}`}
          >
            {f === 'all' ? 'All Events' : TYPE_LABEL[f]}
          </button>
        ))}
        <span className="ml-auto text-xs text-navy-500 self-center mono">{filtered.length} events logged</span>
      </div>

      {/* Timeline */}
      <Card className="relative min-h-[300px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-navy-400">Retrieving timeline logs...</div>
        ) : filtered.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-navy-400">No events found matching criteria.</div>
        ) : (
          <>
        {/* Subtle vertical line */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ duration: 0.8 }}
          className="absolute left-[2.3rem] top-6 bottom-6 w-px bg-navy-700"
        />

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
          {filtered.map((ev) => (
            <motion.div
              key={ev.id}
              variants={itemVariants}
              className="flex gap-4 p-3 rounded-lg hover:bg-navy-800/30 transition-all border border-transparent hover:border-navy-700/50"
            >
              {/* SVG-style Icon Dot */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 relative z-10 font-mono"
                style={{
                  background: `${TYPE_COLOR[ev.type]}15`,
                  border: `1px solid ${TYPE_COLOR[ev.type]}30`,
                  color: TYPE_COLOR[ev.type]
                }}
              >
                {TYPE_ICON[ev.type]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{ev.title}</p>
                  {ev.severity && <RiskBadge level={ev.severity} />}
                </div>
                <p className="text-xs text-navy-300 mt-1 leading-relaxed">{ev.description}</p>
                <p className="text-[10px] text-navy-500 mono mt-2">{fmtDateTime(ev.timestamp)}</p>
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
